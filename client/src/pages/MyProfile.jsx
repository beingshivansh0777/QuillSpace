import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EditProfileModal from "../components/EditProfileModal";
import Moment from "moment";
import toast from "react-hot-toast";

const EDIT_WINDOW_MS = 30 * 60 * 1000;

const MyProfile = () => {
  const { axios, token, user } = useAppContext();
  const navigate = useNavigate();

  const [tab, setTab] = useState("posts");
  const [myPosts, setMyPosts] = useState([]);
  const [savedBlogs, setSavedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotoZoom, setShowPhotoZoom] = useState(false);

  const fetchMyPosts = async () => {
    try {
      const { data } = await axios.get("/api/blog/mine");
      if (data.success) setMyPosts(data.blogs);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const fetchSavedBlogs = async () => {
    try {
      const { data } = await axios.get("/api/blog/bookmarks");
      if (data.success) setSavedBlogs(data.blogs);
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([fetchMyPosts(), fetchSavedBlogs()]).finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (blogId) => {
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    try {
      const { data } = await axios.post("/api/blog/delete-own", { id: blogId });
      if (data.success) {
        toast.success(data.message);
        setMyPosts((prev) => prev.filter((b) => b._id !== blogId));
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handlePublishNow = async (blogId) => {
    try {
      const { data } = await axios.post("/api/blog/publish-now", { id: blogId });
      if (data.success) {
        toast.success(data.message);
        fetchMyPosts();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleUnsave = async (blogId) => {
    try {
      const { data } = await axios.post("/api/blog/bookmark", { blogId });
      if (data.success) {
        setSavedBlogs((prev) => prev.filter((b) => b._id !== blogId));
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#FBF9F5]">
        <Navbar />
        <div className="max-w-md mx-auto mt-24 text-center px-5">
          <p className="text-[#241F2E]/60">
            Please <Link to="/login" className="text-primary font-semibold hover:underline">login</Link> to view your profile.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  const initial = user?.name?.charAt(0).toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-[#FBF9F5]">
      <Navbar />

      <div className="max-w-3xl mx-auto px-5 py-12">
        {/* Profile header */}
        <div className="flex items-center gap-4 mb-10">
          <div
            onClick={() => user?.avatar && setShowPhotoZoom(true)}
            className={`w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-semibold flex-shrink-0 overflow-hidden ${
              user?.avatar ? "cursor-pointer hover:opacity-90 transition-opacity" : ""
            }`}
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              initial
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[#241F2E] truncate">{user?.name}</h1>
            {user?.username && <p className="text-primary text-sm">@{user.username}</p>}
            <p className="text-[#241F2E]/50 text-sm mt-1">{user?.bio || "No bio yet."}</p>
          </div>
          <button
            onClick={() => setShowEditModal(true)}
            className="text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 rounded-full px-4 py-2 transition-colors cursor-pointer flex-shrink-0"
          >
            Edit
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#241F2E]/10 mb-8">
          <button
            onClick={() => setTab("posts")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === "posts" ? "border-primary text-primary" : "border-transparent text-[#241F2E]/50 hover:text-[#241F2E]"
            }`}
          >
            My Posts ({myPosts.length})
          </button>
          <button
            onClick={() => setTab("saved")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              tab === "saved" ? "border-primary text-primary" : "border-transparent text-[#241F2E]/50 hover:text-[#241F2E]"
            }`}
          >
            Saved Blogs ({savedBlogs.length})
          </button>
        </div>

        {loading ? (
          <p className="text-[#241F2E]/40 text-sm">Loading…</p>
        ) : tab === "posts" ? (
          myPosts.length > 0 ? (
            <div className="flex flex-col gap-3">
              {myPosts.map((blog) => {
                const editable = !blog.isPublished ||
                  Date.now() - new Date(blog.publishedAt).getTime() <= EDIT_WINDOW_MS;

                const status = blog.isPublished
                  ? "Published"
                  : blog.scheduledFor
                  ? `Scheduled · ${Moment(blog.scheduledFor).format("MMM D, h:mm A")}`
                  : "Draft";

                return (
                  <div
                    key={blog._id}
                    className="flex items-center gap-4 bg-white border border-[#241F2E]/8 rounded-xl p-4"
                  >
                    <img src={blog.image} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p
                        onClick={() => navigate(`/blog/${blog._id}`)}
                        className="font-medium text-[#241F2E] truncate cursor-pointer hover:text-primary"
                      >
                        {blog.title}
                      </p>
                      <p className="text-xs text-[#241F2E]/40 mt-1">
                        {Moment(blog.createdAt).format("MMM D, YYYY")} · {status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!blog.isPublished && (
                        <button
                          onClick={() => handlePublishNow(blog._id)}
                          className="text-xs font-medium text-green-600 border border-green-200 hover:bg-green-50 rounded-full px-3 py-1.5 transition-colors cursor-pointer"
                        >
                          Publish now
                        </button>
                      )}
                      {editable ? (
                        <button
                          onClick={() => navigate(`/edit/${blog._id}`)}
                          className="text-xs font-medium text-primary border border-primary/30 hover:bg-primary/5 rounded-full px-3 py-1.5 transition-colors cursor-pointer"
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="text-xs text-[#241F2E]/30 px-3 py-1.5">Editing closed</span>
                      )}
                      <button
                        onClick={() => handleDelete(blog._id)}
                        className="text-xs font-medium text-red-500 border border-red-200 hover:bg-red-50 rounded-full px-3 py-1.5 transition-colors cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-[#241F2E]/60">You haven't written anything yet.</p>
              <Link to="/write" className="inline-block mt-3 text-primary font-semibold hover:underline">
                Write your first post
              </Link>
            </div>
          )
        ) : savedBlogs.length > 0 ? (
          <div className="flex flex-col gap-3">
            {savedBlogs.map((blog) => (
              <div
                key={blog._id}
                className="flex items-center gap-4 bg-white border border-[#241F2E]/8 rounded-xl p-4"
              >
                <img src={blog.image} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p
                    onClick={() => navigate(`/blog/${blog._id}`)}
                    className="font-medium text-[#241F2E] truncate cursor-pointer hover:text-primary"
                  >
                    {blog.title}
                  </p>
                  <p className="text-xs text-[#241F2E]/40 mt-1">
                    by {blog.author?.name || "Unknown"}
                  </p>
                </div>
                <button
                  onClick={() => handleUnsave(blog._id)}
                  className="text-xs font-medium text-[#241F2E]/50 border border-[#241F2E]/15 hover:bg-[#241F2E]/5 rounded-full px-3 py-1.5 transition-colors cursor-pointer flex-shrink-0"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-[#241F2E]/60">No saved blogs yet.</p>
            <Link to="/" className="inline-block mt-3 text-primary font-semibold hover:underline">
              Browse stories
            </Link>
          </div>
        )}
      </div>

      <Footer />

      {showEditModal && <EditProfileModal onClose={() => setShowEditModal(false)} />}

      {showPhotoZoom && user?.avatar && (
        <div
          onClick={() => setShowPhotoZoom(false)}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] px-4 cursor-zoom-out"
        >
          <button
            onClick={() => setShowPhotoZoom(false)}
            aria-label="Close"
            className="absolute top-5 right-5 text-white/80 hover:text-white text-3xl leading-none cursor-pointer"
          >
            ×
          </button>
          <img
            src={user.avatar}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain cursor-default"
          />
        </div>
      )}
    </div>
  );
};

export default MyProfile;
