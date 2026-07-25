import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const ticketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: ["bug", "feature_request", "account_issue", "other"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    screenshot: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

const SupportTicket = mongoose.model("SupportTicket", ticketSchema);

export default SupportTicket;