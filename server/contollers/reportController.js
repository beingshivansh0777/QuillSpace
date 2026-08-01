import Blog from "../models/blogModel.js";
import Comment from "../models/commentModel.js";
import Notification from "../models/notificationModel.js";
import Report from "../models/reportModel.js";


// POST /api/reports — any logged-in user can flag a blog or comment
export const createReport = async (req, res) => {
  try {
    const { targetType, targetId, reason } = req.body;

    if (!["blog", "comment"].includes(targetType)) {
      return res.json({ success: false, message: "Invalid report type." });
    }
    if (!reason || !reason.trim()) {
      return res.json({ success: false, message: "Please describe the issue." });
    }

    const existing = await Report.findOne({
      reporter: req.user.id,
      targetType,
      targetId,
      status: "pending",
    });
    if (existing) {
      return res.json({ success: true, message: "You've already reported this." });
    }

    await Report.create({
      reporter: req.user.id,
      targetType,
      targetId,
      reason: reason.trim(),
    });

    res.json({ success: true, message: "Thanks — our team will review this." });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/admin/reports — admin only, pending reports with target content attached
export const getReports = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [totalCount, reports] = await Promise.all([
      Report.countDocuments({ status: "pending" }),
      Report.find({ status: "pending" })
        .populate("reporter", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    // targetId is polymorphic (blog or comment) — fetch each target manually
    // since a single populate() can't follow two different collections.
    const blogIds = reports.filter((r) => r.targetType === "blog").map((r) => r.targetId);
    const commentIds = reports.filter((r) => r.targetType === "comment").map((r) => r.targetId);

    const [blogs, comments] = await Promise.all([
      Blog.find({ _id: { $in: blogIds } }).select("title").lean(),
      Comment.find({ _id: { $in: commentIds } }).select("content blog").lean(),
    ]);

    const blogMap = Object.fromEntries(blogs.map((b) => [b._id.toString(), b]));
    const commentMap = Object.fromEntries(comments.map((c) => [c._id.toString(), c]));

    const enriched = reports.map((r) => ({
      ...r,
      target:
        r.targetType === "blog"
          ? blogMap[r.targetId.toString()] || null
          : commentMap[r.targetId.toString()] || null,
    }));

    res.json({
      success: true,
      reports: enriched,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/reports/dismiss/:id — mark reviewed, no content action taken
export const dismissReport = async (req, res) => {
  try {
    await Report.findByIdAndUpdate(req.params.id, { status: "resolved" });
    res.json({ success: true, message: "Report dismissed." });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// POST /api/admin/reports/delete-content/:id — deletes the reported content,
// notifies its owner (reusing the same pattern as regular admin moderation),
// and marks the report resolved.
export const deleteReportedContent = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.json({ success: false, message: "Report not found." });
    }

    if (report.targetType === "blog") {
      const blog = await Blog.findById(report.targetId).select("title author");
      if (blog) {
        await Blog.findByIdAndDelete(blog._id);
        await Comment.deleteMany({ blog: blog._id });
        if (blog.author.toString() !== req.user.id) {
          await Notification.create({
            recipient: blog.author,
            actor: null,
            type: "blog_deleted",
            title: blog.title,
          });
        }
      }
    } else {
      const comment = await Comment.findById(report.targetId).select("user blog");
      if (comment) {
        await Comment.findByIdAndDelete(comment._id);
        await Comment.deleteMany({ parent: comment._id });
        if (comment.user && comment.user.toString() !== req.user.id) {
          await Notification.create({
            recipient: comment.user,
            actor: null,
            type: "comment_deleted",
            blog: comment.blog,
          });
        }
      }
    }

    report.status = "resolved";
    await report.save();

    res.json({ success: true, message: "Content removed and report resolved." });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};