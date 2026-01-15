import { useContext, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import { Toaster } from 'react-hot-toast'
import { AuthContext } from '../context/AuthContext'

function App() {

  const [count, setCount] = useState(0)
  const { authUser } = useContext(AuthContext)

  return (
    <>
      <div className="bg-[url('/bgImage.svg')] bg-contain" >
        <Toaster />
        <Routes>
          <Route path='/' element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path='/login' element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path='/profile' element={authUser ? <ProfilePage /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </>
  )
}

export default App
