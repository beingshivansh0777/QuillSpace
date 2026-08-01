import Notification from "../models/notificationModel.js";

// GET /api/notifications — paginated, most recent first
export const getNotifications = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [totalCount, notifications] = await Promise.all([
      Notification.countDocuments({ recipient: req.user.id }),
      Notification.find({ recipient: req.user.id })
        .populate("actor", "name username avatar")
        .populate("blog", "title")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({
      success: true,
      notifications,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasMore: skip + notifications.length < totalCount,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/notifications/unread-count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false,
    });
    res.json({ success: true, count });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// PATCH /api/notifications/read/:id
export const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};