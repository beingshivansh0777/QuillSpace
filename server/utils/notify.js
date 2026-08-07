import Notification from "../models/notificationModel.js";
import { emitToUser } from "../configs/socket.js";

const POPULATE_ACTOR = "name username avatar";
const POPULATE_BLOG = "title";

// Drop-in replacement for `Notification.create(data)`. Creates the
// notification exactly as before, then populates it the same way
// notificationController's getNotifications does, and pushes it live to
// the recipient's socket in addition to the normal DB write (which is
// still what the bell's initial fetch / fallback poll reads from).
export const notifyUser = async (data) => {
  const notification = await Notification.create(data);
  const populated = await notification.populate([
    { path: "actor", select: POPULATE_ACTOR },
    { path: "blog", select: POPULATE_BLOG },
  ]);
  emitToUser(data.recipient.toString(), "notification", populated);
  return populated;
};

// Drop-in replacement for `Notification.insertMany(arrayOfNotifications)`.
// Each item in `notifications` is a full notification object (its own
// recipient/actor/type/blog/ticket/title as needed) — used both for
// "same event, many recipients" (e.g. notifying every admin) and "many
// events, one per item" (e.g. each due scheduled-blog notifying its own author).
export const notifyMany = async (notifications) => {
  if (!notifications.length) return [];

  const inserted = await Notification.insertMany(notifications);
  const populated = await Notification.find({ _id: { $in: inserted.map((d) => d._id) } })
    .populate("actor", POPULATE_ACTOR)
    .populate("blog", POPULATE_BLOG);

  populated.forEach((n) => emitToUser(n.recipient.toString(), "notification", n));
  return populated;
};