const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // fast lookup for login
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // by default response me nahi aaye isiliye, agar jarurat ho to hatana hai
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    resetPasswordToken: String,
    resetPasswordExpire: Date,

    isActive: {
      type: Boolean,
      default: true, //delete or deactivate 
    },
  },
  {
    timestamps: true, // createdAt, updatedAt ke liye hai agar jarurat pade to
  }
);