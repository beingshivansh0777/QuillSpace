import React, { useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { HiOutlineMail } from "react-icons/hi";

const NewsLetter = () => {
  const { axios } = useAppContext();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post("/api/newsletter/subscribe", { email });
      if (data.success) {
        toast.success(data.message);
        setSubscribed(true);
        setEmail("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative my-24 sm:my-32 px-5">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500&display=swap');
        .ql-nl-display { font-family: 'Instrument Serif', serif; }
        .ql-nl-eyebrow { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.14em; }
      `}</style>

      <div className="max-w-2xl mx-auto text-center bg-[linear-gradient(160deg,#1B1830_0%,#2E1F66_75%,#3B2C7A_100%)] rounded-3xl px-6 sm:px-14 py-12 sm:py-16">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 mb-6 border border-[#C9A227]/40 bg-[#C9A227]/10 rounded-full">
          <HiOutlineMail size={13} className="text-[#C9A227]" />
          <p className="ql-nl-eyebrow text-[10px] text-[#C9A227]">STAY IN THE LOOP</p>
        </div>

        <h2 className="ql-nl-display text-3xl sm:text-4xl text-white leading-tight">
          Don't miss out on fresh insights.
        </h2>
        <p className="text-white/55 text-sm sm:text-base mt-3 mb-8 max-w-md mx-auto">
          Subscribe to get the latest stories, ideas, and updates from QuillSpace writers — straight to your inbox.
        </p>

        {subscribed ? (
          <p className="text-white/80 text-sm">
            🎉 You're subscribed! Check your inbox for a confirmation.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-center sm:items-stretch gap-3 max-w-md mx-auto"
          >
            <input
              className="w-full sm:flex-1 h-12 px-4 rounded-xl sm:rounded-r-none border border-white/15 sm:border-0 outline-none bg-white text-base text-[#241F2E] placeholder:text-[#241F2E]/40 focus:ring-2 focus:ring-[#C9A227]/60 transition-all"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className={`h-10 sm:h-12 px-6 sm:px-8 rounded-full sm:rounded-xl sm:rounded-l-none text-sm sm:text-base font-medium text-white bg-primary transition-all cursor-pointer whitespace-nowrap ${
                loading ? "opacity-60 cursor-not-allowed" : "hover:bg-[#453adf]"
              }`}
            >
              {loading ? "Subscribing…" : "Subscribe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default NewsLetter;
