const mongoose = require("mongoose");

const commitSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },

    branch: {
      type: String,
      required: true,
      index: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // previous commit reference (history chain banane ke liye)
    parentCommit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Commit",
      default: null,
    },

    snapshot: {
      type: String,
      default: null, // document content at that time
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);