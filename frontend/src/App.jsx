import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DetailPage from './pages/DetailPage'
import WatchPage from './pages/WatchPage'
import UserLibraryPage from './pages/UserLibraryPage'
import Navbar from './components/Navbar'
import { AuthProvider } from './context/AuthContext'
import './index.css' // Import general CSS

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/phim/:slug" element={<DetailPage />} />
          <Route path="/xem-phim/:slug/:episode" element={<WatchPage />} />
          <Route path="/thu-vien" element={<UserLibraryPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
