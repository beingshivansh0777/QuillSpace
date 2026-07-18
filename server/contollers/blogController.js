import fs from "fs";
import imagekit from "../configs/imageKit.js";
import Blog from "../models/blogModel.js";
import Comment from "../models/commentModel.js";
import main from "../configs/gemini.js";
import User from "../models/userModel.js";

export const addBlog = async (req, res) => {
  try {
    const { title, subTitle, description, category, isPublished } = JSON.parse(
      req.body.blog,
    );
    const imageFile = req.file;

    // Check if al fields are present !
    if (!title || !description || !category || !imageFile) {
      return res.json({ success: false, message: "Missing required field." });
    }
    const fileBuffer = fs.readFileSync(imageFile.path);
    //Uplaoad Image to Imagekit
    const response = await imagekit.upload({
      file: fileBuffer,
      fileName: imageFile.originalname,
      folder: "/blogs",
    });

    //Optimization through imagekit URL transformation

    const optimizedImageUrl = imagekit.url({
      path: response.filePath,
      transformation: [
        { quality: "auto" }, //Auto compression
        { format: "webp" }, //Convert to modern format
        { width: "1280" }, //Width resizing
      ],
    });

    const image = optimizedImageUrl;

    await Blog.create({
      title,
      subTitle,
      description,
      category,
      image,
      isPublished,
    });

    res.json({ success: true, message: "Blog added sucessfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ isPublished: true });
    res.json({ success: true, blogs });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getBlogById = async (req, res) => {
  try {
    const { blogId } = req.params;
    const blog = await Blog.findById(blogId);
    if (!blog) {
      return res.json({ success: false, message: "Blog Not Found!" });
    }
    res.json({ success: true, blog });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteBlogById = async (req, res) => {
  try {
    const { id } = req.body;
    await Blog.findByIdAndDelete(id);

    // Delete all comments associated with the blog!
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

export const addComment = async (req, res) => {
  try {
    const { blog, content } = req.body; // name no longer comes from the client

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.json({
        success: false,
        message: "Please login first..",
      });
    }

    await Comment.create({ blog, name: user.name, content });
    res.json({ success: true, message: "Comment added for review" });
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

    // Remove the old vote's count, if there was one
    if (previousType === "like") update.likes = (update.likes || 0) - 1;
    if (previousType === "dislike") update.dislikes = (update.dislikes || 0) - 1;

    // Add the new vote's count, if it isn't "none"
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


export const getBlogComments = async (req, res) => {
  try {
    const { blogId } = req.body;
    const comments = await Comment.find({
      blog: blogId,
      isApproved: true,
    }).sort({ createdAt: -1 });
    res.json({ success: true, comments });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const generateContent = async (req, res) => {
  try {
    const { prompt } = req.body;
    const content = await main(
      prompt + "Generate a blog content for this topic in simple text format",
    );
    res.json({ success: true, content });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
