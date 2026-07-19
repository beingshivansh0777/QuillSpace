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

const Blog = () => {
  const { id } = useParams();

  const { axios, token } = useAppContext();

  const [data, setData] = useState(null);
  const [comments, setComments] = useState([]);
  const [content, setContent] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [myVote, setMyVote] = useState("none");
  const [bookmarked, setBookmarked] = useState(false);

  const fetchBlogData = async () => {
    try {
      const { data } = await axios.get(`/api/blog/${id}`);
      if (data.success) {
        setData(data.blog);
        setLikes(data.blog.likes || 0);
        setDislikes(data.blog.dislikes || 0);
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
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleVote = async (type) => {
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
        previousType,
      });

      if (data.success) {
        setLikes(data.likes);
        setDislikes(data.dislikes);
        localStorage.setItem(`vote_${id}`, newType);
      } else {
        toast.error(data.message);
        fetchBlogData();
      }
    } catch (error) {
      toast.error(error.message);
      fetchBlogData();
    }
  };

  useEffect(() => {
    fetchBlogData();
    fetchComments();

    const storedVote = localStorage.getItem(`vote_${id}`);
    if (storedVote) setMyVote(storedVote);

    if (token) {
      axios.get(`/api/blog/bookmark-status/${id}`).then(({ data }) => {
        if (data.success) setBookmarked(data.bookmarked);
      }).catch(() => {});
    }
  }, [token]);

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

        {data.author && (
          <p className="mt-4 text-sm text-[#241F2E]/50">
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
            {comments.length} {comments.length === 1 ? "COMMENT" : "COMMENTS"}
          </p>
          <div className="flex flex-col gap-3">
            {comments.map((item, index) => (
              <div
                key={index}
                className="bg-white border border-[#241F2E]/8 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      {item.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <p className="font-medium text-sm text-[#241F2E]">{item.name}</p>
                  </div>
                  <span className="text-xs text-[#241F2E]/35">
                    {Moment(item.createdAt).fromNow()}
                  </span>
                </div>
                <p className="text-sm text-[#241F2E]/70 ml-9.5">{item.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Add Comment */}
        <div className="max-w-2xl mx-auto mt-10">
          <p className="ql-blog-eyebrow text-[11px] text-[#241F2E]/50 mb-4">ADD A COMMENT</p>

          {token ? (
            <form onSubmit={addComment} className="flex flex-col items-start gap-3">
              <textarea
                onChange={(e) => setContent(e.target.value)}
                value={content}
                placeholder="Share your thoughts…"
                required
                className="w-full p-3.5 rounded-xl border border-[#241F2E]/15 bg-white outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all h-32 text-sm text-[#241F2E] placeholder:text-[#241F2E]/35"
              ></textarea>
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
    </div>
  ) : (
    <Loader />
  );
};

export default Blog;
