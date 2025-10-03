import React from 'react'

const Loader = () => {
  return (
    <div className='flex justify-center items-center h-screen flex-col'>
        
      <div className='animate-spin rounded-full h-16 w-16 border-4 border-t-white border-gray-700 mb-4'>
      </div>
      <p className="text-gray-600 font-medium animate-pulse">Loading Blogs...</p>
    </div>
  )
}

export default Loader
