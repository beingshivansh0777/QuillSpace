import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true, // allows multiple users with no username set yet
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 160,
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "blog",
      },
    ],
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    role:
     { type: String, 
      enum: ["user", "admin"],
       default: "user"
       },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);