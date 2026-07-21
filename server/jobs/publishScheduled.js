import Blog from "../models/blogModel.js";
import Notification from "../models/notificationModel.js";

// Publishes any post whose scheduled time has arrived, and notifies its
// author. Runs on a timer (wired up in server.js via node-cron) rather
// than being triggered by any request.
const publishScheduledBlogs = async () => {
  try {
    // Find matching posts FIRST — updateMany alone wouldn't tell us which
    // specific blogs/authors to notify afterward.
    const dueBlogs = await Blog.find({
      isPublished: false,
      scheduledFor: { $ne: null, $lte: new Date() },
    }).select("_id author");

    if (dueBlogs.length === 0) return;

    const now = new Date();

    await Blog.updateMany(
      { _id: { $in: dueBlogs.map((b) => b._id) } },
      {
        $set: { isPublished: true, publishedAt: now },
        $unset: { scheduledFor: "" },
      }
    );

    await Notification.insertMany(
      dueBlogs.map((blog) => ({
        recipient: blog.author,
        actor: null,
        type: "schedule_published",
        blog: blog._id,
      }))
    );

    console.log(`[scheduler] Published ${dueBlogs.length} scheduled blog(s).`);
  } catch (error) {
    console.log("[scheduler] Failed to publish scheduled blogs:", error.message);
  }
};

export default publishScheduledBlogs;