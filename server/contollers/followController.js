import Follow from "../models/followModel.js";
import User from "../models/userModel.js";
import { cacheGet, cacheSet, cacheDelPattern } from "../configs/redis.js";
import { notifyUser } from "../utils/notify.js";

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
      await invalidateFollowStatusCache(req.user.id, userId);
      return res.json({ success: true, following: false, message: "Unfollowed." });
    }

    await Follow.create({ follower: req.user.id, following: userId });
    await invalidateFollowStatusCache(req.user.id, userId);

    await notifyUser({
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

// Clears every cached follow-status entry where either user appears as the
// target — covers: (a) the exact follower→target pair that just changed,
// (b) anyone else's cached view of the target's follower count, and
// (c) anyone else's cached view of the follower's OWN following count
// (which changed too, since they just followed/unfollowed someone).
const invalidateFollowStatusCache = async (followerId, targetId) => {
  await cacheDelPattern(`follow:status:*:${targetId}`);
  await cacheDelPattern(`follow:status:*:${followerId}`);
};

// GET /api/follow/status/:userId — optionalAuth (works for logged-out viewers too,
// they just always get isFollowing: false). Returns counts either way.
export const getFollowStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const viewerKey = req.user ? req.user.id : "anon";

    const cacheKey = `follow:status:${viewerKey}:${userId}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const [isFollowing, followerCount, followingCount] = await Promise.all([
      req.user
        ? Follow.exists({ follower: req.user.id, following: userId })
        : Promise.resolve(false),
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower: userId }),
    ]);

    const payload = {
      success: true,
      isFollowing: !!isFollowing,
      followerCount,
      followingCount,
    };

    await cacheSet(cacheKey, payload, 30);
    res.json(payload);
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// GET /api/follow/followers/:userId — paginated list of people following this user
// Not cached — Tier 3 (low traffic relative to status checks/feeds).
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
// Not cached — Tier 3.
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