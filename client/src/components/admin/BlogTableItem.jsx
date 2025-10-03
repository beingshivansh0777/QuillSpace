import React, { useState } from "react";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const BlogTableItem = ({ blog, fetchBlogs, index }) => {
  const { title, createdAt } = blog;
  const BlogDate = new Date(createdAt);

  const { axios } = useAppContext();
  const [isModalOpen, setModalOpen] = useState(false);

  const deleteBlog = async () => {
    try {
      const { data } = await axios.post("/api/blog/delete", { id: blog._id });
      if (data.success) {
        toast.success(data.message);
        await fetchBlogs();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const togglePublish = async () => {
    try {
      const { data } = await axios.post("/api/blog/toggle-publish", {
        id: blog._id,
      });
      if (data.success) {
        toast.success(data.message);
        await fetchBlogs();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <tr className="border-y border-gray-300">
        <th className="px-2 py-4">{index}</th>
        <td className="px-2 py-4">{title}</td>
        <td className="px-2 py-4 max-sm:hidden">{BlogDate.toDateString()}</td>
        <td className="px-2 py-4">
          <p
            className={`${
              blog.isPublished ? "text-green-600" : "text-orange-700"
            }`}
          >
            {blog.isPublished ? "Published" : "UnPublished"}
          </p>
        </td>
        <td className="px-2 py-4 flex text-xs gap-3">
          <button
            onClick={togglePublish}
            className="border px-2 py-0.5 mt-1 rounded cursor-pointer"
          >
            {blog.isPublished ? "UnPublish" : "Publish"}
          </button>
          <img
            onClick={() => setModalOpen(true)}
            src={assets.cross_icon}
            className="w-8 hover:scale-110 transition-all cursor-pointer"
            alt=""
          />
        </td>
      </tr>

      {/* Styled Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-80">
            <h2 className="text-lg font-semibold mb-4">Delete Blog</h2>
            <p className="mb-6">Are you sure you want to delete this blog?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteBlog();
                  setModalOpen(false);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlogTableItem;