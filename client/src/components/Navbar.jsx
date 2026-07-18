import React, { useState } from "react";
import Logo from "../assets/logo.jpeg";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import EditProfileModal from "./EditProfileModal";

const Navbar = () => {
  const { navigate, token, user, logout } = useAppContext();
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  return (
    <div className="flex justify-between items-center py-5 mx-8 sm:mx-20 xl:mx-32">
      <img
        onClick={() => navigate("/")}
        src={Logo}
        alt="Logo"
        className="w-32 sm:w-44 cursor-pointer"
      />

      {/* Logged in: show avatar + dropdown. Logged out: show Login button. */}
      {token && user ? (
        <div className="relative">
          <button
            onClick={() => setShowMenu((v) => !v)}
            className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold cursor-pointer"
          >
            {initial}
          </button>

          {showMenu && (
            <div className="absolute right-0 mt-2 w-44 sm:w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="font-medium text-sm text-gray-800 truncate">
                  {user.name}
                </p>
                {user.username && (
                  <p className="text-xs text-primary truncate">@{user.username}</p>
                )}
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>

              <button
                onClick={() => {
                  setShowMenu(false);
                  setShowEditModal(true);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Edit Profile
              </button>

              {user.role === "admin" && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    navigate("/admin");
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Dashboard
                </button>
              )}

              <button
                onClick={() => {
                  setShowMenu(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => navigate("/login")}
          className="flex items-center gap-2 rounded-full text-sm cursor-pointer bg-primary text-white px-10 py-2.5"
        >
          Login
          <img src={assets.arrow} className="w-3" alt="arrow" />
        </button>
      )}

      {showEditModal && <EditProfileModal onClose={() => setShowEditModal(false)} />}
    </div>
  );
};

export default Navbar;
