import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { OPHIM_BASE_URL } from '../config';
import { ChevronLeft, Play, Calendar, Clock, Film, Video } from 'lucide-react';
import './DetailPage.css';

const DetailPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [movieData, setMovieData] = useState(null);
    const [loading, setLoading] = useState(true);

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

        fetchMovieDetail();
    }, [slug]);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <h2>Đang tải thông tin phim...</h2>
            </div>
        );
    }

    if (!movieData || !movieData.movie) {
        return (
            <div className="error-container">
                <h2>Không tìm thấy phim này!</h2>
                <Link to="/" className="back-btn"><ChevronLeft /> Về trang chủ</Link>
            </div>
        );
    }

    const { movie, episodes } = movieData;
    const isTrailer = movie.episode_current === 'Trailer' || movie.status === 'trailer';
    const firstEpisodeData = episodes?.[0]?.server_data?.[0];
    const firstEpisodeName = firstEpisodeData?.name;
    const hasVideoLink = firstEpisodeData && (firstEpisodeData.link_m3u8 || firstEpisodeData.link_embed);

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
