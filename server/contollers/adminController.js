import Blog from "../models/blogModel.js";
import Comment from "../models/commentModel.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";


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
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [totalCount, blogs] = await Promise.all([
            Blog.countDocuments({}),
            Blog.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit),
        ]);

        res.json({
            success: true,
            blogs,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Comments are live the moment they're posted — this just lists everything
// for moderation. The only action available now is Delete.
export const getAllComments = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [totalCount, comments] = await Promise.all([
            Comment.countDocuments({}),
            Comment.find({})
                .populate("blog", "title")
                .populate("user", "name username")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        res.json({
            success: true,
            comments,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Builds an array of the last `months` month-labels (oldest first), e.g.
// ["Feb 2026", "Mar 2026", ... "Jul 2026"] — used to backfill months with
// zero activity so charts don't have gaps.
const getLastMonths = (months) => {
    const result = [];
    const now = new Date();
    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        result.push({
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
            label: d.toLocaleString("en-US", { month: "short", year: "numeric" }),
        });
    }
    return result;
};

const monthlyAggregation = (Model, months = 6) => {
    const since = new Date();
    since.setMonth(since.getMonth() - (months - 1));
    since.setDate(1);
    since.setHours(0, 0, 0, 0);

    return Model.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
            $group: {
                _id: {
                    year: { $year: "$createdAt" },
                    month: { $month: "$createdAt" },
                },
                count: { $sum: 1 },
            },
        },
    ]);
};

const fillMonthlyData = (aggResult, months = 6) => {
    const monthLabels = getLastMonths(months);
    const countMap = {};
    aggResult.forEach((r) => {
        const key = `${r._id.year}-${String(r._id.month).padStart(2, "0")}`;
        countMap[key] = r.count;
    });
    return monthLabels.map((m) => ({ month: m.label, count: countMap[m.key] || 0 }));
};

export const getDashboard = async (req, res) => {
    try {
        const recentBlogs = await Blog.find({}).sort({ createdAt: -1 }).limit(7);

        const [blogs, comments, drafts, published, totalUsers] = await Promise.all([
            Blog.countDocuments(),
            Comment.countDocuments(),
            Blog.countDocuments({ isPublished: false }),
            Blog.countDocuments({ isPublished: true }),
            User.countDocuments(),
        ]);

        const [blogMonthlyRaw, userMonthlyRaw, categoryRaw] = await Promise.all([
            monthlyAggregation(Blog, 6),
            monthlyAggregation(User, 6),
            Blog.aggregate([
                { $group: { _id: "$category", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
        ]);

        const monthlyBlogChart = fillMonthlyData(blogMonthlyRaw, 6);
        const monthlyUserChart = fillMonthlyData(userMonthlyRaw, 6);
        const categoryChart = categoryRaw.map((c) => ({
            category: c._id || "Uncategorized",
            count: c.count,
        }));

        res.json({
            success: true,
            dashboardData: {
                blogs,
                comments,
                drafts,
                totalUsers,
                published,
                unpublished: drafts,
                recentBlogs,
                monthlyBlogChart,
                monthlyUserChart,
                categoryChart,
            },
        });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

// Deleting a comment also removes any replies to it, so moderation doesn't
// leave orphaned replies pointing at a deleted parent.
export const deleteCommentbyId = async (req, res) => {
    try {
        const { id } = req.body;
        const comment = await Comment.findById(id).select("user blog");
        if (!comment) {
            return res.json({ success: false, message: "Comment not found." });
        }

        await Comment.findByIdAndDelete(id);
        await Comment.deleteMany({ parent: id });

        // Notify the commenter — skip legacy comments with no user ref,
        // and skip if an admin deleted their own comment.
        if (comment.user && comment.user.toString() !== req.user.id) {
            await Notification.create({
                recipient: comment.user,
                actor: null,
                type: "comment_deleted",
                blog: comment.blog,
            });
        }

        res.json({ success: true, message: "Comment deleted successfully." });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};