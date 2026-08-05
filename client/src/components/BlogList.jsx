import React, { useEffect, useState } from "react";
import { blogCategories } from "../assets/assets";
import { motion } from "motion/react";
import BlogCard from "../components/BlogCard";
import { useAppContext } from "../context/AppContext";

const BlogList = () => {
  const [menu, setMenu] = useState("All");
  const { blogs, input, axios, token } = useAppContext();

  const [followingBlogs, setFollowingBlogs] = useState([]);
  const [loadingFollowing, setLoadingFollowing] = useState(false);

  // Fetch the "Following" feed only when that tab is actually selected —
  // no point calling it on every page load for users who never click it.
  useEffect(() => {
    if (menu !== "Following" || !token) return;

    const fetchFollowingFeed = async () => {
      setLoadingFollowing(true);
      try {
        const { data } = await axios.get("/api/blog/feed");
        if (data.success) setFollowingBlogs(data.blogs);
      } catch (error) {
        // silent — feed just stays empty on failure, not worth a toast here
      } finally {
        setLoadingFollowing(false);
      }
    };
    fetchFollowingFeed();
  }, [menu, token]);

  const filteredBlogs = () => {
    const source = menu === "Following" ? followingBlogs : blogs;
    if (input === "") return source;
    return source.filter(
      (blog) =>
        blog.title.toLowerCase().includes(input.toLowerCase()) ||
        blog.category.toLowerCase().includes(input.toLowerCase())
    );
  };

  // "Following" already IS the fully-filtered set (no category narrowing —
  // posts from people you follow, across every category, all show up here).
  const visibleBlogs =
    menu === "Following"
      ? filteredBlogs()
      : filteredBlogs().filter((blog) => (menu === "All" ? true : blog.category === menu));

  return (
    <div>
      {/* Category Tabs */}
      <div className="flex justify-center flex-wrap gap-2 sm:gap-3 my-12 relative">
        {token && (
          <div className="relative">
            <button
              onClick={() => setMenu("Following")}
              className={`relative cursor-pointer text-sm px-5 py-2 rounded-full transition-colors ${
                menu === "Following" ? "text-white" : "text-[#241F2E]/55 hover:text-[#241F2E]"
              }`}
            >
              <span className="relative z-10">Following</span>
              {menu === "Following" && (
                <motion.div
                  layoutId="underline"
                  transition={{ type: "spring", stiffness: 200, damping: 30 }}
                  className="absolute inset-0 bg-primary rounded-full"
                />
              )}
            </button>
          </div>
        )}

        {blogCategories.map((item, index) => (
          <div key={item || index} className="relative">
            <button
              onClick={() => setMenu(item)}
              className={`relative cursor-pointer text-sm px-5 py-2 rounded-full transition-colors ${
                menu === item ? "text-white" : "text-[#241F2E]/55 hover:text-[#241F2E]"
              }`}
            >
              <span className="relative z-10">{item}</span>
              {menu === item && (
                <motion.div
                  layoutId="underline"
                  transition={{ type: "spring", stiffness: 200, damping: 30 }}
                  className="absolute inset-0 bg-primary rounded-full"
                />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Blog Cards */}
      {menu === "Following" && loadingFollowing ? (
        <p className="text-center text-[#241F2E]/40 text-sm mb-24">Loading your feed…</p>
      ) : visibleBlogs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-24 mx-5 sm:mx-10 lg:mx-16 xl:mx-40">
          {visibleBlogs.map((blog) => (
            <BlogCard key={blog._id} blog={blog} />
          ))}
        </div>
      ) : (
        <div className="text-center mb-24 mx-8">
          <p className="text-[#241F2E]/60 font-medium">
            {menu === "Following" ? "No posts from writers you follow yet." : "No stories here yet."}
          </p>
          <p className="text-[#241F2E]/40 text-sm mt-1">
            {menu === "Following"
              ? "Follow some writers to see their posts here."
              : input
              ? "Try a different search term."
              : "Check back soon, or explore another category."}
          </p>
        </div>
      )}
    </div>
  );
};

export default BlogList;
