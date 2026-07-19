import React, { useState } from "react";
import { assets } from "../../assets/assets";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const CommentTableItem = ({ comment, fetchComments }) => {
  const { blog, createdAt, _id, name, user, content } = comment;
  const BlogDate = new Date(createdAt);
  const { axios } = useAppContext();

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const authorName = user?.name || name || "Unknown";

  const deleteComment = async () => {
    try {
      const { data } = await axios.post("/api/admin/delete-comment", { id: _id });
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
          <b className="font-medium text-gray-600">Blog</b>: {blog?.title || "Deleted post"}
          <br /> <br />
          <b className="font-medium text-gray-600">Name</b>: {authorName}
          <br />
          <b className="font-medium text-gray-600">Comment</b>: {content}
        </td>
        <td className="px-6 py-4 max-sm:hidden">{BlogDate.toLocaleDateString()}</td>
        <td className="px-6 py-4">
          <div className="inline-flex items-center gap-4">
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
            <p className="mb-6">
              Are you sure you want to delete this comment?
              {comment.replies?.length > 0 && " Any replies to it will also be deleted."}
            </p>
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
