import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Blog from "../models/blogModel.js";
import Comment from "../models/commentModel.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import main from "../configs/gemini.js";

export const addBlog = async (req, res) => {
  try {
    const { title, subTitle, description, category, isPublished, scheduledFor } = JSON.parse(
      req.body.blog
    );
    const imageFile = req.file;

    if (!title || !description || !category || !imageFile) {
      return res.json({ success: false, message: "Missing required field." });
    }

    let publishNow = !!isPublished;
    let scheduleDate = null;

    if (scheduledFor) {
      scheduleDate = new Date(scheduledFor);
      if (isNaN(scheduleDate.getTime()) || scheduleDate <= new Date()) {
        return res.json({ success: false, message: "Scheduled time must be in the future." });
      }
      publishNow = false; // a scheduled post isn't live yet, regardless of what else was sent
    }

    const fileBuffer = fs.readFileSync(imageFile.path);

    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: "/blogs",
    });

    const optimizedImageUrl = imagekit.url({
      path: response.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "1280" },
      ],
    });

    const image = optimizedImageUrl;

    await Blog.create({
      title,
      subTitle,
      description,
      category,
      image,
      isPublished: publishNow,
      publishedAt: publishNow ? new Date() : null,
      scheduledFor: scheduleDate,
      author: req.user.id,
    });

    const message = scheduleDate
      ? "Blog scheduled!"
      : publishNow
      ? "Blog published!"
      : "Saved as draft.";

    res.json({ success: true, message });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true })
      .populate("author", "name username")
      .sort({ createdAt: -1 });
    res.json({ success: true, blogs });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const { blogId } = req.params;
    const blog = await Blog.findById(blogId).populate("author", "name username");
    if (!blog) {
      return res.json({ success: false, message: "Blog Not Found!" });
    }
    res.json({ success: true, blog });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Blogs written by the currently logged-in user (any status)
export const getMyBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id }).sort({ createdAt: -1 });
    res.json({ success: true, blogs });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteBlogById = async (req, res) => {
  try {
    const { id } = req.body;
    await Blog.findByIdAndDelete(id);
    await Comment.deleteMany({ blog: id });
    res.json({ success: true, message: "Blog deleted successfully." });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const togglePublish = async (req, res) => {
  try {
    const { id } = req.body;
    const blog = await Blog.findById(id);
    blog.isPublished = !blog.isPublished;
    await blog.save();
    res.json({ success: true, message: "Blog status updated." });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/blog/add-comment
// body: { blog, content, parent? } — parent is the comment id being replied to (optional)
export const addComment = async (req, res) => {
  try {
    const { blog, content, parent } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.json({ success: false, message: "User not found. Please login again." });
    }

    const comment = await Comment.create({
      blog,
      user: req.user.id,
      name: user.name,
      content,
      parent: parent || null,
    });

    // Notify the blog's author that someone commented — skip if they
    // commented on their own post.
    const blogDoc = await Blog.findById(blog).select("author");
    if (blogDoc && blogDoc.author.toString() !== req.user.id) {
      await Notification.create({
        recipient: blogDoc.author,
        actor: req.user.id,
        type: "blog_comment",
        blog,
        comment: comment._id,
      });
    }

    const populated = await comment.populate("user", "name username avatar");
    res.json({ success: true, message: "Comment posted!", comment: populated });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/blog/comments — all comments for a blog, live (no approval gate),
// organized into a two-level tree: top-level comments each with a `replies` array.
export const getBlogComments = async (req, res) => {
  try {
    const { blogId } = req.body;
    const all = await Comment.find({ blog: blogId })
      .populate("user", "name username avatar")
      .sort({ createdAt: -1 });

    const topLevel = all.filter((c) => !c.parent);
    const replies = all.filter((c) => c.parent);

    const tree = topLevel.map((c) => ({
      ...c.toObject(),
      replies: replies
        .filter((r) => r.parent.toString() === c._id.toString())
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
    }));

    res.json({ success: true, comments: tree });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/blog/comment-like — toggle like on a comment
export const toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.body;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.json({ success: false, message: "Comment not found." });
    }

    const alreadyLiked = comment.likes.some((u) => u.toString() === req.user.id);

    // Atomic $addToSet/$pull — updates only the `likes` array without
    // re-validating the rest of the document (important for comments
    // created before the `user` field existed on the schema).
    const updated = await Comment.findByIdAndUpdate(
      commentId,
      alreadyLiked
        ? { $pull: { likes: req.user.id } }
        : { $addToSet: { likes: req.user.id } },
      { new: true }
    );

    // Only notify on a fresh like, not on unlike, and never notify yourself.
    if (!alreadyLiked && comment.user.toString() !== req.user.id) {
      await Notification.create({
        recipient: comment.user,
        actor: req.user.id,
        type: "comment_like",
        blog: comment.blog,
        comment: comment._id,
      });
    }

    res.json({ success: true, liked: !alreadyLiked, likeCount: updated.likes.length });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const generateContent = async (req, res) => {
  try {
    const { prompt } = req.body;
    const content = await main(prompt + 'Generate a blog content for this topic in simple text format');
    res.json({ success: true, content });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const EDIT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

// PATCH /api/blog/update/:id — author only, within 30 minutes of creation
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.json({ success: false, message: "Blog not found." });
    }
    if (blog.author.toString() !== req.user.id) {
      return res.json({ success: false, message: "You can only edit your own posts." });
    }

    if (blog.isPublished) {
      const age = Date.now() - new Date(blog.publishedAt).getTime();
      if (age > EDIT_WINDOW_MS) {
        return res.json({ success: false, message: "The 30-minute edit window has passed." });
      }
    }
    // Drafts and scheduled (not yet published) posts have no time limit —
    // nobody's seen them yet, so there's nothing to protect against.

    const { title, subTitle, description, category } = JSON.parse(req.body.blog);

    blog.title = title ?? blog.title;
    blog.subTitle = subTitle ?? blog.subTitle;
    blog.description = description ?? blog.description;
    blog.category = category ?? blog.category;

    if (req.file) {
      const fileBuffer = fs.readFileSync(req.file.path);
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: req.file.originalname,
        folder: "/blogs",
      });
      blog.image = imagekit.url({
        path: response.filePath,
        transformation: [
          { quality: "auto" },
          { format: "webp" },
          { width: "1280" },
        ],
      });
    }

    await blog.save();
    res.json({ success: true, message: "Blog updated.", blog });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/blog/publish-now — author manually publishes their own draft/scheduled post
export const publishOwnBlog = async (req, res) => {
  try {
    const { id } = req.body;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.json({ success: false, message: "Blog not found." });
    }
    if (blog.author.toString() !== req.user.id) {
      return res.json({ success: false, message: "You can only publish your own posts." });
    }
    if (blog.isPublished) {
      return res.json({ success: false, message: "This post is already published." });
    }

    blog.isPublished = true;
    blog.publishedAt = new Date();
    blog.scheduledFor = null;
    await blog.save();

    res.json({ success: true, message: "Blog published!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/blog/delete-own — author can delete their own post anytime
export const deleteOwnBlog = async (req, res) => {
  try {
    const { id } = req.body;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.json({ success: false, message: "Blog not found." });
    }
    if (blog.author.toString() !== req.user.id) {
      return res.json({ success: false, message: "You can only delete your own posts." });
    }

    await Blog.findByIdAndDelete(id);
    await Comment.deleteMany({ blog: id });

    res.json({ success: true, message: "Blog deleted." });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/blog/bookmark — toggle a blog in the logged-in user's bookmarks
export const toggleBookmark = async (req, res) => {
  try {
    const { blogId } = req.body;
    const user = await User.findById(req.user.id);

    const index = user.bookmarks.findIndex((b) => b.toString() === blogId);
    let bookmarked;

    if (index === -1) {
      user.bookmarks.push(blogId);
      bookmarked = true;
    } else {
      user.bookmarks.splice(index, 1);
      bookmarked = false;
    }

    await user.save();
    res.json({ success: true, bookmarked });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/blog/bookmark-status/:blogId
export const getBookmarkStatus = async (req, res) => {
  try {
    const { blogId } = req.params;
    const user = await User.findById(req.user.id);
    const bookmarked = user.bookmarks.some((b) => b.toString() === blogId);
    res.json({ success: true, bookmarked });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/blog/bookmarks — full list of the logged-in user's saved blogs
export const getBookmarkedBlogs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: "bookmarks",
      populate: { path: "author", select: "name username" },
    });
    res.json({ success: true, blogs: user.bookmarks });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/blog/vote — requires login. body: { blogId, type }
// type: "like" | "dislike" | "none" (clicking an active vote again removes it)
export const voteBlog = async (req, res) => {
  try {
    const { blogId, type } = req.body;
    const validTypes = ["like", "dislike", "none"];
    if (!validTypes.includes(type)) {
      return res.json({ success: false, message: "Invalid vote type." });
    }

    const userId = req.user.id;

    // Step 1: always remove the user from both arrays first (in its own
    // update — MongoDB won't allow $pull and $addToSet on the same field
    // in a single call, which is what caused the "conflict" error).
    await Blog.findByIdAndUpdate(blogId, {
      $pull: { likedBy: userId, dislikedBy: userId },
    });

    // Step 2: add them to the correct array, if voting for one.
    let blog;
    if (type === "like") {
      blog = await Blog.findByIdAndUpdate(
        blogId,
        { $addToSet: { likedBy: userId } },
        { new: true }
      );
    } else if (type === "dislike") {
      blog = await Blog.findByIdAndUpdate(
        blogId,
        { $addToSet: { dislikedBy: userId } },
        { new: true }
      );
    } else {
      blog = await Blog.findById(blogId);
    }

    if (!blog) {
      return res.json({ success: false, message: "Blog not found." });
    }

    res.json({
      success: true,
      likes: blog.likedBy.length,
      dislikes: blog.dislikedBy.length,
      myVote: blog.likedBy.some((u) => u.toString() === userId)
        ? "like"
        : blog.dislikedBy.some((u) => u.toString() === userId)
        ? "dislike"
        : "none",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};