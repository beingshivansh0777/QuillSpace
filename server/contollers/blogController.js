import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Blog from "../models/blogModel.js";
import Comment from "../models/commentModel.js";
import User from "../models/userModel.js";
import main from "../configs/gemini.js";

export const addBlog = async (req, res) => {
  try {
    const { title, subTitle, description, category } = JSON.parse(
      req.body.blog
    );
    const imageFile = req.file;

    if (!title || !description || !category || !imageFile) {
      return res.json({ success: false, message: "Missing required field." });
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

    // Blogs now go live immediately on submission — no admin review step.
    await Blog.create({
      title,
      subTitle,
      description,
      category,
      image,
      isPublished: true,
      author: req.user.id,
    });

    res.json({ success: true, message: "Blog published!" });
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

    const index = comment.likes.findIndex((u) => u.toString() === req.user.id);
    let liked;
    if (index === -1) {
      comment.likes.push(req.user.id);
      liked = true;
    } else {
      comment.likes.splice(index, 1);
      liked = false;
    }

    await comment.save();
    res.json({ success: true, liked, likeCount: comment.likes.length });
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

    const age = Date.now() - new Date(blog.createdAt).getTime();
    if (age > EDIT_WINDOW_MS) {
      return res.json({ success: false, message: "The 30-minute edit window has passed." });
    }

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

export const voteBlog = async (req, res) => {
  try {
    const { blogId, type, previousType } = req.body;

    const validTypes = ["like", "dislike", "none"];
    if (!validTypes.includes(type) || !validTypes.includes(previousType)) {
      return res.json({ success: false, message: "Invalid vote type." });
    }

    const update = {};
    if (previousType === "like") update.likes = (update.likes || 0) - 1;
    if (previousType === "dislike") update.dislikes = (update.dislikes || 0) - 1;
    if (type === "like") update.likes = (update.likes || 0) + 1;
    if (type === "dislike") update.dislikes = (update.dislikes || 0) + 1;

    const blog = await Blog.findByIdAndUpdate(
      blogId,
      { $inc: update },
      { new: true }
    );

    if (!blog) {
      return res.json({ success: false, message: "Blog not found." });
    }

    res.json({
      success: true,
      likes: blog.likes,
      dislikes: blog.dislikes,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
