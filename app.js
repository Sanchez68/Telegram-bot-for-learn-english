const TelegramApi = require("node-telegram-bot-api");
const {
  againOptions,
  levelOptions,
  startLearningOptions,
  quizGenerator,
} = require("./options");
const User = require("./models/User");
const mongoose = require("mongoose");
const token = "5328249325:AAFtp2eX8aph3Cmm0g1-QXCx52EWl4NZ5Ug";
const bot = new TelegramApi(token, { polling: true });
const connectMongoDB =
  "mongodb+srv://TestLA:okm@cluster0.wqrxk.mongodb.net/learnAuthDatabase";

const ALL_CARDS = [
  {
    name: "frog",
    img: "https://tlgrm.ru/_/stickers/faa/e35/faae3585-6cce-4cf5-b41a-b240e63f7fd0/1.jpg",
  },
  {
    name: "cat",
    img: "https://tlgrm.ru/_/stickers/d8c/a98/d8ca9867-01d8-342d-b2c1-940ea9ab187e/2.jpg",
  },
  {
    name: "dog",
    img: "https://tlgrm.ru/_/stickers/cf7/591/cf7591b6-db8d-3981-9107-bcaaeece8cdf/4.jpg",
  },
  {
    name: "candy",
    img: "https://tlgrm.ru/_/stickers/bab/cbf/babcbffa-13c5-370e-ad3f-685e7ae3f380/10.jpg",
  },
  {
    name: "potato",
    img: "https://upload.wikimedia.org/wikipedia/commons/4/47/Russet_potato_cultivar_with_sprouts.jpg",
  },
];

const getUserData = async (id) => {
  try {
    const userData = await User.find({ id: id.toString() });
    if (userData.length === 0) {
      const user = new User({
        id,
      });
      await user.save();
      return { id };
    } else {
      return userData[0];
    }
  } catch (e) {
    console.log(e);
    console.log("GET data err");
  }
};

const setUserData = async (id, data) => {
  try {
    const userId = await User.find({ id: id.toString() });
    if (userId.length === 0) {
      const user = new User({
        id,
      });
      await user.save();
    }
    await User.findOneAndUpdate({ id: id.toString() }, data);
    return { id, ...data };
  } catch (e) {
    console.log(e);
    console.log("SET data err");
  }
};

const deleteUserData = async (id) => {
  try {
    User.deleteOne({ id: id.toString() });
  } catch (e) {
    console.log(e);
    console.log("DELETE data err");
  }
};

const startLearn = async (chatId) => {
  let userData = await getUserData(chatId);

  await bot.sendMessage(chatId, `Спробуй вибрати правильну відповідь!`);

  let generatedQuiz = quizGenerator(
    ALL_CARDS,
    userData.level?.slice("level_") || 4
  );

  await bot.sendPhoto(chatId, generatedQuiz.correctAnswer.img);

  await setUserData(chatId, {
    correctAnswer: generatedQuiz.correctAnswer?.name || "",
  });
  await bot.sendMessage(
    chatId,
    "Яка правильна відповідь?",
    generatedQuiz.buttons
  );
};

const start = async () => {
  console.log("APP STARTED");
  try {
    await mongoose.connect(connectMongoDB, {
      useNewUrlParser: true,
    });
  } catch (e) {
    console.log(e);
    console.log("MONGO CONNECT ERR");
  }

  bot.setMyCommands([
    { command: "/start", description: "Початкове вітання" },
    { command: "/info", description: "Отримати інформацію про користувача" },
    { command: "/learn", description: "Почати Навчання" },
    { command: "/stop", description: "Зупинити навчання" },
    { command: "/delete", description: "Видалити дані про себе" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    console.log("message msg", msg);
    try {
      if (text === "/start") {
        let userData = await getUserData(chatId);

        await bot.sendMessage(chatId, `Привіт ${msg.from.first_name}!`);

        await bot.sendMessage(
          chatId,
          `Вітаю в телеграм боті для вивчення англійської.`
        );
        if (!userData.level) {
          await bot.sendMessage(chatId, `Який у тебе рівень знань?`);
          await bot.sendMessage(chatId, "Обирай", levelOptions);
        }
        return;
      }

      if (text === "/info") {
        let userData = await getUserData(chatId);
        let goodAnswers = userData?.goodAnswers || 0;
        let badAnswers = userData?.badAnswers || 0;

        return bot.sendMessage(
          chatId,
          `Привіт ${msg.from.first_name}) Твій рахунок налічує правильних відповідей: ${goodAnswers}, неправильних: ${badAnswers}`
        );
      }

      if (text === "/learn") {
        return startLearn(chatId);
      }
      if (text === "/delete") {
        return deleteUserData(chatId);
      }

      if (text === "/stop") {
        let userData = await getUserData(chatId);

        return bot.sendMessage(
          chatId,
          `Ваш рахунок: ${
            userData?.goodAnswers || 0
          }. Гарна робота! Повертайтесь пізніше) `
        );
      }

      return bot.sendMessage(chatId, "Я тебе не розумію, спробуй ще раз!)");
    } catch (e) {
      console.log(e);
      console.log("Проблемка з message");
      return bot.sendMessage(chatId, "Проблемка з message");
    }
  });

  bot.on("callback_query", async (msg) => {
    let data = msg.data;
    console.log(msg);
    const chatId = msg.message.chat.id;
    const msgId = msg.message.message_id;
    try {
      await bot.deleteMessage(chatId, msgId);
    } catch (e) {
      console.log(e);
      console.log("Delete button error");
    }

    try {
      if (data === "/learn") {
        return startLearn(chatId);
      }
      if (data === "/stop") {
        let userData = await getUserData(chatId);

        return bot.sendMessage(
          chatId,
          `Ваш рахунок :${
            userData?.goodAnswers || 0
          }. Гарна робота! Повертайтесь пізніше) `
        );
      }
      if (data.includes("level")) {
        data = data.replace("level_", "");
        await setUserData(chatId, { level: data });
        return bot.sendMessage(
          chatId,
          "Чудово, готовий почати?",
          startLearningOptions
        );
      }
      if (data.includes("quiz")) {
        data = data.replace("quiz_", "");
        let userData = await getUserData(chatId);

        if (userData.correctAnswer === data) {
          await setUserData(chatId, {
            goodAnswers: Number(userData?.goodAnswers || 0) + 1,
            correctAnswer: "",
          });
          return bot.sendMessage(
            chatId,
            "Правильно! Сробувати ще раз?",
            againOptions
          );
        } else {
          let userData = await getUserData(chatId);
          await setUserData(chatId, {
            badAnswers: Number(userData?.badAnswers || 0) + 1,
            correctAnswer: "",
          });
          return bot.sendMessage(
            chatId,
            "Помилка(, спробуй ще раз",
            againOptions
          );
        }
      }

      return bot.sendMessage(chatId, "Я тебе не розумію, спробуй ще раз!)");
    } catch (e) {
      console.log(e);
      console.log("Проблемка з callback_query");
    }
  });
};

start();
