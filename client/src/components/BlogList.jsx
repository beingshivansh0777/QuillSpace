import React, { useState } from "react";
import { blogCategories } from "../assets/assets";
import { motion } from "motion/react";
import BlogCard from "../components/BlogCard";
import { useAppContext } from "../context/AppContext";

const BlogList = () => {
  const [menu, setMenu] = useState("All");
  const { blogs, input } = useAppContext();

  const filteredBlogs = () => {
    if (input === "") {
      return blogs;
    }
    return blogs.filter(
      (blog) =>
        blog.title.toLowerCase().includes(input.toLowerCase()) ||
        blog.category.toLowerCase().includes(input.toLowerCase())
    );
  };

  const visibleBlogs = filteredBlogs().filter((blog) =>
    menu === "All" ? true : blog.category === menu
  );

  return (
    <div>
      {/* Category Tabs */}
      <div className="flex justify-center flex-wrap gap-2 sm:gap-3 my-12 relative">
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
      {visibleBlogs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-24 mx-5 sm:mx-10 lg:mx-16 xl:mx-40">
          {visibleBlogs.map((blog) => (
            <BlogCard key={blog._id} blog={blog} />
          ))}
        </div>
      ) : (
        <div className="text-center mb-24 mx-8">
          <p className="text-[#241F2E]/60 font-medium">No stories here yet.</p>
          <p className="text-[#241F2E]/40 text-sm mt-1">
            {input ? "Try a different search term." : "Check back soon, or explore another category."}
          </p>
        </div>
      )}
    </div>
  );
};

export default BlogList;
