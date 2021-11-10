const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
    },
    keywords: {
        type: Array,
        default: [],
    },
});

const User = mongoose.model("User", UserSchema);

module.exports = User;