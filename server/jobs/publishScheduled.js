import Blog from "../models/blogModel.js";

// Publishes any post whose scheduled time has arrived. Runs on a timer
// (wired up in server.js via node-cron) rather than being triggered by
// any request — nobody needs to visit the site for a scheduled post to go live.
const publishScheduledBlogs = async () => {
  try {
    const result = await Blog.updateMany(
      {
        isPublished: false,
        scheduledFor: { $ne: null, $lte: new Date() },
      },
      {
        $set: { isPublished: true, publishedAt: new Date() },
        $unset: { scheduledFor: "" },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[scheduler] Published ${result.modifiedCount} scheduled blog(s).`);
    }
  } catch (error) {
    console.log("[scheduler] Failed to publish scheduled blogs:", error.message);
  }
};

export default publishScheduledBlogs;