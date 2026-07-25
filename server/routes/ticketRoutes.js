import express from "express";
import {
  createTicket,
  getMyTickets,
  getAllTickets,
  getTicketById,
  replyToTicket,
  updateTicketStatus,
} from "../contollers/ticketControllers.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/multer.js";

const ticketRouter = express.Router();

ticketRouter.post("/", upload.single("screenshot"), auth, createTicket);
ticketRouter.get("/mine", auth, getMyTickets);
ticketRouter.get("/admin/all", adminAuth, getAllTickets);
ticketRouter.get("/:id", auth, getTicketById);               // must come after /mine and /admin/all
ticketRouter.post("/:id/reply", auth, replyToTicket);
ticketRouter.patch("/:id/status", adminAuth, updateTicketStatus);

export default ticketRouter;