import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Play } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { BACKEND_URL } from '../config';
import './ContinueWatching.css';

const ContinueWatching = () => {
    const { token, user } = useContext(AuthContext);
    const [progressList, setProgressList] = useState([]);

    useEffect(() => {
        if (!token) {
            setProgressList([]);
            return;
        }

        const fetchProgress = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/progress`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProgressList(response.data);
            } catch (error) {
                console.error("Error fetching watch progress:", error);
            }
        };

        fetchProgress();
    }, [token]);

    if (!user || progressList.length === 0) return null;

    const formatTime = (seconds) => {
        if (!seconds) return '00:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="continue-watching-section">
            <h2 className="section-title" style={{ color: '#a855f7' }}>Phim Đang Xem</h2>
            <div className="cw-grid">
                {progressList.map(item => {
                    const progressPercent = item.duration > 0 ? (item.currentTime / item.duration) * 100 : 0;
                    
                    return (
                        <Link 
                            to={`/xem-phim/${item.movieSlug}/${encodeURIComponent(item.episodeName)}`} 
                            className="cw-card" 
                            key={item.id}
                        >
                            <div className="cw-img-wrapper">
                                <img src={item.posterUrl} alt={item.movieName} />
                                <div className="cw-overlay">
                                    <Play size={32} className="cw-play-icon" />
                                </div>
                                <div className="cw-progress-bar">
                                    <div className="cw-progress-fill" style={{ width: `${progressPercent}%` }}></div>
                                </div>
                            </div>
                            <div className="cw-info">
                                <h3>{item.movieName}</h3>
                                <div className="cw-meta">
                                    <span className="cw-ep">Tập {item.episodeName}</span>
                                    <span className="cw-time">{formatTime(item.currentTime)}</span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};

export default ContinueWatching;
