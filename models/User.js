const { Schema, model } = require("mongoose");

const schema = new Schema({
  id: {
    type: String,
    required: true,
  },
  name: {
    type: String,
  },
  level: {
    type: String,
  },
  goodAnswers: {
    type: String,
  },
  badAnswers: {
    type: [
      {
        type: String,
      },
    ],
  },
  correctAnswer: {
    type: String,
  },
});
const User = model("User", schema);

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
    await User.deleteOne({ id: id.toString() });
  } catch (e) {
    console.log(e);
    console.log("DELETE data err");
  }
};

module.exports = {
  User,
  getUserData,
  setUserData,
  deleteUserData,
};
