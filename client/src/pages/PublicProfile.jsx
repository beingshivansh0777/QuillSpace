import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Loader from "../components/Loader";
import toast from "react-hot-toast";

const PublicProfile = () => {
  const { username } = useParams();
  const { axios } = useAppContext();
  const [profile, setProfile] = useState(null);
  const [notFound, setNotFound] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#FBF9F5]">
      <Navbar />
      <div className="max-w-lg mx-auto mt-16 px-5 text-center">
        <div className="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center text-3xl font-semibold mx-auto mb-5">
          {initial}
        </div>
        <h1 className="text-2xl font-semibold text-[#241F2E]">{profile.name}</h1>
        <p className="text-primary text-sm mt-1">@{profile.username}</p>

        {profile.bio ? (
          <p className="text-[#241F2E]/65 mt-5 leading-relaxed">{profile.bio}</p>
        ) : (
          <p className="text-[#241F2E]/35 mt-5 italic">No bio yet.</p>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default PublicProfile;
