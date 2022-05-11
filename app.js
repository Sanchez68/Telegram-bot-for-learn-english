const TelegramApi = require("node-telegram-bot-api");
const { gameOptions, againOptions } = require("./options");
// const sequelize = require('./db ');
const UserModel = require("./models");
const User = require("./models/User");
const mongoose = require("mongoose");
const token = "5328249325:AAFtp2eX8aph3Cmm0g1-QXCx52EWl4NZ5Ug";
const bot = new TelegramApi(token, { polling: true });
const connectMongoDB =
  "mongodb+srv://TestLA:okm@cluster0.wqrxk.mongodb.net/learnAuthDatabase";
const chats = {};

const startGame = async (chatId) => {
  await bot.sendMessage(
    chatId,
    `Зараз я загадаю тобі цифру від 0 до 9, а ти повинен її вгадати!`
  );
  const randomNumber = Math.floor(Math.random() * 10);
  chats[chatId] = randomNumber;
  await bot.sendMessage(chatId, "Відгадуй", gameOptions);
};

const start = async () => {
  try {
    await mongoose.connect(connectMongoDB, {
      useNewUrlParser: true,
    });
  } catch (e) {
    console.log(e);
  }

  bot.setMyCommands([
    { command: "/start", description: "Початкове вітання" },
    { command: "/info", description: "Отримати інформацію про користувача" },
    { command: "/game", description: "Іграти в вгадай цифру" },
  ]);

  bot.on("message", async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    try {
      if (text === "/start") {
        const userId = await User.findById(chatId);
        if (!userId) {
          const todo = new User({
            id: chatId,
            name: text,
          });

          await todo.save();
        }
        // await UserModel.create({chatId})
        console.log(userId);
        await bot.sendSticker(
          chatId,
          "https://tlgrm.ru/_/stickers/ea5/382/ea53826d-c192-376a-b766-e5abc535f1c9/7.webp"
        );
        return bot.sendMessage(
          chatId,
          `Вітаю в телеграм боті для вивчення англійської. Сьогодні будемо проходити перший урок`
        );
      }
      if (text === "/info") {
        // const user = await UserModel.findOne({chatId})
        return bot.sendMessage(
          chatId,
          `Тебе звати ${msg.from.first_name} ${msg.from.last_name}, в ігрі в тебе правильних відповідей ${user.right}, неправильних ${user.wrong}`
        );
      }
      if (text === "/game") {
        return startGame(chatId);
      }
      return bot.sendMessage(chatId, "Я тебе не розумію, спробуй ще раз!)");
    } catch (e) {
      return bot.sendMessage(chatId, "Сталася якась помилка!)");
    }
  });

  bot.on("callback_query", async (msg) => {
    const data = msg.data;
    const chatId = msg.message.chat.id;
    if (data === "/again") {
      return startGame(chatId);
    }
    const user = await UserModel.findOne({ chatId });
    if (data == chats[chatId]) {
      user.right += 1;
      await bot.sendMessage(
        chatId,
        `Вітаю, ти відгадав цифру ${chats[chatId]}`,
        againOptions
      );
    } else {
      user.wrong += 1;
      await bot.sendMessage(
        chatId,
        `На жаль ти не вгадав, бот загадав цифру ${chats[chatId]}`,
        againOptions
      );
    }
    // await user.save();
  });
};

start();
