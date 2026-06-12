import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { OPHIM_BASE_URL, BACKEND_URL } from '../config';
import { ChevronLeft, Play, Calendar, Clock, Film, Video, Heart } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import './DetailPage.css';

const DetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [movieData, setMovieData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFavorite, setIsFavorite] = useState(false);
    const { token } = useContext(AuthContext);

    useEffect(() => {
        const fetchMovieDetail = async () => {
            try {
                const response = await axios.get(`${OPHIM_BASE_URL}/phim/${slug}`);
                if (response.data && response.data.status) {
                    setMovieData(response.data);
                }
            } catch (error) {
                console.error("Error fetching detail:", error);
            } finally {
                setLoading(false);
            }
        };

        const checkFavorite = async () => {
            if (!token) return;
            try {
                const response = await axios.get(`${BACKEND_URL}/favorites/check/${slug}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setIsFavorite(response.data.isFavorite);
            } catch (error) {
                console.error("Error checking favorite:", error);
            }
        };

        fetchMovieDetail();
        checkFavorite();
    }, [slug, token]);

    const handleToggleFavorite = async () => {
        if (!token) {
            alert('Vui lòng đăng nhập để thêm vào danh sách yêu thích!');
            return;
        }
        try {
            const response = await axios.post(`${BACKEND_URL}/favorites/toggle`, {
                movieSlug: slug,
                movieName: movieData.movie.name,
                posterUrl: movieData.movie.poster_url || movieData.movie.thumb_url
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsFavorite(response.data.isFavorite);
        } catch (error) {
            console.error("Error toggling favorite:", error);
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <h2>Đang tải thông tin phim...</h2>
            </div>
        );
    }

    const { movie, episodes } = movieData || {};
    const isTrailer = movie?.episode_current === 'Trailer' || movie?.status === 'trailer';
    const firstEpisodeData = episodes?.[0]?.server_data?.[0];
    const firstEpisodeName = firstEpisodeData?.name;
    const hasVideoLink = firstEpisodeData && (firstEpisodeData.link_m3u8 || firstEpisodeData.link_embed);

    if (!movieData || !movie || (!isTrailer && !hasVideoLink && !movie.trailer_url)) {
        return (
            <div className="error-container">
                <h2>Phim này hiện đang bị lỗi hoặc chưa có tập phim nào!</h2>
                <Link to="/" className="back-btn"><ChevronLeft /> Về trang chủ</Link>
            </div>
        );
    }

    return (
        <div className="detail-page">
            <Link to="/" className="back-button">
                <ChevronLeft size={24} />
                Quay lại
            </Link>

            <div className="hero-backdrop" style={{ 
                backgroundImage: `url(${movie.poster_url || movie.thumb_url})` 
            }}>
                <div className="backdrop-gradient"></div>
            </div>

            <div className="detail-content">
                <div className="movie-poster">
                    <img src={movie.thumb_url || movie.poster_url} alt={movie.name} />
                </div>
                
                <div className="movie-info-wrap">
                    <h1 className="movie-title">{movie.name}</h1>
                    <h2 className="movie-original-title">{movie.origin_name}</h2>

                    <div className="movie-meta">
                        <span className="meta-item"><Calendar size={16}/> {movie.year}</span>
                        <span className="meta-item"><Clock size={16}/> {movie.time}</span>
                        <span className="meta-item quality">{movie.quality} - {movie.lang}</span>
                    </div>

                    <div className="movie-cast">
                        {movie.director && movie.director[0] && (
                            <p><strong>Đạo diễn:</strong> {movie.director.join(', ')}</p>
                        )}
                        {movie.actor && movie.actor[0] && (
                            <p><strong>Diễn viên:</strong> {movie.actor.join(', ')}</p>
                        )}
                        {movie.category && (
                            <p><strong>Thể loại:</strong> {movie.category.map(c => c.name).join(', ')}</p>
                        )}
                        {movie.country && (
                            <p><strong>Quốc gia:</strong> {movie.country.map(c => c.name).join(', ')}</p>
                        )}
                    </div>

                    <div className="movie-description" dangerouslySetInnerHTML={{ __html: movie.content }} />

                    <div className="action-buttons">
                        {!isTrailer && hasVideoLink ? (
                            <button 
                                className="action-btn play-btn" 
                                onClick={() => navigate(`/xem-phim/${slug}/${encodeURIComponent(firstEpisodeName)}`)}
                            >
                                <Play fill="currentColor" size={20} />
                                Xem Phim
                            </button>
                        ) : movie.trailer_url ? (
                            <a 
                                href={movie.trailer_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="action-btn trailer-btn"
                            >
                                <Video size={20} />
                                Xem Trailer
                            </a>
                        ) : null}
                        
                        <button 
                            className={`action-btn favorite-btn ${isFavorite ? 'active' : ''}`}
                            onClick={handleToggleFavorite}
                            style={{ 
                                backgroundColor: isFavorite ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
                                borderColor: isFavorite ? '#ef4444' : 'rgba(255, 255, 255, 0.2)'
                            }}
                        >
                            <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
                            {isFavorite ? 'Đã Thích' : 'Yêu Thích'}
                        </button>
                    </div>

                    {!isTrailer && episodes && episodes.length > 0 && episodes[0].server_data && episodes[0].server_data.length > 1 && (
                        <div className="watch-section">
                            <h3 className="section-label">Danh sách tập:</h3>
                            <div className="episodes-list">
                                {episodes[0].server_data.map((ep, index) => (
                                    <button 
                                        key={index} 
                                        className="ep-btn"
                                        onClick={() => navigate(`/xem-phim/${slug}/${encodeURIComponent(ep.name)}`)}
                                    >
                                        <Film size={16} /> {ep.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DetailPage;
