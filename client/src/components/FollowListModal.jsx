import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

// Generic modal — shows either a "followers" or "following" list for a given
// userId. Reuses the existing GET /api/follow/followers/:id and
// GET /api/follow/following/:id endpoints, no new backend work needed.
const FollowListModal = ({ userId, type, onClose }) => {
  const { axios } = useAppContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchList = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/follow/${type}/${userId}`);
        if (data.success) setUsers(data.users);
      } catch (error) {
        // silent — modal just shows the empty state below
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [userId, type]);

  const title = type === "followers" ? "Followers" : "Following";

  // Rendered via portal so it's never trapped inside an ancestor with
  // backdrop-filter/transform (e.g. Navbar's backdrop-blur-md) — same fix
  // as ResetPasswordModal.
  return createPortal(
    <div
      className="fixed inset-0 bg-black/40 flex items-start justify-center z-100 px-4 py-10 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl my-auto max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-lg font-semibold text-[#241F2E]">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-[#241F2E]/40 hover:text-[#241F2E] text-2xl leading-none cursor-pointer"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1 -mx-2">
          {loading ? (
            <p className="text-center text-[#241F2E]/40 text-sm py-8">Loading…</p>
          ) : users.length > 0 ? (
            <div className="flex flex-col gap-1">
              {users.map((u) => {
                const initial = u.name?.charAt(0).toUpperCase() || "?";
                const row = (
                  <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold overflow-hidden shrink-0">
                      {u.avatar ? (
                        <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        initial
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#241F2E] truncate">{u.name}</p>
                      {u.username && (
                        <p className="text-xs text-primary truncate">@{u.username}</p>
                      )}
                    </div>
                  </div>
                );

                // Only linkable if they've set a username — public profiles
                // are keyed off username, not every user has one yet.
                return u.username ? (
                  <Link key={u._id} to={`/user/${u.username}`} onClick={onClose}>
                    {row}
                  </Link>
                ) : (
                  <div key={u._id}>{row}</div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-[#241F2E]/40 text-sm py-8">
              {type === "followers" ? "No followers yet." : "Not following anyone yet."}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FollowListModal;
