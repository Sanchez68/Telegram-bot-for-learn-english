const TelegramApi = require("node-telegram-bot-api");
const {
  againOptions,
  levelOptions,
  startLearningOptions,
  quizGenerator,
} = require("./options");
const { getUserData, setUserData, deleteUserData } = require("./models/User");
const mongoose = require("mongoose");
const { uniqueArray } = require("./helpers");
const { ALL_CARDS } = require("./Card");
const token = "5328249325:AAFtp2eX8aph3Cmm0g1-QXCx52EWl4NZ5Ug";
const bot = new TelegramApi(token, { polling: true });
const connectMongoDB =
  "mongodb+srv://TestLA:okm@cluster0.wqrxk.mongodb.net/learnAuthDatabase";

const errorHandler = (e, place, chatId) => {
  console.log(e);
  console.log(`Виникла проблема у: ${place}`);
  chatId && bot.sendMessage(chatId, `Виникла якась проблема(`);
};

const startLearn = async (chatId) => {
  try {
    let userData = await getUserData(chatId);

    await bot.sendMessage(chatId, `Спробуй вибрати правильну відповідь!`);

    let generatedQuiz = quizGenerator(
      ALL_CARDS,
      userData?.level?.slice("level_") || 4
    );
    console.log("CORRECT ANSWER OBJ", generatedQuiz.correctAnswer);
    await bot.sendPhoto(chatId, generatedQuiz.correctAnswer.img);

    await setUserData(chatId, {
      correctAnswer: generatedQuiz.correctAnswer?.name || "",
    });
    await bot.sendMessage(
      chatId,
      "Яка правильна відповідь?",
      generatedQuiz.buttons
    );
  } catch (e) {
    await errorHandler(e, "startLearn", chatId);
  }
};

const start = async () => {
  console.log("APP STARTED");
  try {
    await mongoose.connect(connectMongoDB, {
      useNewUrlParser: true,
    });
  } catch (e) {
    await errorHandler(e, "MONGO CONNECT");
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
        if (!userData?.level) {
          await bot.sendMessage(chatId, `Який у тебе рівень знань?`);
          await bot.sendMessage(chatId, "Обирай", levelOptions);
        }
        return;
      }

      if (text === "/info") {
        let userData = await getUserData(chatId);
        let goodAnswers = userData?.goodAnswers || 0;
        let badAnswers = userData?.badAnswers?.length || 0;
        await bot.sendMessage(
          chatId,
          `Привіт ${msg.from.first_name}) Твій рахунок налічує правильних відповідей: ${goodAnswers}, неправильних: ${badAnswers}`
        );
        if (badAnswers > 0) {
          let badAnswersList = userData?.badAnswers || [];

          await bot.sendMessage(
            chatId,
            `Серед них варто звернути увагу на слова: ${uniqueArray(
              badAnswersList
            ).reduce((acc, el) => (acc ? acc + ", " + el : el), "")}`
          );
        }
        return;
      }

      if (text === "/learn") {
        return startLearn(chatId);
      }
      if (text === "/delete") {
        await deleteUserData(chatId);
        return bot.sendMessage(chatId, "Дані очищено");
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
      await errorHandler(e, " message", chatId);
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
      await errorHandler(e, "delete button", chatId);
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
            badAnswers: [
              ...(userData.badAnswers || []),
              userData.correctAnswer,
            ].filter(Boolean),
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
      await errorHandler(e, " callback_query", chatId);
    }
  });
};

start();
