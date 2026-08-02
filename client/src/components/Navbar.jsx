import React, { useState, useRef, useEffect } from "react";
import Logo from "../assets/navbarr.png";
import { assets } from "../assets/assets.js";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { HiOutlinePencilAlt, HiOutlineMenu, HiX } from "react-icons/hi";
import ResetPasswordModal from "./ResetPasswordModal";
import NotificationBell from "./NotificationBell";

const Navbar = () => {
  const { navigate, token, user, logout } = useAppContext();
  const [showMenu, setShowMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const menuRef = useRef(null);

  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route/logo click etc.
  const closeAll = () => {
    setShowMenu(false);
    setShowMobileMenu(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex justify-between items-center h-16 sm:h-20 px-4 sm:px-8 lg:px-20 xl:px-32">
        {/* Logo */}
        <img
          onClick={() => {
            closeAll();
            navigate("/");
          }}
          src={Logo}
          alt="QuillSpace Logo"
          className="w-32 sm:w-44 lg:w-52 h-auto object-contain cursor-pointer select-none shrink-0"
        />

        {token && user ? (
          <>
            {/* ---------- Desktop ---------- */}
            <div className="hidden sm:flex items-center gap-3 lg:gap-4">
              <button
                onClick={() => navigate("/write")}
                className="flex items-center gap-2 text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 hover:border-primary/50 rounded-full px-4 lg:px-5 py-2 transition-all duration-200 cursor-pointer"
              >
                <HiOutlinePencilAlt size={16} />
                <span>Write</span>
              </button>

              <NotificationBell />

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu((v) => !v)}
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold cursor-pointer overflow-hidden ring-2 ring-transparent hover:ring-primary/30 transition-all duration-200"
                >
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {user.name}
                      </p>
                      {user.username && (
                        <p className="text-xs text-primary truncate">
                          @{user.username}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {user.email}
                      </p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          navigate("/profile");
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        My Profile
                      </button>

                      <button
                        onClick={() => {
                          setShowMenu(false);
                          setShowResetModal(true);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        Reset Password
                      </button>

                      <button
                        onClick={() => {
                          setShowMenu(false);
                          navigate("/support");
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        Support
                      </button>

                      {user.role === "admin" && (
                        <button
                          onClick={() => {
                            setShowMenu(false);
                            navigate("/admin");
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          Dashboard
                        </button>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-1">
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ---------- Mobile ---------- */}
            <div className="flex sm:hidden items-center gap-2">
              <NotificationBell />
              <button
                onClick={() => setShowMobileMenu((v) => !v)}
                className="w-9 h-9 flex items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? <HiX size={22} /> : <HiOutlineMenu size={22} />}
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 rounded-full text-xs sm:text-sm cursor-pointer bg-primary text-white px-5 sm:px-8 lg:px-10 py-2 sm:py-2.5 hover:opacity-90 transition-opacity"
          >
            Login
            <img src={assets.arrow} className="w-3" alt="arrow" />
          </button>
        )}
      </div>

      {/* ---------- Mobile dropdown panel ---------- */}
      {token && user && showMobileMenu && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3 pb-3 mb-2 border-b border-gray-100">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold overflow-hidden shrink-0">
              {user.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>

          <button
            onClick={() => {
              closeAll();
              navigate("/write");
            }}
            className="w-full flex items-center gap-2 text-left px-3 py-2.5 text-sm font-medium text-primary rounded-lg hover:bg-primary/5 cursor-pointer"
          >
            <HiOutlinePencilAlt size={16} />
            Write
          </button>

          <button
            onClick={() => {
              closeAll();
              navigate("/profile");
            }}
            className="w-full text-left px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            My Profile
          </button>

          <button
            onClick={() => {
              setShowMobileMenu(false);
              setShowResetModal(true);
            }}
            className="w-full text-left px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Reset Password
          </button>

          <button
            onClick={() => {
              closeAll();
              navigate("/support");
            }}
            className="w-full text-left px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Support
          </button>

          {user.role === "admin" && (
            <button
              onClick={() => {
                closeAll();
                navigate("/admin");
              }}
              className="w-full text-left px-3 py-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Dashboard
            </button>
          )}

          <button
            onClick={() => {
              setShowMobileMenu(false);
              logout();
            }}
            className="w-full text-left px-3 py-2.5 text-sm text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
          >
            Logout
          </button>
        </div>
      )}

      {showResetModal && (
        <ResetPasswordModal onClose={() => setShowResetModal(false)} />
      )}
    </header>
  );
};

export default Navbar;