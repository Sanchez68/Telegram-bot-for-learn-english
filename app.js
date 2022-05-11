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
const chats = {};

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
    if (userId.length === 0) {
      const user = new User({
        id,
      });
      await user.save();
      return { id };
    } else {
      return userData[0];
    }

    console.log("userId", userData);
  } catch (e) {
    console.log("GET data err", e);
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
    console.log("SET data err", e);
  }
};

const startLearn = async (chatId) => {
  await bot.sendMessage(chatId, `Спробуй вибрати правильну відповідь!`);

  let generatedQuiz = quizGenerator(ALL_CARDS, 4);

  await bot.sendPhoto(chatId, generatedQuiz.correctAnswer.img);

  chats[chatId] = { correctAnswer: generatedQuiz.correctAnswer };
  await bot.sendMessage(chatId, "Відгадуй", generatedQuiz.buttons);
};

const start = async () => {
  console.log("APP STARTED");
  try {
    await mongoose.connect(connectMongoDB, {
      useNewUrlParser: true,
    });
  } catch (e) {
    console.log("MONGO CONNECT ERR");
  }

  bot.setMyCommands([
    { command: "/start", description: "Початкове вітання" },
    { command: "/info", description: "Отримати інформацію про користувача" },
    { command: "/learn", description: "Почати Навчання" },
    { command: "/stop", description: "Зупинити навчання" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    console.log("message msg", msg);
    try {
      if (text === "/start") {
        const userId = await User.find({ id: chatId.toString() }); //id:chatId.toString()
        console.log("userId", userId);
        if (userId.length === 0) {
          const user = new User({
            id: chatId,
            name: text,
          });
          await user.save();
        }
        await User.findOneAndUpdate(
          { id: chatId.toString() },
          { name: msg.from.first_name }
        );

        console.log(userId);
        await bot.sendMessage(chatId, `Привіт ${msg.from.first_name}!`);
        // await bot.sendSticker(
        //   chatId,
        //   "https://tlgrm.ru/_/stickers/ea5/382/ea53826d-c192-376a-b766-e5abc535f1c9/7.webp"
        // );
        await bot.sendMessage(
          chatId,
          `Вітаю тебе в телеграм боті для вивчення англійської. Який у тебе рівень знань?`
        );
        return bot.sendMessage(chatId, "Обирай", levelOptions);
      }

      if (text === "/info") {
        // const user = await UserModel.findOne({chatId})

        return bot.sendMessage(
          chatId,
          `Привіт ${
            msg.from.first_name
          }) Твій рахунок налічує правильних відповідей: ${
            chats[chatId]?.goodAnswers || 0
          }, неправильних: ${chats[chatId]?.badAnswers || 0}`
        );
      }

      if (text === "/learn") {
        return startLearn(chatId);
      }

      if (text === "/stop") {
        return bot.sendMessage(
          chatId,
          `Ваш рахунок :${
            chats[chatId].goodAnswers || 0
          }Гарна робота! Повертайся пізніше) `
        );
      }

      return bot.sendMessage(chatId, "Я тебе не розумію, спробуй ще раз!)");
    } catch (e) {
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
      console.log("Delete button error");
    }

    try {
      if (data === "/learn") {
        return startLearn(chatId);
      }
      if (data === "/stop") {
        return bot.sendMessage(
          chatId,
          `Ваш рахунок :${
            chats[chatId].goodAnswers || 0
          }. Гарна робота! Повертайся пізніше) `
        );
      }
      if (data.includes("level")) {
        await User.findOneAndUpdate(
          { id: chatId.toString() },
          { level: data.split("_")[1] }
        );
        return bot.sendMessage(
          chatId,
          "Чудово, готовий почати?",
          startLearningOptions
        );
      }
      if (data.includes("quiz")) {
        data = data.split("_")[1];
        if (chats[chatId].correctAnswer.name === data) {
          chats[chatId].goodAnswers = (chats[chatId].goodAnswers || 0) + 1;
          // TODO Set result in db
          return bot.sendMessage(
            chatId,
            "Правильно! Сробувати ще раз?",
            againOptions
          );
        } else {
          // TODO Set result in db
          chats[chatId].badAnswers = (chats[chatId].badAnswers || 0) + 1;
          return bot.sendMessage(
            chatId,
            "Помилка(, спробуй ще раз",
            againOptions
          );
        }
      }

      return bot.sendMessage(chatId, "Я тебе не розумію, спробуй ще раз!)");
    } catch (e) {
      console.log("Проблемка з callback_query");
    }
  });
};

start();
