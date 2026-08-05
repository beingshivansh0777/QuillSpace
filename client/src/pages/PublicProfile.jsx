import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Loader from "../components/Loader";
import BlogCard from "../components/BlogCard";
import FollowListModal from "../components/FollowListModal";
import toast from "react-hot-toast";

const PublicProfile = () => {
  const { username } = useParams();
  const { axios, token, user } = useAppContext();
  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [followListType, setFollowListType] = useState(null); // "followers" | "following" | null

  const [posts, setPosts] = useState([]);
  const [postsPage, setPostsPage] = useState(1);
  const [postsHasMore, setPostsHasMore] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await axios.get(`/api/auth/user/${username}`);
        if (data.success) {
          setProfile(data.user);
        } else {
          setNotFound(true);
        }
      } catch (error) {
        setNotFound(true);
      }
    };
    fetchProfile();
  }, [username]);

  // Runs once we have the profile's _id (needed for the follow endpoints,
  // which key on user id, not username). Re-runs if the viewer's own auth
  // state changes, e.g. they log in while already on this page.
  useEffect(() => {
    if (!profile?._id) return;

    const fetchFollowStatus = async () => {
      try {
        const { data } = await axios.get(`/api/follow/status/${profile._id}`);
        if (data.success) {
          setIsFollowing(data.isFollowing);
          setFollowerCount(data.followerCount);
          setFollowingCount(data.followingCount);
        }
      } catch (error) {
        // non-critical — leave counts at 0 rather than blocking the page
      }
    };
    fetchFollowStatus();
  }, [profile?._id, token]);

  // This writer's published posts — resets and refetches page 1 whenever
  // the username in the URL changes (navigating from one profile to another).
  useEffect(() => {
    if (!username) return;
    setPosts([]);
    setPostsPage(1);
    setLoadingPosts(true);

    const fetchFirstPage = async () => {
      try {
        const { data } = await axios.get(`/api/blog/author/${username}?page=1`);
        if (data.success) {
          setPosts(data.blogs);
          setPostsHasMore(data.hasMore);
        }
      } catch (error) {
        // silent — posts section just shows the empty state
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchFirstPage();
  }, [username]);

  const loadMorePosts = async () => {
    const nextPage = postsPage + 1;
    setLoadingMorePosts(true);
    try {
      const { data } = await axios.get(`/api/blog/author/${username}?page=${nextPage}`);
      if (data.success) {
        setPosts((prev) => [...prev, ...data.blogs]);
        setPostsHasMore(data.hasMore);
        setPostsPage(nextPage);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingMorePosts(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!token) {
      toast.error("Please login to follow writers.");
      return;
    }

    setFollowLoading(true);
    const wasFollowing = isFollowing;

    // Optimistic update — instant feedback, reverted below if the request fails.
    setIsFollowing(!wasFollowing);
    setFollowerCount((n) => (wasFollowing ? n - 1 : n + 1));

    try {
      const { data } = await axios.post(`/api/follow/${profile._id}`);
      if (!data.success) {
        toast.error(data.message);
        setIsFollowing(wasFollowing);
        setFollowerCount((n) => (wasFollowing ? n + 1 : n - 1));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
      setIsFollowing(wasFollowing);
      setFollowerCount((n) => (wasFollowing ? n + 1 : n - 1));
    } finally {
      setFollowLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#FBF9F5]">
        <Navbar />
        <div className="max-w-md mx-auto mt-24 text-center px-5">
          <h2 className="text-2xl font-semibold text-[#241F2E] mb-2">User not found</h2>
          <p className="text-[#241F2E]/55">
            There's no QuillSpace writer at @{username}.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!profile) return <Loader />;

  const initial = profile.name?.charAt(0).toUpperCase() || "?";
  const isOwnProfile = user?.username === profile.username;

  return (
    <div className="min-h-screen bg-[#FBF9F5]">
      <Navbar />
      <div className="max-w-lg mx-auto mt-16 px-5 text-center">
        <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-semibold mx-auto mb-5 overflow-hidden">
          {profile.avatar ? (
            <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <h1 className="text-2xl font-semibold text-[#241F2E]">{profile.name}</h1>
        <p className="text-primary text-sm mt-1">@{profile.username}</p>

        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <button
            onClick={() => setFollowListType("followers")}
            className="cursor-pointer hover:underline"
          >
            <span className="font-semibold text-[#241F2E]">{followerCount}</span>
            <span className="text-[#241F2E]/50 ml-1">
              {followerCount === 1 ? "Follower" : "Followers"}
            </span>
          </button>
          <button
            onClick={() => setFollowListType("following")}
            className="cursor-pointer hover:underline"
          >
            <span className="font-semibold text-[#241F2E]">{followingCount}</span>
            <span className="text-[#241F2E]/50 ml-1">Following</span>
          </button>
        </div>

        {!isOwnProfile && (
          <button
            onClick={handleToggleFollow}
            disabled={followLoading}
            className={`mt-5 px-6 py-2.5 rounded-full text-sm font-medium transition-all cursor-pointer ${
              isFollowing
                ? "border border-[#241F2E]/20 text-[#241F2E]/70 hover:bg-red-50 hover:border-red-200 hover:text-red-500"
                : "bg-primary text-white hover:bg-[#453adf]"
            } ${followLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        )}

        {profile.bio ? (
          <p className="text-[#241F2E]/65 mt-5 leading-relaxed">{profile.bio}</p>
        ) : (
          <p className="text-[#241F2E]/35 mt-5 italic">No bio yet.</p>
        )}
      </div>

      {/* Published posts by this writer */}
      <div className="max-w-6xl mx-auto mt-14 px-5 sm:px-10">
        <p className="ql-blog-eyebrow text-[11px] text-[#241F2E]/50 mb-5 font-mono tracking-wide">
          {profile.name?.split(" ")[0]}'S POSTS
        </p>

        {loadingPosts ? (
          <p className="text-center text-[#241F2E]/40 text-sm py-10">Loading posts…</p>
        ) : posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {posts.map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>

            {postsHasMore && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={loadMorePosts}
                  disabled={loadingMorePosts}
                  className="text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 rounded-full px-6 py-2.5 transition-colors cursor-pointer disabled:opacity-60"
                >
                  {loadingMorePosts ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-10">
            <p className="text-[#241F2E]/60">
              {isOwnProfile ? "You haven't published anything yet." : "This writer hasn't published anything yet."}
            </p>
          </div>
        )}
      </div>

      <div className="mt-16">
        <Footer />
      </div>

      {followListType && (
        <FollowListModal
          userId={profile._id}
          type={followListType}
          onClose={() => setFollowListType(null)}
        />
      )}
    </div>
  );
};

export default PublicProfile;
