import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    follower: {
      // the user who is doing the following
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      // the user being followed
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevents the same follow relationship being created twice (also makes
// "am I following this person" an index-backed lookup, not a table scan).
followSchema.index({ follower: 1, following: 1 }, { unique: true });

// Speeds up "who follows user X" and "who does user X follow" independently.
followSchema.index({ following: 1 });
followSchema.index({ follower: 1 });

const Follow = mongoose.model("Follow", followSchema);

export default Follow;