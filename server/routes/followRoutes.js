import express from "express";
import {
  toggleFollow,
  getFollowStatus,
  getFollowers,
  getFollowingList,
} from "../contollers/followController.js";
import auth from "../middleware/auth.js";
import optionalAuth from "../middleware/optionalAuth.js";

const followRouter = express.Router();

/**
 * @openapi
 * /api/follow/{userId}:
 *   post:
 *     summary: Follow or unfollow a user (toggle)
 *     tags: [Follow]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Updated follow state
 */
followRouter.post("/:userId", auth, toggleFollow);

followRouter.get("/status/:userId", optionalAuth, getFollowStatus);
followRouter.get("/followers/:userId", getFollowers);
followRouter.get("/following/:userId", getFollowingList);

export default followRouter;