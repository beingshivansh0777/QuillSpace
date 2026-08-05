import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { assets } from "../assets/assets";
import Moment from "moment";
import Footer from "../components/Footer";
import Loader from "../components/Loader";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { FaWhatsapp, FaFacebook, FaInstagram, FaLink, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { FaRegBookmark, FaBookmark } from "react-icons/fa6";
import { HiOutlineFlag } from "react-icons/hi";
import ReportModal from "../components/ReportModel.jsx";
import CommentItem from "../components/CommentItem.jsx";
import MentionTextarea from "../components/MentionTextArea.jsx";

// --- Recursive tree helpers (comments can now nest to any depth) ---

// Find `targetId` anywhere in the tree and replace it via `updater(comment)`.
// Returns a brand-new tree (never mutates) so React state updates trigger correctly.
const updateCommentInTree = (nodes, targetId, updater) =>
  nodes.map((c) => {
    if (c._id === targetId) return updater(c);
    if (c.replies?.length) {
      return { ...c, replies: updateCommentInTree(c.replies, targetId, updater) };
    }
    return c;
  });

// Find `parentId` anywhere in the tree and push `newReply` into its replies array.
const addReplyToTree = (nodes, parentId, newReply) =>
  nodes.map((c) => {
    if (c._id === parentId) {
      return { ...c, replies: [...(c.replies || []), newReply] };
    }
    if (c.replies?.length) {
      return { ...c, replies: addReplyToTree(c.replies, parentId, newReply) };
    }
    return c;
  });

// Count every comment at every depth (top-level count alone would undercount).
const countAllComments = (nodes) =>
  nodes.reduce((sum, c) => sum + 1 + countAllComments(c.replies || []), 0);

const Blog = () => {
  const { id } = useParams();

  const { axios, token, user } = useAppContext();

  const [data, setData] = useState(null);
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [myVote, setMyVote] = useState("none");
  const [bookmarked, setBookmarked] = useState(false);
  const [reportingBlog, setReportingBlog] = useState(false);
  const [reportingComment, setReportingComment] = useState(null); // comment id, or null

  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [followAuthorLoading, setFollowAuthorLoading] = useState(false);

  const fetchBlogData = async () => {
    try {
      const { data } = await axios.get(`/api/blog/${id}`);
      if (data.success) {
        setData(data.blog);
        setLikes(data.blog.likedBy?.length || 0);
        setDislikes(data.blog.dislikedBy?.length || 0);
        if (user?._id) {
          if (data.blog.likedBy?.includes(user._id)) setMyVote("like");
          else if (data.blog.dislikedBy?.includes(user._id)) setMyVote("dislike");
          else setMyVote("none");
        }
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(data.message);
    }
  };

  const fetchComments = async () => {
    try {
      const { data } = await axios.post("/api/blog/comments", { blogId: id });
      if (data.success) {
        setComments(data.comments);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.error("Please login to comment.");
      return;
    }

    setSubmittingComment(true);
    try {
      const { data } = await axios.post("/api/blog/add-comment", {
        blog: id,
        content,
      });
      if (data.success) {
        toast.success(data.message);
        setContent("");
        setComments((prev) => [{ ...data.comment, replies: [] }, ...prev]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Reply can now target a comment at ANY depth, not just a top-level one.
  // Returns true/false so CommentItem knows whether to clear its textarea.
  const handleReply = async (parentId, replyText) => {
    if (!token) {
      toast.error("Please login to reply.");
      return false;
    }
    if (!replyText.trim()) return false;

    try {
      const { data } = await axios.post("/api/blog/add-comment", {
        blog: id,
        content: replyText,
        parent: parentId,
      });
      if (data.success) {
        setComments((prev) =>
          addReplyToTree(prev, parentId, { ...data.comment, replies: [] })
        );
        return true;
      } else {
        toast.error(data.message);
        return false;
      }
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  // Like can now target a comment at ANY depth too.
  const handleCommentLike = async (commentId) => {
    if (!token) {
      toast.error("Please login to like comments.");
      return;
    }
    try {
      const { data } = await axios.post("/api/blog/comment-like", { commentId });
      if (!data.success) {
        toast.error(data.message);
        return;
      }

      setComments((prev) =>
        updateCommentInTree(prev, commentId, (c) => ({
          ...c,
          likes: data.liked
            ? [...(c.likes || []), user?._id]
            : (c.likes || []).filter((u) => u !== user?._id),
        }))
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Check follow status for this blog's author once both the blog and the
  // viewer's own identity are known — skipped entirely for the author's own
  // post, and re-runs if the viewer logs in/out while already on the page.
  useEffect(() => {
    if (!data?.author?._id || !token) {
      setIsFollowingAuthor(false);
      return;
    }
    if (data.author._id === user?._id) return; // can't follow yourself

    const fetchAuthorFollowStatus = async () => {
      try {
        const { data: res } = await axios.get(`/api/follow/status/${data.author._id}`);
        if (res.success) setIsFollowingAuthor(res.isFollowing);
      } catch (error) {
        // non-critical — button just defaults to "Follow"
      }
    };
    fetchAuthorFollowStatus();
  }, [data?.author?._id, token, user?._id]);

  const handleToggleFollowAuthor = async () => {
    if (!token) {
      toast.error("Please login to follow writers.");
      return;
    }

    setFollowAuthorLoading(true);
    const wasFollowing = isFollowingAuthor;
    setIsFollowingAuthor(!wasFollowing); // optimistic

    try {
      const { data: res } = await axios.post(`/api/follow/${data.author._id}`);
      if (!res.success) {
        toast.error(res.message);
        setIsFollowingAuthor(wasFollowing);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      setIsFollowingAuthor(wasFollowing);
    } finally {
      setFollowAuthorLoading(false);
    }
  };

  const handleVote = async (type) => {
    if (!token) {
      toast.error("Please login to vote.");
      return;
    }

    const newType = myVote === type ? "none" : type;
    const previousType = myVote;

    if (previousType === "like") setLikes((n) => n - 1);
    if (previousType === "dislike") setDislikes((n) => n - 1);
    if (newType === "like") setLikes((n) => n + 1);
    if (newType === "dislike") setDislikes((n) => n + 1);
    setMyVote(newType);

    try {
      const { data } = await axios.post("/api/blog/vote", {
        blogId: id,
        type: newType,
      });

      if (data.success) {
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setMyVote(data.myVote);
      } else {
        toast.error(data.message);
        fetchBlogData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      fetchBlogData();
    }
  };

  useEffect(() => {
    fetchBlogData();
    fetchComments();

    if (token) {
      axios.get(`/api/blog/bookmark-status/${id}`).then(({ data }) => {
        if (data.success) setBookmarked(data.bookmarked);
      }).catch(() => {});
    }

    // Track the view once. Logged-in reads are deduped server-side; for
    // anonymous readers we guard with localStorage so refreshing the same
    // browser doesn't keep inflating the count.
    const viewedKey = `viewed_${id}`;
    const shouldTrack = token || !localStorage.getItem(viewedKey);
    if (shouldTrack) {
      axios.post(`/api/blog/track-view/${id}`).catch(() => {});
      if (!token) localStorage.setItem(viewedKey, "1");
    }
  }, [token, user]);

  const toggleBookmark = async () => {
    if (!token) {
      toast.error("Please login to save posts.");
      return;
    }
    setBookmarked((prev) => !prev); // optimistic
    try {
      const { data } = await axios.post("/api/blog/bookmark", { blogId: id });
      if (data.success) {
        setBookmarked(data.bookmarked);
      } else {
        toast.error(data.message);
        setBookmarked((prev) => !prev); // revert
      }
    } catch (error) {
      toast.error(error.message);
      setBookmarked((prev) => !prev);
    }
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  const shareToWhatsapp = () => {
    const text = `${data?.title || "Check this out"} — ${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareToFacebook = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      "_blank",
      "width=580,height=520"
    );
  };

  const shareToInstagram = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: data?.title, url: shareUrl });
      } catch (error) {
        // user cancelled — no action needed
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied! Paste it into your Instagram story or DM.");
    }
  };

  return data ? (
    <div className="relative bg-[#FBF9F5] min-h-screen">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500&display=swap');
        .ql-blog-display { font-family: 'Instrument Serif', serif; }
        .ql-blog-eyebrow { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.12em; }
        .ql-fade-in { animation: ql-fade 0.5s ease-out both; }
        @keyframes ql-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .ql-fade-in { animation: none; } }
      `}</style>

      <img
        src={assets.gradientBackground}
        alt=""
        className="absolute -top-50 -z-1 opacity-40"
      />

      <Navbar />

      {/* Bookmark — floating on the right edge for laptop/desktop */}
      <button
        onClick={toggleBookmark}
        aria-label={bookmarked ? "Remove bookmark" : "Save this post"}
        className="hidden lg:flex fixed right-8 top-1/2 -translate-y-1/2 z-40 w-12 h-12 items-center justify-center rounded-full bg-white shadow-lg border border-[#241F2E]/10 hover:scale-105 transition-all cursor-pointer"
      >
        {bookmarked ? <FaBookmark className="text-primary" size={18} /> : <FaRegBookmark className="text-[#241F2E]/60" size={18} />}
      </button>

      <div className="text-center mt-16 px-5 ql-fade-in">
        <p className="ql-blog-eyebrow text-[11px] text-primary/70 mb-4">
          PUBLISHED {Moment(data.createdAt).format("MMMM D, YYYY").toUpperCase()}
        </p>
        <h1 className="ql-blog-display text-3xl sm:text-5xl leading-[1.2] max-w-2xl mx-auto text-[#241F2E]">
          {data.title}
        </h1>
        {data.subTitle && (
          <h2 className="mt-4 max-w-lg mx-auto text-[#241F2E]/55 text-sm sm:text-base">
            {data.subTitle}
          </h2>
        )}
        <span className="inline-block mt-6 py-1 px-4 rounded-full border border-primary/25 bg-primary/5 text-xs font-medium text-primary">
          {data.category}
        </span>

        {data.tags?.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-3 max-w-lg mx-auto">
            {data.tags.map((tag, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-full bg-[#241F2E]/5 text-[#241F2E]/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {token && (
          <button
            onClick={() => setReportingBlog(true)}
            className="mt-3 flex items-center gap-1 text-xs text-[#241F2E]/35 hover:text-red-500 transition-colors mx-auto cursor-pointer"
          >
            <HiOutlineFlag size={12} /> Report
          </button>
        )}

        {data.author && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <p className="text-sm text-[#241F2E]/50">
              Written by{" "}
              {data.author.username ? (
                <Link
                  to={`/user/${data.author.username}`}
                  className="text-primary font-medium hover:underline"
                >
                  {data.author.name}
                </Link>
              ) : (
                <span className="text-[#241F2E]/70 font-medium">{data.author.name}</span>
              )}
            </p>

            {token && user?._id !== data.author._id && (
              <button
                onClick={handleToggleFollowAuthor}
                disabled={followAuthorLoading}
                className={`text-xs font-medium px-3 py-1 rounded-full border transition-all cursor-pointer ${
                  isFollowingAuthor
                    ? "border-[#241F2E]/20 text-[#241F2E]/60 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                    : "bg-primary text-white border-primary hover:bg-[#453adf]"
                } ${followAuthorLoading ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {isFollowingAuthor ? "Following" : "Follow"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mx-5 max-w-4xl md:mx-auto my-12">
        <img
          src={data.image}
          alt={data.title}
          className="rounded-2xl mb-10 w-full object-cover shadow-sm"
        />

        <div
          className="rich-text max-w-2xl mx-auto"
          dangerouslySetInnerHTML={{ __html: data.description }}
        ></div>

        {/* Like / Dislike */}
        <div className="flex items-center gap-3 max-w-2xl mx-auto mt-12 pt-8 border-t border-[#241F2E]/8">
          <button
            onClick={() => handleVote("like")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all cursor-pointer ${
              myVote === "like"
                ? "bg-primary text-white border-primary"
                : "border-[#241F2E]/15 text-[#241F2E]/60 hover:border-primary/40 hover:text-primary"
            }`}
          >
            <FaThumbsUp size={14} /> {likes}
          </button>

          <button
            onClick={() => handleVote("dislike")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium transition-all cursor-pointer ${
              myVote === "dislike"
                ? "bg-[#241F2E] text-white border-[#241F2E]"
                : "border-[#241F2E]/15 text-[#241F2E]/60 hover:border-[#241F2E]/40"
            }`}
          >
            <FaThumbsDown size={14} /> {dislikes}
          </button>

          <button
            onClick={toggleBookmark}
            aria-label={bookmarked ? "Remove bookmark" : "Save this post"}
            className="lg:hidden flex items-center gap-2 px-5 py-2.5 rounded-full border text-sm font-medium border-[#241F2E]/15 text-[#241F2E]/60 hover:border-primary/40 transition-all cursor-pointer ml-auto"
          >
            {bookmarked ? <FaBookmark className="text-primary" size={14} /> : <FaRegBookmark size={14} />}
          </button>
        </div>

        {/* Comments */}
        <div className="mt-14 max-w-2xl mx-auto">
          <p className="ql-blog-eyebrow text-[11px] text-[#241F2E]/50 mb-5">
            {countAllComments(comments)} {countAllComments(comments) === 1 ? "COMMENT" : "COMMENTS"}
          </p>
          <div className="flex flex-col gap-3">
            {comments.map((item) => (
              <div key={item._id} className="bg-white border border-[#241F2E]/8 rounded-xl p-4">
                <CommentItem
                  comment={item}
                  depth={0}
                  token={token}
                  user={user}
                  onLike={handleCommentLike}
                  onReply={handleReply}
                  onReport={(commentId) => setReportingComment(commentId)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Add Comment */}
        <div className="max-w-2xl mx-auto mt-10">
          <p className="ql-blog-eyebrow text-[11px] text-[#241F2E]/50 mb-4">ADD A COMMENT</p>

          {token ? (
            <form onSubmit={addComment} className="flex flex-col items-start gap-3">
              <MentionTextarea
                value={content}
                onValueChange={setContent}
                placeholder="Share your thoughts… (@ to mention someone)"
                required
                className="w-full p-3.5 rounded-xl border border-[#241F2E]/15 bg-white outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all h-32 text-sm text-[#241F2E] placeholder:text-[#241F2E]/35"
              />
              <button
                disabled={submittingComment}
                className={`rounded-full px-7 py-2.5 text-sm font-medium text-white bg-primary transition-all cursor-pointer ${
                  submittingComment ? "opacity-60 cursor-not-allowed" : "hover:bg-[#453adf]"
                }`}
                type="submit"
              >
                {submittingComment ? "Posting…" : "Post comment"}
              </button>
            </form>
          ) : (
            <div className="p-4 border border-primary/20 bg-primary/5 rounded-xl text-sm text-[#241F2E]/70">
              Please{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                login or register
              </Link>{" "}
              to leave a comment.
            </div>
          )}
        </div>

        {/* Share */}
        <div className="mt-16 pt-8 border-t border-[#241F2E]/8 max-w-2xl mx-auto">
          <p className="ql-blog-eyebrow text-[11px] text-[#241F2E]/50 mb-4">SHARE THIS ARTICLE</p>
          <div className="flex items-center gap-3">
            <button
              onClick={shareToWhatsapp}
              aria-label="Share on WhatsApp"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#25D366] text-white hover:brightness-95 transition-all cursor-pointer"
            >
              <FaWhatsapp size={18} />
            </button>

            <button
              onClick={shareToFacebook}
              aria-label="Share on Facebook"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#1877F2] text-white hover:brightness-95 transition-all cursor-pointer"
            >
              <FaFacebook size={18} />
            </button>

            <button
              onClick={shareToInstagram}
              aria-label="Share on Instagram"
              className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:brightness-95 transition-all cursor-pointer bg-[linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)]"
            >
              <FaInstagram size={18} />
            </button>

            <button
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                toast.success("Link copied to clipboard!");
              }}
              aria-label="Copy link"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#241F2E]/5 text-[#241F2E]/60 hover:bg-[#241F2E]/10 transition-all cursor-pointer"
            >
              <FaLink size={15} />
            </button>
          </div>
        </div>
      </div>
      <Footer />

      {reportingBlog && (
        <ReportModal
          targetType="blog"
          targetId={id}
          onClose={() => setReportingBlog(false)}
        />
      )}
      {reportingComment && (
        <ReportModal
          targetType="comment"
          targetId={reportingComment}
          onClose={() => setReportingComment(null)}
        />
      )}
    </div>
  ) : (
    <Loader />
  );
};

export default Blog;
