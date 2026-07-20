import React, { useRef, useState, useEffect } from "react";
import { assets, blogCategories } from "../assets/assets";
import Quill from "quill";
import { useAppContext } from "../context/AppContext";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { parse } from "marked";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { HiOutlineGlobeAlt, HiOutlineDocumentText, HiOutlineClock, HiSparkles } from "react-icons/hi";

const WriteBlog = () => {
  const { axios, token } = useAppContext();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const [image, setImage] = useState(false);
  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [category, setCategory] = useState("");
  const [publishMode, setPublishMode] = useState("publish"); // "publish" | "draft" | "schedule"
  const [scheduledFor, setScheduledFor] = useState("");

  const publishOptions = [
    {
      key: "publish",
      icon: HiOutlineGlobeAlt,
      title: "Publish now",
      desc: "Goes live immediately for everyone to read.",
    },
    {
      key: "draft",
      icon: HiOutlineDocumentText,
      title: "Save as draft",
      desc: "Only visible to you, until you're ready.",
    },
    {
      key: "schedule",
      icon: HiOutlineClock,
      title: "Schedule",
      desc: "Automatically goes live at a time you choose.",
    },
  ];

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();

      if (publishMode === "schedule" && !scheduledFor) {
        toast.error("Please pick a date and time to schedule for.");
        return;
      }
      if (publishMode === "schedule" && new Date(scheduledFor) <= new Date()) {
        toast.error("Scheduled time must be in the future.");
        return;
      }

      setIsAdding(true);

      const blog = {
        title,
        subTitle,
        description: quillRef.current.root.innerHTML,
        category,
        isPublished: publishMode === "publish",
        scheduledFor: publishMode === "schedule" ? new Date(scheduledFor).toISOString() : null,
      };
      const formData = new FormData();
      formData.append("blog", JSON.stringify(blog));
      formData.append("image", image);

      const { data } = await axios.post("/api/blog/add", formData);
      if (data.success) {
        toast.success(data.message);
        setImage(false);
        setTitle("");
        setSubTitle("");
        quillRef.current.root.innerHTML = "";
        setCategory("");
        navigate(publishMode === "publish" ? "/" : "/profile");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsAdding(false);
    }
  };

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, { theme: "snow" });
    }
  }, []);

  const generateContent = async () => {
    if (!title) return toast.error("Please enter a title");
    try {
      setLoading(true);
      const { data } = await axios.post("/api/blog/generate", {
        prompt: title,
      });
      if (data.success) {
        quillRef.current.root.innerHTML = parse(data.content);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#FBF9F5]">
        <Navbar />
        <div className="max-w-md mx-auto mt-24 p-6 text-center">
          <h2 className="text-2xl font-semibold text-[#241F2E] mb-2">Write on QuillSpace</h2>
          <p className="text-[#241F2E]/60 mb-6">
            Please{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              login or register
            </Link>{" "}
            to start writing.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5]">
      <Navbar />

      <form
        onSubmit={onSubmitHandler}
        className="max-w-3xl mx-auto px-5 py-12"
      >
        <h1 className="text-3xl font-semibold text-[#241F2E] mb-1">Write a new story</h1>
        <p className="text-[#241F2E]/55 mb-8 text-sm">
          Your story goes live as soon as you hit publish.
        </p>

        <div className="bg-white rounded-2xl border border-[#241F2E]/8 p-6 sm:p-8">
          <p className="text-sm font-medium text-[#241F2E]/70 mb-2">Upload Thumbnail</p>
          <label htmlFor="image">
            <img
              src={!image ? assets.upload_area : URL.createObjectURL(image)}
              alt=""
              className="h-32 rounded-lg cursor-pointer border border-[#241F2E]/10 object-cover"
            />
            <input
              onChange={(e) => setImage(e.target.files[0])}
              type="file"
              id="image"
              hidden
              required
            />
          </label>

          <p className="text-sm font-medium text-[#241F2E]/70 mt-6 mb-2">Blog Title</p>
          <input
            type="text"
            placeholder="Give your story a title"
            required
            className="w-full p-3 rounded-lg border border-[#241F2E]/15 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            onChange={(e) => setTitle(e.target.value)}
            value={title}
          />

          <p className="text-sm font-medium text-[#241F2E]/70 mt-6 mb-2">Sub Title</p>
          <input
            type="text"
            placeholder="A short subtitle"
            required
            className="w-full p-3 rounded-lg border border-[#241F2E]/15 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            onChange={(e) => setSubTitle(e.target.value)}
            value={subTitle}
          />

          <p className="text-sm font-medium text-[#241F2E]/70 mt-6 mb-2">Blog Description</p>
          <div className="pb-16 sm:pb-10 pt-2 relative">
            <div ref={editorRef} className="bg-white"></div>
            {loading && (
              <div className="absolute right-0 top-0 bottom-0 left-0 flex items-center justify-center bg-black/10 mt-2 rounded">
                <div className="w-8 h-8 rounded-full border-2 border-t-white animate-spin"></div>
              </div>
            )}
            <button
              disabled={loading}
              className="absolute bottom-1 right-2 ml-2 flex items-center gap-1.5 text-white px-4 py-2 text-xs font-medium rounded-full cursor-pointer transition-all bg-[linear-gradient(135deg,#5044E5,#8B5CF6)] shadow-[0_4px_14px_-2px_rgba(80,68,229,0.5)] hover:shadow-[0_6px_18px_-2px_rgba(80,68,229,0.65)] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              type="button"
              onClick={generateContent}
            >
              <HiSparkles size={14} className={loading ? "animate-pulse" : ""} />
              {loading ? "Generating…" : "Generate with AI"}
            </button>
          </div>

          <p className="text-sm font-medium text-[#241F2E]/70 mt-4 mb-2">Category</p>
          <div className="relative w-full sm:w-56">
            <select
              onChange={(e) => setCategory(e.target.value)}
              value={category}
              required
              name="category"
              className="w-full appearance-none px-3 py-2.5 pr-9 border border-[#241F2E]/15 rounded-lg text-[#241F2E]/80 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all bg-white cursor-pointer"
            >
              <option value="">Select Category</option>
              {blogCategories
                .filter((item) => item !== "All")
                .map((item, index) => (
                  <option key={index} value={item}>
                    {item}
                  </option>
                ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#241F2E]/40 text-xs">
              ▼
            </span>
          </div>

          {/* Publishing options */}
          <div className="mt-8 pt-6 border-t border-[#241F2E]/8">
            <p className="text-sm font-semibold text-[#241F2E] mb-3">Publishing</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {publishOptions.map((opt) => {
                const Icon = opt.icon;
                const selected = publishMode === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setPublishMode(opt.key)}
                    className={`text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      selected
                        ? "border-primary bg-primary/5"
                        : "border-[#241F2E]/10 hover:border-[#241F2E]/25"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon
                        size={20}
                        className={selected ? "text-primary" : "text-[#241F2E]/50"}
                      />
                      {selected && (
                        <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-medium ${selected ? "text-primary" : "text-[#241F2E]"}`}>
                      {opt.title}
                    </p>
                    <p className="text-xs text-[#241F2E]/50 mt-0.5 leading-snug">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>

            {publishMode === "schedule" && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-[#241F2E]/60 mb-1.5">
                  Publish at
                </label>
                <input
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                  required
                  className="w-full sm:w-auto px-3 py-2.5 rounded-lg border border-[#241F2E]/15 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
            )}

            <button
              disabled={isAdding}
              type="submit"
              className={`mt-6 w-full sm:w-auto px-8 py-3 rounded-full text-white font-medium bg-primary transition-all cursor-pointer flex items-center justify-center gap-2 ${
                isAdding ? "opacity-60 cursor-not-allowed" : "hover:bg-[#453adf]"
              }`}
            >
              {isAdding ? (
                "Saving…"
              ) : (
                <>
                  {publishMode === "publish" && <HiOutlineGlobeAlt size={17} />}
                  {publishMode === "draft" && <HiOutlineDocumentText size={17} />}
                  {publishMode === "schedule" && <HiOutlineClock size={17} />}
                  {publishMode === "publish"
                    ? "Publish"
                    : publishMode === "draft"
                    ? "Save as draft"
                    : "Schedule post"}
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      <Footer />
    </div>
  );
};

export default WriteBlog;
