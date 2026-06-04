import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import DetailPage from './pages/DetailPage'
import WatchPage from './pages/WatchPage'
import Navbar from './components/Navbar'
import './index.css' // Import general CSS

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/phim/:slug" element={<DetailPage />} />
        <Route path="/xem-phim/:slug/:episode" element={<WatchPage />} />
      </Routes>
    </Router>
  )
}

export default App

