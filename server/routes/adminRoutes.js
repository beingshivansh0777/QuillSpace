import express from "express";
import {
  adminLogin,
  approveCommentbyId,
  deleteCommentbyId,
  getAllBlogsAdmin,
  getAllComments,
  getDashboard,
} from "../contollers/adminController.js";
import auth from "../middleware/auth.js";

const adminRouter = express.Router();

adminRouter.post("/login", adminLogin);
adminRouter.get("/comments", auth, getAllComments);
adminRouter.get("/blogs", auth, getAllBlogsAdmin);
adminRouter.post("/delete-comment", auth, deleteCommentbyId);
adminRouter.post("/approve-comment", auth, approveCommentbyId);
adminRouter.get("/dashboard", auth, getDashboard);

export default adminRouter;
