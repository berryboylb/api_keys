const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  api_key: {
    type: String,
    required: true,
    unique: true,
  },
  token: {
    type: String,
    default: null,
    unique: true,
  },
  usage: [
    {
      count: {
        type: Number,
        default: 0,
      },
      date: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = User = mongoose.model("user", UserSchema);
