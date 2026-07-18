import React from "react";
import { useNavigate } from "react-router-dom";
import Moment from "moment";

const estimateReadTime = (html = "") => {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const BlogCard = ({ blog }) => {

  const { title, description, category, image, _id, createdAt } = blog;
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/blog/${_id}`)}
      className="group w-full rounded-2xl overflow-hidden bg-white border border-[#241F2E]/8 shadow-sm hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      <div className="relative overflow-hidden aspect-video bg-gray-100">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/90 backdrop-blur-sm text-primary shadow-sm">
          {category}
        </span>
      </div>

      <div className="p-5">
        <h5 className="mb-2 font-semibold text-[#241F2E] leading-snug line-clamp-2">
          {title}
        </h5>
        <p
          className="mb-4 text-sm text-[#241F2E]/60 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: description }}
        ></p>

        <div className="flex items-center justify-between text-xs text-[#241F2E]/40">
          <span>{createdAt ? Moment(createdAt).format("MMM D, YYYY") : ""}</span>
          <span>{estimateReadTime(description)} min read</span>
        </div>
      </div>
    </div>
  );
};

export default BlogCard;
