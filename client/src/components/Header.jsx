import React, { useRef } from 'react'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

const Header = () => {

  const {setInput,input} = useAppContext()
  const inputRef = useRef()

  const onSubmitHandler = async(e) => {
    e.preventDefault();
    setInput(inputRef.current.value)
  }

    const onClear = () => {
      setInput('')
      inputRef.current.value =''
    }

  return (
    <div className='mx-8 sm:mx-16 xl:mx-24 relative'>
      <div className='text-center mt-20 mb-8'>
       <div className='inline-flex items-center justify-center gap-4 px-6 py-1.5 mb-4 border border-primary/40 bg-primary/10 rounded-full text-sm'>
        <p>New:AI feature integrated</p>
        <img src={assets.star_icon} className='w-2.5' alt="" />
       </div>

        <h1 className='text-3xl sm:text-6xl font-semibold sm:leading-16'>Unleash Your Thoughts with <br /> <span className='text-primary'>QuillSpace.</span></h1>
        <p className='my-6 sm:my-8 max-w-2xl m-auto max-sm:text-xs'>Turn Words into World.Because every story deserves an audience.</p>
  
        <form onSubmit={onSubmitHandler} className='flex max-w-lg justify-between max-sm:scale-75 mx-auto border border-gray-300 rounded-full overflow-hidden'>
            <input ref={inputRef} className='w-full pl-4 outline-none' type="text" placeholder='Search for blogs' required />
            <button className='bg-primary text-white px-8 py-2 m-1.5 rounded-full hover:scale-105 transition-all cursor-pointer' type='submit'>Search</button>
        </form>

      </div>
       <div className='text-center'>
       {
       input &&  <button onClick={onClear} className='border font-light text-xs py-1 px-3 rounded-sm shadow-custom-sm cursor-pointer'>Clear Search</button>
        }
       </div>
      <img src={assets.gradientBackground} alt="" className='absolute -top-50 -z-1 opacity-50' />
    </div>
  )
}

export default Header
