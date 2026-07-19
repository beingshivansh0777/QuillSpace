import React from 'react'
import './App.css'
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Blog from './pages/Blog.jsx'
import WriteBlog from './pages/WriteBlog.jsx'
import EditBlog from './pages/EditBlog.jsx'
import MyProfile from './pages/MyProfile.jsx'
import PublicProfile from './pages/PublicProfile.jsx'
import Layout from './pages/admin/Layout.jsx'
import Dashboard from './pages/admin/Dashboard.jsx'
import ListBlog from './pages/admin/ListBlog.jsx'
import Comments from './pages/admin/Comments.jsx'
import Login from './components/admin/Login.jsx'

import 'quill/dist/quill.snow.css'
import {Toaster} from 'react-hot-toast'
import { useAppContext } from './context/AppContext.jsx'


const App = () => {

  const {token} =useAppContext()

  return (
    <div>
      <Toaster/>
       <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/blog/:id" element={<Blog/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/write" element={<WriteBlog/>} />
        <Route path="/edit/:id" element={<EditBlog/>} />
        <Route path="/profile" element={<MyProfile/>} />
        <Route path="/user/:username" element={<PublicProfile/>} />
        <Route path='/admin' element={token ? <Layout/> : <Login/>}>
           <Route index element={<Dashboard/>}/>
            <Route path='listBlog' element={<ListBlog/>}/>
             <Route path='comments' element={<Comments/>}/>
        </Route>
       </Routes>
      
    </div>
  )
}

export default App
