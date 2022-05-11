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
});

module.exports = model("User", schema);
