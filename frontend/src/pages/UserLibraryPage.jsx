import React, { useEffect, useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../config';
import { AuthContext } from '../context/AuthContext';
import { Heart, Clock, Play, Trash2 } from 'lucide-react';
import './UserLibraryPage.css';

const UserLibraryPage = () => {
    const { token, user } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [activeTab, setActiveTab] = useState('watching'); // 'watching' or 'favorites'
    const [watchingList, setWatchingList] = useState([]);
    const [favoritesList, setFavoritesList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            navigate('/');
            return;
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const [progressRes, favRes] = await Promise.all([
                    axios.get(`${BACKEND_URL}/progress`, { headers: { Authorization: `Bearer ${token}` } }),
                    axios.get(`${BACKEND_URL}/favorites`, { headers: { Authorization: `Bearer ${token}` } })
                ]);
                setWatchingList(progressRes.data);
                setFavoritesList(favRes.data);
            } catch (error) {
                console.error("Error fetching library data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, navigate]);

    const formatTime = (seconds) => {
        if (!seconds) return '00:00';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="library-loading">
                <div className="spinner"></div>
                <h2>Đang tải thư viện của bạn...</h2>
            </div>
        );
    }

    return (
        <div className="library-page">
            <div className="library-header">
                <h1>Thư Viện Của {user?.email?.split('@')[0]}</h1>
                <div className="library-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'watching' ? 'active' : ''}`}
                        onClick={() => setActiveTab('watching')}
                    >
                        <Clock size={18} /> Phim Đang Xem
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`}
                        onClick={() => setActiveTab('favorites')}
                    >
                        <Heart size={18} /> Phim Đã Thích
                    </button>
                </div>
            </div>

            <div className="library-content">
                {activeTab === 'watching' && (
                    <div className="library-grid">
                        {watchingList.length === 0 ? (
                            <p className="empty-message">Bạn chưa xem dở bộ phim nào.</p>
                        ) : (
                            watchingList.map(item => {
                                const progressPercent = item.duration > 0 ? (item.currentTime / item.duration) * 100 : 0;
                                return (
                                    <Link to={`/xem-phim/${item.movieSlug}/${encodeURIComponent(item.episodeName)}`} key={item.id} className="library-card">
                                        <div className="card-img-wrapper">
                                            <img src={item.posterUrl || '/placeholder.png'} alt={item.movieName} />
                                            <div className="card-overlay">
                                                <Play size={40} fill="currentColor" />
                                            </div>
                                            <div className="progress-bar-container">
                                                <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="card-info">
                                            <h3>{item.movieName}</h3>
                                            <p className="episode-badge">Tập {item.episodeName}</p>
                                            <p className="time-info">Đang xem: {formatTime(item.currentTime)} / {formatTime(item.duration)}</p>
                                        </div>
                                    </Link>
                                );
                            })
                        )}
                    </div>
                )}

                {activeTab === 'favorites' && (
                    <div className="library-grid">
                        {favoritesList.length === 0 ? (
                            <p className="empty-message">Bạn chưa thêm phim nào vào danh sách yêu thích.</p>
                        ) : (
                            favoritesList.map(item => (
                                <Link to={`/phim/${item.movieSlug}`} key={item.id} className="library-card">
                                    <div className="card-img-wrapper">
                                        <img src={item.posterUrl || '/placeholder.png'} alt={item.movieName} />
                                        <div className="card-overlay">
                                            <Play size={40} fill="currentColor" />
                                        </div>
                                        <div className="favorite-badge">
                                            <Heart size={16} fill="currentColor" />
                                        </div>
                                    </div>
                                    <div className="card-info">
                                        <h3>{item.movieName}</h3>
                                        <p className="time-info" style={{ marginTop: '5px' }}>Đã thêm: {new Date(item.createdAt).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserLibraryPage;
