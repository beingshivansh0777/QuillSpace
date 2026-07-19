import express from "express";
import {
    getAllBlogsAdmin,
    getAllComments,
    getDashboard,
    deleteCommentbyId,
    promoteToAdmin,
} from "../contollers/adminController.js";
import adminAuth from "../middleware/adminAuth.js";

const adminRouter = express.Router();

adminRouter.get("/blogs",            adminAuth, getAllBlogsAdmin);
adminRouter.get("/comments",         adminAuth, getAllComments);
adminRouter.get("/dashboard",        adminAuth, getDashboard);
adminRouter.post("/delete-comment",  adminAuth, deleteCommentbyId);
adminRouter.patch("/promote/:userId", adminAuth, promoteToAdmin);

export default adminRouter;