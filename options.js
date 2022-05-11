function getMultipleRandom(arr, num) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());

  return shuffled.slice(0, num);
}

function ucFirst(str) {
  if (!str) return str;

  return str[0].toUpperCase() + str.slice(1);
}

module.exports = {
  gameOptions: {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [
          { text: "1", callback_data: "1" },
          { text: "2", callback_data: "2" },
          { text: "3", callback_data: "3" },
        ],
        [
          { text: "4", callback_data: "4" },
          { text: "5", callback_data: "5" },
          { text: "6", callback_data: "6" },
        ],
        [
          { text: "7", callback_data: "7" },
          { text: "8", callback_data: "8" },
          { text: "9", callback_data: "9" },
        ],
        [{ text: "0", callback_data: "0" }],
      ],
    }),
  },

  againOptions: {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [
          { text: "Спробувати ще", callback_data: "/learn" },
          { text: "Відпочити😴", callback_data: "/stop" },
        ],
      ],
    }),
  },
  levelOptions: {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: "Початковий", callback_data: "level_2" }],
        [{ text: "Середній", callback_data: "level_4" }],
        [{ text: "Досвідчений", callback_data: "level_6" }],
      ],
    }),
  },
  startLearningOptions: {
    reply_markup: JSON.stringify({
      inline_keyboard: [
        [{ text: "Розпочати навчання", callback_data: "/learn" }],
      ],
    }),
  },
  quizGenerator: (allValues, limit) => {
    let quizArr = getMultipleRandom(allValues, limit);
    let correctAnswer = getMultipleRandom(quizArr, 1)[0];
    return {
      quizArr,
      correctAnswer,
      buttons: {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            quizArr.map((el) => ({
              text: ucFirst(el.name),
              callback_data: `quiz_${el.name}`,
            })),
          ],
        }),
      },
    };
  },
};
