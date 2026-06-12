import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Search, ChevronDown, Film, User, LogOut, Heart, Clock } from 'lucide-react';
import { OPHIM_BASE_URL } from '../config';
import { AuthContext } from '../context/AuthContext';
import AuthModal from './AuthModal';
import './Navbar.css';

const CATEGORIES = [
    { name: 'Hành Động', slug: 'hanh-dong' },
    { name: 'Tình Cảm', slug: 'tinh-cam' },
    { name: 'Hài Hước', slug: 'hai-huoc' },
    { name: 'Kinh Dị', slug: 'kinh-di' },
    { name: 'Hoạt Hình', slug: 'hoat-hinh' },
    { name: 'Viễn Tưởng', slug: 'vien-tuong' },
    { name: 'Cổ Trang', slug: 'co-trang' },
    { name: 'Tâm Lý', slug: 'tam-ly' },
    { name: 'Thể Thao', slug: 'the-thao' },
    { name: 'Hình Sự', slug: 'hinh-su' }
];

const COUNTRIES = [
    { name: 'Hàn Quốc', slug: 'han-quoc' },
    { name: 'Trung Quốc', slug: 'trung-quoc' },
    { name: 'Âu Mỹ', slug: 'au-my' },
    { name: 'Nhật Bản', slug: 'nhat-ban' },
    { name: 'Thái Lan', slug: 'thai-lan' }
];

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [pathImage, setPathImage] = useState('');
    
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    const { user, logout } = useContext(AuthContext);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close search dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Close search results when location changes
    useEffect(() => {
        setShowResults(false);
        setSearchInput('');
    }, [location]);

    // Live search
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (searchInput.trim()) {
                setIsSearching(true);
                setShowResults(true);
                try {
                    const response = await axios.get(`${OPHIM_BASE_URL}/v1/api/tim-kiem?keyword=${searchInput.trim()}&page=1`);
                    if (response.data && response.data.status === 'success') {
                        setSearchResults(response.data.data.items.slice(0, 5)); // Show top 5
                        setPathImage(response.data.data.APP_DOMAIN_CDN_IMAGE + '/uploads/movies/');
                    } else {
                        setSearchResults([]);
                    }
                } catch (error) {
                    console.error("Lỗi tìm kiếm:", error);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchInput]);

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div className="nav-container">
                <Link to="/" className="nav-logo">
                    <Film className="logo-icon" />
                    <span>CuonNhi<span className="text-primary">Phim</span></span>
                </Link>

                <div className="nav-menu">
                    <Link to="/" className="nav-link">Trang Chủ</Link>
                    
                    <div className="nav-item-dropdown">
                        <span className="nav-link">
                            Thể Loại <ChevronDown size={16} />
                        </span>
                        <div className="dropdown-menu">
                            {CATEGORIES.map(cat => (
                                <Link 
                                    key={cat.slug} 
                                    to={`/?category=${cat.slug}`} 
                                    className="dropdown-item"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="nav-item-dropdown">
                        <span className="nav-link">
                            Quốc Gia <ChevronDown size={16} />
                        </span>
                        <div className="dropdown-menu">
                            {COUNTRIES.map(cat => (
                                <Link 
                                    key={cat.slug} 
                                    to={`/?country=${cat.slug}`} 
                                    className="dropdown-item"
                                >
                                    {cat.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <Link to="/?list=phim-bo" className="nav-link">Phim Bộ</Link>
                    <Link to="/?list=phim-le" className="nav-link">Phim Lẻ</Link>
                    <Link to="/?list=tv-shows" className="nav-link">TV Shows</Link>
                </div>

                <div className="nav-search" ref={searchRef}>
                    <div className="search-box">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm phim..." 
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onFocus={() => { if(searchInput) setShowResults(true) }}
                        />
                        {isSearching && <div className="search-spinner"></div>}
                    </div>

                    {/* Search Dropdown */}
                    {showResults && (
                        <div className="search-dropdown">
                            {searchResults.length > 0 ? (
                                <div className="search-results-list">
                                    {searchResults.map(movie => (
                                        <Link to={`/phim/${movie.slug}`} key={movie._id} className="search-result-item">
                                            <img 
                                                src={movie.thumb_url?.startsWith('http') ? movie.thumb_url : `${pathImage}${movie.thumb_url}`} 
                                                alt={movie.name} 
                                                onError={(e) => { e.target.onerror = null; e.target.src = movie.poster_url?.startsWith('http') ? movie.poster_url : `${pathImage}${movie.poster_url}`; }}
                                            />
                                            <div className="search-result-info">
                                                <h4>{movie.name}</h4>
                                                <p>{movie.origin_name}</p>
                                                <span className="year">{movie.year}</span>
                                            </div>
                                        </Link>
                                    ))}
                                    <div className="search-all-btn" onClick={() => navigate(`/?search=${searchInput}`)}>
                                        Xem tất cả kết quả
                                    </div>
                                </div>
                            ) : searchInput.trim() && !isSearching ? (
                                <div className="no-search-results">
                                    Không tìm thấy phim "{searchInput}"
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="nav-auth">
                    {user ? (
                        <div 
                            className="nav-user-dropdown-container" 
                            onMouseEnter={() => setIsUserDropdownOpen(true)}
                            onMouseLeave={() => setIsUserDropdownOpen(false)}
                        >
                            <span className="nav-user-email">
                                <User size={18} /> {user.email.split('@')[0]} <ChevronDown size={14} />
                            </span>
                            
                            {isUserDropdownOpen && (
                                <div className="user-dropdown-menu">
                                    <Link to="/thu-vien?tab=watching" className="user-dropdown-item">
                                        <Clock size={16} /> Phim Đang Xem Giở
                                    </Link>
                                    <Link to="/thu-vien?tab=favorites" className="user-dropdown-item">
                                        <Heart size={16} /> Phim Đã Thích
                                    </Link>
                                    <div className="dropdown-divider"></div>
                                    <button onClick={logout} className="user-dropdown-item text-danger">
                                        <LogOut size={16} /> Đăng Xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button className="nav-login-btn" onClick={() => setIsAuthModalOpen(true)}>
                            Đăng Nhập
                        </button>
                    )}
                </div>
            </div>
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        </nav>
    );
};

export default Navbar;
