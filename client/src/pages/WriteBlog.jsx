import React, { useRef, useState, useEffect } from "react";
import { assets, blogCategories } from "../assets/assets";
import Quill from "quill";
import { useAppContext } from "../context/AppContext";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { parse } from "marked";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

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

  const onSubmitHandler = async (e) => {
    try {
      e.preventDefault();
      setIsAdding(true);

      const blog = {
        title,
        subTitle,
        description: quillRef.current.root.innerHTML,
        category,
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
        navigate("/");
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
              className="absolute bottom-1 right-2 ml-2 text-white bg-[#241F2E]/80 px-4 py-1.5 text-xs rounded cursor-pointer hover:bg-[#241F2E] transition-colors"
              type="button"
              onClick={generateContent}
            >
              Generate with AI
            </button>
          </div>

          <p className="text-sm font-medium text-[#241F2E]/70 mt-4 mb-2">Category</p>
          <select
            onChange={(e) => setCategory(e.target.value)}
            value={category}
            required
            name="category"
            className="px-3 py-2.5 border border-[#241F2E]/15 rounded-lg text-[#241F2E]/80 outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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

          <button
            disabled={isAdding}
            type="submit"
            className={`mt-8 block w-full sm:w-auto px-8 py-3 rounded-full text-white font-medium bg-primary transition-all cursor-pointer ${
              isAdding ? "opacity-60 cursor-not-allowed" : "hover:bg-[#453adf]"
            }`}
          >
            {isAdding ? "Publishing…" : "Publish"}
          </button>
        </div>
      </form>

      <Footer />
    </div>
  );
};

export default WriteBlog;
