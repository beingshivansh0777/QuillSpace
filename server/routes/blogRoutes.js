import express from "express";
import {
  addBlog,
  addComment,
  deleteBlogById,
  deleteOwnBlog,
  generateContent,
  getAllBlogs,
  getBlogById,
  getBlogComments,
  getBookmarkedBlogs,
  getBookmarkStatus,
  getMyBlogs,
  togglePublish,
  toggleBookmark,
  toggleCommentLike,
  publishOwnBlog,
  updateBlog,
  voteBlog,
} from "../contollers/blogController.js";
import upload from "../middleware/multer.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const blogRouter = express.Router();

blogRouter.post("/add", upload.single("image"), auth, addBlog);
blogRouter.get("/all", getAllBlogs);
blogRouter.get("/mine", auth, getMyBlogs);
blogRouter.get("/bookmarks", auth, getBookmarkedBlogs);
blogRouter.get("/bookmark-status/:blogId", auth, getBookmarkStatus);
blogRouter.get("/:blogId", getBlogById);                              // keep below the literal paths above
blogRouter.post("/delete", adminAuth, deleteBlogById);                // admin — any post
blogRouter.post("/delete-own", auth, deleteOwnBlog);
blogRouter.post("/publish-now", auth, publishOwnBlog);                  // author — their own post, anytime
blogRouter.post("/toggle-publish", adminAuth, togglePublish);
blogRouter.patch("/update/:id", upload.single("image"), auth, updateBlog); // author — within 30 min
blogRouter.post("/add-comment", auth, addComment);
blogRouter.post("/comments", getBlogComments);
blogRouter.post("/generate", auth, generateContent);
blogRouter.post("/vote", auth, voteBlog);
blogRouter.post("/bookmark", auth, toggleBookmark);
blogRouter.post("/comment-like", auth, toggleCommentLike);

export default blogRouter;