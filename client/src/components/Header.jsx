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
    <div className='mx-5 sm:mx-16 xl:mx-24 relative'>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@500&display=swap');
        .ql-hero-display { font-family: 'Instrument Serif', serif; }
        .ql-hero-eyebrow { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.14em; }
        .ql-hero-stroke {
          stroke-dasharray: 220;
          stroke-dashoffset: 220;
          animation: ql-hero-draw 1.2s 0.2s ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .ql-hero-stroke { animation: none; stroke-dashoffset: 0; }
        }
        @keyframes ql-hero-draw { to { stroke-dashoffset: 0; } }
      `}</style>

      <div className='text-center mt-24 mb-10'>
        <div className='inline-flex items-center justify-center gap-2 px-4 py-1.5 mb-6 border border-[#C9A227]/40 bg-[#C9A227]/10 rounded-full'>
          <span className='w-1.5 h-1.5 rounded-full bg-[#C9A227]' />
          <p className='ql-hero-eyebrow text-[10px] text-[#8a6f1a]'>AI-ASSISTED WRITING</p>
        </div>

        <h1 className='ql-hero-display text-4xl sm:text-6xl leading-[1.15] text-[#241F2E]'>
          Unleash your thoughts with<br />
          <span className='text-primary italic'>QuillSpace.</span>
        </h1>

        <svg width="140" height="18" viewBox="0 0 140 18" fill="none" className="mx-auto mt-4" aria-hidden="true">
          <path
            className="ql-hero-stroke"
            d="M2 13 C 30 3, 55 16, 80 8 S 120 2, 138 10"
            stroke="#5044E5"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>

        <p className='ql-hero-eyebrow mt-6 text-[#241F2E]/50 text-[11px] max-w-md mx-auto'>
          TURN WORDS INTO WORLDS — EVERY STORY DESERVES AN AUDIENCE
        </p>

        <form onSubmit={onSubmitHandler} className='flex max-w-lg justify-between mt-8 mx-auto bg-white border border-[#241F2E]/15 rounded-full overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all'>
            <input ref={inputRef} className='w-full pl-5 outline-none text-[#241F2E] placeholder:text-[#241F2E]/35' type="text" placeholder='Search for blogs' required />
            <button className='bg-primary text-white px-7 py-2.5 m-1.5 rounded-full hover:bg-[#453adf] transition-all cursor-pointer text-sm font-medium' type='submit'>Search</button>
        </form>

      </div>
       <div className='text-center'>
       {
       input &&  <button onClick={onClear} className='border border-[#241F2E]/20 font-light text-xs py-1.5 px-4 rounded-full text-[#241F2E]/60 hover:bg-[#241F2E]/5 transition-colors cursor-pointer'>Clear Search</button>
        }
       </div>
      <img src={assets.gradientBackground} alt="" className='absolute -top-50 -z-1 opacity-40' />
    </div>
  )
}

export default Header
