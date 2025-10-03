import React from 'react'
import { assets, footer_data } from '../assets/assets'
import Logo from '../assets/logo.jpeg'
import { MdEmail } from "react-icons/md";
import { FaInstagram, FaTwitter, FaLinkedin, FaGithub } from "react-icons/fa";

const Footer = () => {
  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-32 bg-primary/3'>
      <div className='flex flex-col md:flex-row items-start justify-between gap-10 py-10 border-b border-gray-500/30 text-gray-500'> 
        
        {/* Left Section */}
        <div>
          <img src={Logo} alt="" className='w-32 sm:w-44' />
          <p className='max-w-[410px] mt-6 text-blue-950'>
            "QuillSpace is more than just a name - it's a space where creativity meets technology. 
            We bring together blogs, projects and stories that spark curiosity, inspire innovation, 
            and connect like-minded thinkers."
          </p>
        </div>

        {/* Right Section */}
        <div className='flex flex-col gap-6 text-blue-950'>
          
          {/* Contact Us */}
          <div>
            <h2 className='text-lg font-semibold mb-3'>Contact Us</h2>
            <div className='flex items-center gap-2'>
              <MdEmail size={20} />
              <a href="mailto:luckymishra2625@gmail.com" className='hover:underline'>
                luckymishra2625@gmail.com
              </a>
            </div>
          </div>

          {/* Follow Us */}
          <div>
            <h2 className='text-lg font-semibold mb-3'>Follow Us</h2>
            <div className='flex gap-4 text-xl'>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
              <a href="https://x.com/Mishra0857?t=CTZ2W5OLf3J138dwSN5IpQ&s=09" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
              <a href="https://www.linkedin.com/in/shivansh-mishra-233b5b2aa?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer"><FaLinkedin /></a>
              <a href="https://github.com/beingshivansh0777" target="_blank" rel="noopener noreferrer"><FaGithub /></a>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Bottom */}
      <p className='py-4 text-center text-sm md:text-base text-blue-950'>
        Copyright 2025 &copy; QuillSpace - All Rights Reserved.
      </p>
      <p className='py-2 text-center text-sm md:text-base text-blue-950'>
        Designed and Developed with ❤️ By - Shivansh Mishra
      </p>
    </div>
  )
}

export default Footer