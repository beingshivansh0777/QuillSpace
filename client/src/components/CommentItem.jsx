import React, { useState } from "react";
import { Link } from "react-router-dom";
import Moment from "moment";
import { FaRegHeart, FaHeart } from "react-icons/fa6";
import MentionTextArea from "./MentionTextArea.jsx";

const MAX_VISUAL_DEPTH = 4;

// Same pattern used server-side to detect mentions — usernames are at
// least 3 characters per the registration/profile validation rules.
const MENTION_REGEX = /@([a-zA-Z0-9_]{3,})/g;

// Splits comment text into plain strings and clickable @mention links.
// Note: this links ANY @word that looks like a username, whether or not
// that user actually exists — clicking a nonexistent one just lands on
// PublicProfile's existing "User not found" state, so it's a safe default
// without needing an extra lookup per comment render.
const renderWithMentions = (text) => {
  const parts = [];
  let lastIndex = 0;
  const regex = new RegExp(MENTION_REGEX);
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <Link
        key={`${match.index}-${match[1]}`}
        to={`/user/${match[1]}`}
        className="text-primary font-medium hover:underline"
      >
        @{match[1]}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
};

const CommentItem = ({ comment, depth = 0, token, user, onLike, onReply, onReport }) => {
  const [replying, setReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const isLiked = (comment.likes || []).includes(user?._id);
  const replyCount = comment.replies?.length || 0;
  const isDeep = depth >= MAX_VISUAL_DEPTH;

  const handleReplySubmit = async () => {
    if (!replyContent.trim()) return;
    setSubmitting(true);
    const ok = await onReply(comment._id, replyContent);
    setSubmitting(false);
    if (ok) {
      setReplyContent("");
      setReplying(false);
      setShowReplies(true); // reveal thread so the user sees their own reply land
    }
  };

  return (
    <div className={depth > 0 ? "mt-3" : ""}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold overflow-hidden shrink-0">
            {comment.user?.avatar ? (
              <img src={comment.user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              (comment.user?.name || comment.name)?.charAt(0).toUpperCase() || "?"
            )}
          </div>
          <p className="font-medium text-sm text-[#241F2E]">
            {comment.user?.name || comment.name}
          </p>
        </div>
        <span className="text-xs text-[#241F2E]/35">
          {Moment(comment.createdAt).fromNow()}
        </span>
      </div>

      <p className="text-sm text-[#241F2E]/70 ml-9.5 whitespace-pre-wrap wrap-break-word">
        {renderWithMentions(comment.content)}
      </p>

      <div className="flex items-center gap-4 ml-9.5 mt-2">
        <button
          onClick={() => onLike(comment._id)}
          className="flex items-center gap-1.5 text-xs text-[#241F2E]/50 hover:text-primary transition-colors cursor-pointer"
        >
          {isLiked ? <FaHeart className="text-primary" size={12} /> : <FaRegHeart size={12} />}
          {comment.likes?.length || 0}
        </button>
        <button
          onClick={() => setReplying((r) => !r)}
          className="text-xs text-[#241F2E]/50 hover:text-primary transition-colors cursor-pointer"
        >
          Reply
        </button>
        {token && (
          <button
            onClick={() => onReport(comment._id)}
            className="text-xs text-[#241F2E]/35 hover:text-red-500 transition-colors cursor-pointer"
          >
            Report
          </button>
        )}
      </div>

      {replying && (
        <div className="ml-9.5 mt-3 flex flex-col gap-2">
          <MentionTextarea
            value={replyContent}
            onValueChange={setReplyContent}
            placeholder={`Reply to ${comment.user?.name || comment.name}… (@ to mention someone)`}
            className="w-full p-2.5 rounded-lg border border-[#241F2E]/15 bg-[#FBF9F5] outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all h-20 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleReplySubmit}
              disabled={submitting}
              className="text-xs font-medium text-white bg-primary rounded-full px-4 py-1.5 hover:bg-[#453adf] transition-colors cursor-pointer disabled:opacity-60"
            >
              {submitting ? "Posting…" : "Post reply"}
            </button>
            <button
              onClick={() => { setReplying(false); setReplyContent(""); }}
              className="text-xs text-[#241F2E]/50 hover:text-[#241F2E] transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {replyCount > 0 && (
        <div className="ml-9.5 mt-3">
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="flex items-center gap-2 text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              <span className="w-6 h-px bg-[#241F2E]/20" />
              View {replyCount} {replyCount === 1 ? "reply" : "replies"}
            </button>
          ) : (
            <button
              onClick={() => setShowReplies(false)}
              className="flex items-center gap-2 text-xs font-medium text-[#241F2E]/50 hover:text-primary mb-1 cursor-pointer"
            >
              <span className="w-6 h-px bg-[#241F2E]/20" />
              Hide replies
            </button>
          )}

          {showReplies && (
            <div className={`border-l-2 border-[#241F2E]/8 ${isDeep ? "pl-2" : "pl-4"} flex flex-col`}>
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  depth={depth + 1}
                  token={token}
                  user={user}
                  onLike={onLike}
                  onReply={onReply}
                  onReport={onReport}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
