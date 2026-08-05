import Follow from "../models/followModel.js";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";

// POST /api/follow/:userId — toggle follow/unfollow. Requires login.
export const toggleFollow = async (req, res) => {
  try {
    const { userId } = req.params;

    if (userId === req.user.id) {
      return res.json({ success: false, message: "You can't follow yourself." });
    }

    const targetUser = await User.findById(userId).select("_id");
    if (!targetUser) {
      return res.json({ success: false, message: "User not found." });
    }

    const existing = await Follow.findOne({ follower: req.user.id, following: userId });

    if (existing) {
      await Follow.findByIdAndDelete(existing._id);
      return res.json({ success: true, following: false, message: "Unfollowed." });
    }

    await Follow.create({ follower: req.user.id, following: userId });

    await Notification.create({
      recipient: userId,
      actor: req.user.id,
      type: "new_follower",
    });

    res.json({ success: true, following: true, message: "Followed!" });
  } catch (error) {
    // Duplicate-key error from a rapid double-click racing itself —
    // treat as "already following" rather than surfacing a raw DB error.
    if (error.code === 11000) {
      return res.json({ success: true, following: true, message: "Followed!" });
    }
    res.json({ success: false, message: error.message });
  }
};

// GET /api/follow/status/:userId — optionalAuth (works for logged-out viewers too,
// they just always get isFollowing: false). Returns counts either way.
export const getFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const [isFollowing, followerCount, followingCount] = await Promise.all([
      req.user
        ? Follow.exists({ follower: req.user.id, following: userId })
        : Promise.resolve(false),
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower: userId }),
    ]);

    res.json({
      success: true,
      isFollowing: !!isFollowing,
      followerCount,
      followingCount,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/follow/followers/:userId — paginated list of people following this user
export const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [totalCount, follows] = await Promise.all([
      Follow.countDocuments({ following: userId }),
      Follow.find({ following: userId })
        .populate("follower", "name username avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({
      success: true,
      users: follows.map((f) => f.follower),
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasMore: skip + follows.length < totalCount,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/follow/following/:userId — paginated list of people this user follows
export const getFollowingList = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [totalCount, follows] = await Promise.all([
      Follow.countDocuments({ follower: userId }),
      Follow.find({ follower: userId })
        .populate("following", "name username avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    res.json({
      success: true,
      users: follows.map((f) => f.following),
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasMore: skip + follows.length < totalCount,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};