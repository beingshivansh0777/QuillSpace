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
  trackBlogView,
  getFollowingFeed,
  getBlogsByAuthor
} from "../contollers/blogController.js";
import upload from "../middleware/multer.js";
import auth from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import optionalAuth from "../middleware/optionalAuth.js";
import { aiLimiter } from "../middleware/rateLimiters.js";
import validate from "../middleware/validate.js";
import { addCommentSchema } from "../validators/schemas.js";

const blogRouter = express.Router();

/**
 * @openapi
 * /api/blog/add:
 *   post:
 *     summary: Create a new blog post (publish, draft, or scheduled)
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               blog:
 *                 type: string
 *                 description: JSON string of { title, subTitle, description, category, tags, isPublished, scheduledFor }
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Blog created
 */
blogRouter.post("/add", upload.single("image"), auth, addBlog);

/**
 * @openapi
 * /api/blog/all:
 *   get:
 *     summary: Get all published blogs
 *     tags: [Blog]
 *     responses:
 *       200:
 *         description: List of published blogs, most recent first
 */
blogRouter.get("/all", getAllBlogs);

blogRouter.get("/mine", auth, getMyBlogs);
blogRouter.get("/bookmarks", auth, getBookmarkedBlogs);
blogRouter.get("/bookmark-status/:blogId", auth, getBookmarkStatus);
blogRouter.get("/feed", auth, getFollowingFeed);
blogRouter.get("/author/:username", getBlogsByAuthor);   
blogRouter.post("/track-view/:blogId", optionalAuth, trackBlogView);

/**
 * @openapi
 * /api/blog/{blogId}:
 *   get:
 *     summary: Get a single blog by ID
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: blogId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: The blog post, with populated author info
 */
blogRouter.get("/:blogId", getBlogById);                              // keep below the literal paths above

blogRouter.post("/delete", adminAuth, deleteBlogById);                // admin — any post
blogRouter.post("/delete-own", auth, deleteOwnBlog);
blogRouter.post("/publish-now", auth, publishOwnBlog);                  // author — their own post, anytime
blogRouter.post("/toggle-publish", adminAuth, togglePublish);
blogRouter.patch("/update/:id", upload.single("image"), auth, updateBlog); // author — within 30 min

/**
 * @openapi
 * /api/blog/add-comment:
 *   post:
 *     summary: Add a comment or reply to a blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [blog, content]
 *             properties:
 *               blog: { type: string, description: "Blog ID" }
 *               content: { type: string }
 *               parent: { type: string, description: "Comment ID being replied to (omit for a top-level comment)" }
 *     responses:
 *       200:
 *         description: Comment posted
 */
blogRouter.post("/add-comment", auth, validate(addCommentSchema), addComment);

blogRouter.post("/comments", getBlogComments);
blogRouter.post("/generate", auth, aiLimiter, generateContent);

/**
 * @openapi
 * /api/blog/vote:
 *   post:
 *     summary: Like or dislike a blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [blogId, type]
 *             properties:
 *               blogId: { type: string }
 *               type: { type: string, enum: [like, dislike, none], description: "'none' removes an existing vote" }
 *     responses:
 *       200:
 *         description: Updated like/dislike counts and the caller's current vote
 */
blogRouter.post("/vote", auth, voteBlog);

blogRouter.post("/bookmark", auth, toggleBookmark);
blogRouter.post("/comment-like", auth, toggleCommentLike);

export default blogRouter;