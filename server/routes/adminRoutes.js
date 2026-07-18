import express from "express";
import {
    getAllBlogsAdmin,
    getAllComments,
    getDashboard,
    deleteCommentbyId,
    approveCommentbyId,
} from "../contollers/adminController.js";
import adminAuth from "../middleware/adminAuth.js";

const adminRouter = express.Router();

// ✅ All routes protected by adminAuth — only role:"admin" can access
adminRouter.get("/blogs",            adminAuth, getAllBlogsAdmin);
adminRouter.get("/comments",         adminAuth, getAllComments);
adminRouter.get("/dashboard",        adminAuth, getDashboard);
adminRouter.post("/delete-comment",  adminAuth, deleteCommentbyId);
adminRouter.post("/approve-comment", adminAuth, approveCommentbyId);

export default adminRouter;