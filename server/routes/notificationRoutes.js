import express from "express";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../contollers/notificationController.js";
import auth from "../middleware/auth.js";

const notificationRouter = express.Router();

notificationRouter.get("/", auth, getNotifications);
notificationRouter.get("/unread-count", auth, getUnreadCount);
notificationRouter.patch("/read/:id", auth, markAsRead);
notificationRouter.patch("/read-all", auth, markAllAsRead);

export default notificationRouter;