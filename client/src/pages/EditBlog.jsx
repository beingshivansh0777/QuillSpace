import React, { useRef, useState, useEffect } from "react";
import { assets, blogCategories } from "../assets/assets";
import Quill from "quill";
import { useAppContext } from "../context/AppContext";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Loader from "../components/Loader";

const EDIT_WINDOW_MS = 30 * 60 * 1000;

const EditBlog = () => {
  const { id } = useParams();
  const { axios, token, user } = useAppContext();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [notAllowed, setNotAllowed] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const [image, setImage] = useState(false);
  const [title, setTitle] = useState("");
  const [subTitle, setSubTitle] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const { data } = await axios.get(`/api/blog/${id}`);
        if (!data.success) {
          setNotAllowed(true);
          return;
        }

        const isOwner = data.blog.author?._id === user?._id;
        const age = Date.now() - new Date(data.blog.createdAt).getTime();

        if (!isOwner || age > EDIT_WINDOW_MS) {
          setNotAllowed(true);
          return;
        }

        setBlog(data.blog);
        setTitle(data.blog.title);
        setSubTitle(data.blog.subTitle);
        setCategory(data.blog.category);
      } catch (error) {
        setNotAllowed(true);
      }
    };
    if (token && user) fetchBlog();
  }, [id, token, user]);

  useEffect(() => {
    if (!quillRef.current && editorRef.current && blog) {
      quillRef.current = new Quill(editorRef.current, { theme: "snow" });
      quillRef.current.root.innerHTML = blog.description;
    }
  }, [blog]);

  const generateContent = async () => {
    if (!title) return toast.error("Please enter a title");
    try {
      setLoadingAI(true);
      const { data } = await axios.post("/api/blog/generate", { prompt: title });
      if (data.success) {
        quillRef.current.root.innerHTML = data.content;
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoadingAI(false);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        title,
        subTitle,
        description: quillRef.current.root.innerHTML,
        category,
      };
      const formData = new FormData();
      formData.append("blog", JSON.stringify(payload));
      if (image) formData.append("image", image);

      const { data } = await axios.patch(`/api/blog/update/${id}`, formData);
      if (data.success) {
        toast.success(data.message);
        navigate(`/blog/${id}`);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#FBF9F5]">
        <Navbar />
        <div className="max-w-md mx-auto mt-24 text-center px-5">
          <p className="text-[#241F2E]/60">
            Please <Link to="/login" className="text-primary font-semibold hover:underline">login</Link> to edit posts.
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (notAllowed) {
    return (
      <div className="min-h-screen bg-[#FBF9F5]">
        <Navbar />
        <div className="max-w-md mx-auto mt-24 text-center px-5">
          <h2 className="text-2xl font-semibold text-[#241F2E] mb-2">Can't edit this post</h2>
          <p className="text-[#241F2E]/55">
            This is either not your post, or the 30-minute edit window has passed.
          </p>
          <Link to="/profile" className="inline-block mt-4 text-primary font-semibold hover:underline">
            Back to My Posts
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (!blog) return <Loader />;

  return (
    <div className="min-h-screen bg-[#FBF9F5]">
      <Navbar />

      <form onSubmit={onSubmitHandler} className="max-w-3xl mx-auto px-5 py-12">
        <h1 className="text-3xl font-semibold text-[#241F2E] mb-1">Edit story</h1>
        <p className="text-[#241F2E]/55 mb-8 text-sm">
          You can edit this post for up to 30 minutes after publishing.
        </p>

        <div className="bg-white rounded-2xl border border-[#241F2E]/8 p-6 sm:p-8">
          <p className="text-sm font-medium text-[#241F2E]/70 mb-2">Thumbnail</p>
          <label htmlFor="image">
            <img
              src={!image ? blog.image : URL.createObjectURL(image)}
              alt=""
              className="h-32 rounded-lg cursor-pointer border border-[#241F2E]/10 object-cover"
            />
            <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
          </label>
          <p className="text-xs text-[#241F2E]/40 mt-1">Click to replace</p>

          <p className="text-sm font-medium text-[#241F2E]/70 mt-6 mb-2">Blog Title</p>
          <input
            type="text"
            required
            className="w-full p-3 rounded-lg border border-[#241F2E]/15 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            onChange={(e) => setTitle(e.target.value)}
            value={title}
          />

          <p className="text-sm font-medium text-[#241F2E]/70 mt-6 mb-2">Sub Title</p>
          <input
            type="text"
            required
            className="w-full p-3 rounded-lg border border-[#241F2E]/15 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            onChange={(e) => setSubTitle(e.target.value)}
            value={subTitle}
          />

          <p className="text-sm font-medium text-[#241F2E]/70 mt-6 mb-2">Blog Description</p>
          <div className="pb-16 sm:pb-10 pt-2 relative">
            <div ref={editorRef} className="bg-white"></div>
            {loadingAI && (
              <div className="absolute right-0 top-0 bottom-0 left-0 flex items-center justify-center bg-black/10 mt-2 rounded">
                <div className="w-8 h-8 rounded-full border-2 border-t-white animate-spin"></div>
              </div>
            )}
            <button
              disabled={loadingAI}
              className="absolute bottom-1 right-2 ml-2 text-white bg-[#241F2E]/80 px-4 py-1.5 text-xs rounded cursor-pointer hover:bg-[#241F2E] transition-colors"
              type="button"
              onClick={generateContent}
            >
              Regenerate with AI
            </button>
          </div>

          <p className="text-sm font-medium text-[#241F2E]/70 mt-4 mb-2">Category</p>
          <select
            onChange={(e) => setCategory(e.target.value)}
            value={category}
            required
            className="px-3 py-2.5 border border-[#241F2E]/15 rounded-lg text-[#241F2E]/80 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
          >
            {blogCategories.filter((c) => c !== "All").map((item, i) => (
              <option key={i} value={item}>{item}</option>
            ))}
          </select>

          <div className="flex gap-3 mt-8">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 rounded-full border border-[#241F2E]/20 text-[#241F2E]/70 hover:bg-[#241F2E]/5 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={isSaving}
              type="submit"
              className={`px-8 py-3 rounded-full text-white font-medium bg-primary transition-all cursor-pointer ${
                isSaving ? "opacity-60 cursor-not-allowed" : "hover:bg-[#453adf]"
              }`}
            >
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </form>

      <Footer />
    </div>
  );
};

export default EditBlog;
