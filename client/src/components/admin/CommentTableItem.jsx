import React, { useState } from "react";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const CommentTableItem = ({ comment, fetchComments }) => {
  const { blog, createdAt, _id, name, content, isApproved } = comment;
  const BlogDate = new Date(createdAt);
  const { axios } = useAppContext();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const BACKEND_URL = "https://quillspace-e3v3.onrender.com";

  const approveComment = async () => {
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/admin/approve-comment`, { id: _id });
      if (data.success) {
        toast.success(data.message);
        fetchComments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const deleteComment = async () => {
    try {
      const { data } = await axios.post(`${BACKEND_URL}/api/admin/delete-comment`, { id: _id });
      if (data.success) {
        toast.success(data.message);
        fetchComments();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setShowDeleteModal(false);
    }
  };

  return (
    <>
      <tr className="border-b border-gray-300">
        <td className="px-6 py-4">
          <b className="font-medium text-gray-600">Blog</b>: {blog.title}
          <br /> <br />
          <b className="font-medium text-gray-600">Name</b>: {name}
          <br />
          <b className="font-medium text-gray-600">Comment</b>: {content}
        </td>
        <td className="px-6 py-4 max-sm:hidden">{BlogDate.toLocaleDateString()}</td>
        <td className="px-6 py-4">
          <div className="inline-flex items-center gap-4">
            {!isApproved ? (
              <img
                onClick={approveComment}
                src={assets.tick_icon}
                className="w-5 hover:scale-110 transition-all cursor-pointer"
              />
            ) : (
              <p className="text-xs border border-green-600 bg-green-100 text-green-600 rounded-full px-3 py-1">
                Approved
              </p>
            )}
            <img
              onClick={() => setShowDeleteModal(true)}
              src={assets.bin_icon}
              alt=""
              className="w-5 hover:scale-110 transition-all cursor-pointer"
            />
          </div>
        </td>
      </tr>

      {/* Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 w-80 text-center shadow-lg">
            <h2 className="text-lg font-bold mb-4">Confirm Delete</h2>
            <p className="mb-6">Are you sure you want to delete this comment?</p>
            <div className="flex justify-around">
              <button
                onClick={deleteComment}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CommentTableItem;
