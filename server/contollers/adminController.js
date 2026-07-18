import Blog from "../models/blogModel.js";
import Comment from "../models/commentModel.js";
import User from "../models/userModel.js";



// PATCH /api/admin/promote/:userId
// Protected by adminAuth in adminRoutes.js — only an existing admin can call this.
export const promoteToAdmin = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found." });
        }

        if (user.role === "admin") {
            return res.json({ success: true, message: `${user.email} is already an admin.` });
        }

        user.role = "admin";
        await user.save();

        res.json({ success: true, message: `${user.email} has been promoted to admin.` });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getAllBlogsAdmin = async (req, res) => {
    try {
        const blogs = await Blog.find({}).sort({ createdAt: -1 });
        res.json({ success: true, blogs });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const getAllComments = async (req, res) => {
    try {
        const comments = await Comment.find({})
            .populate("blog")
            .sort({ createdAt: -1 });
        res.json({ success: true, comments });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};



export const getDashboard = async (req, res) => {
    try {
        const recentBlogs = await Blog.find({}).sort({ createdAt: -1 }).limit(7);
        const blogs    = await Blog.countDocuments();
        const comments = await Comment.countDocuments();
        const drafts   = await Blog.countDocuments({ isPublished: false });

        res.json({ success: true, dashboardData: { blogs, comments, drafts, recentBlogs } });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const deleteCommentbyId = async (req, res) => {
    try {
        const { id } = req.body;
        await Comment.findByIdAndDelete(id);
        res.json({ success: true, message: "Comment deleted successfully." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const approveCommentbyId = async (req, res) => {
    try {
        const { id } = req.body;
        await Comment.findByIdAndUpdate(id, { isApproved: true });
        res.json({ success: true, message: "Comment approved!" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};