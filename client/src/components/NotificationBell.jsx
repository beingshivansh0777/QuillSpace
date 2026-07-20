import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HiOutlineBell } from "react-icons/hi";
import Moment from "moment";
import { useAppContext } from "../context/AppContext";

const NotificationBell = () => {
  const { axios, token } = useAppContext();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await axios.get("/api/notifications/unread-count");
      if (data.success) setUnreadCount(data.count);
    } catch (error) {
      // fail silently — not critical
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get("/api/notifications");
      if (data.success) setNotifications(data.notifications);
    } catch (error) {
      // fail silently
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [token]);

  const handleOpen = () => {
    setShowDropdown((v) => !v);
    if (!showDropdown) fetchNotifications();
  };

  const handleClickNotification = async (notif) => {
    try {
      await axios.patch(`/api/notifications/read/${notif._id}`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - (notif.isRead ? 0 : 1)));
    } catch (error) {
      // ignore
    }
    setShowDropdown(false);
    if (notif.blog?._id) navigate(`/blog/${notif.blog._id}`);
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.patch("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      // ignore
    }
  };

  const messageFor = (notif) => {
    const actorName = notif.actor?.name || "Someone";
    if (notif.type === "blog_comment") {
      return `${actorName} commented on your post "${notif.blog?.title || "a post"}"`;
    }
    if (notif.type === "comment_like") {
      return `${actorName} liked your comment on "${notif.blog?.title || "a post"}"`;
    }
    return "New notification";
  };

  if (!token) return null;

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        aria-label="Notifications"
        className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#241F2E]/5 transition-colors cursor-pointer"
      >
        <HiOutlineBell size={22} className="text-[#241F2E]/70" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-semibold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-sm text-gray-800">Notifications</p>
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-400">
              No notifications yet.
            </p>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif._id}
                onClick={() => handleClickNotification(notif)}
                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer ${
                  !notif.isRead ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 overflow-hidden">
                    {notif.actor?.avatar ? (
                      <img src={notif.actor.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      notif.actor?.name?.charAt(0).toUpperCase() || "?"
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 leading-snug">{messageFor(notif)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {Moment(notif.createdAt).fromNow()}
                    </p>
                  </div>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
