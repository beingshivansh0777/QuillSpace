import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null, // null for system-triggered notifications (e.g. scheduled publish)
    },
    type: {
      type: String,
      enum: [
        "blog_comment",
        "comment_like",
        "schedule_published",
        "blog_deleted",
        "comment_deleted",
        "new_ticket",
        "ticket_reply",
        "ticket_status_changed",
      ],
      required: true,
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      default: null,
    },
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "blog",
      default: null,
    },
    title: {
      // snapshot of the blog title — needed for blog_deleted notifications,
      // since the referenced blog no longer exists to populate from
      type: String,
      default: null,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;