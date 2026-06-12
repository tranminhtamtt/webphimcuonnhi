import React, { useEffect, useState, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { OPHIM_BASE_URL, BACKEND_URL } from '../config';
import { ChevronLeft, Play, MonitorPlay } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import CustomPlayer from '../components/CustomPlayer';
import './WatchPage.css';

const WatchPage = () => {
    const { slug, episode } = useParams();
    const navigate = useNavigate();
    const [movieData, setMovieData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [useIframe, setUseIframe] = useState(false);
    const [initialTime, setInitialTime] = useState(0);

    const { token } = useContext(AuthContext);
    const lastSaveTimeRef = useRef(0);

    const decodedEpisode = decodeURIComponent(episode);

    // 1. useEffect tải dữ liệu phim
    useEffect(() => {
        const fetchMovieDetail = async () => {
            try {
                setLoading(true);
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

    // Lấy tiến trình xem phim nếu đã đăng nhập
    useEffect(() => {
        if (!token) return;
        const fetchProgress = async () => {
            try {
                const response = await axios.get(`${BACKEND_URL}/progress/${slug}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data && response.data.episodeSlug === episode) {
                    setInitialTime(response.data.currentTime);
                }
            } catch (error) {
                console.error("Error fetching watch progress:", error);
            }
        };
        fetchProgress();
    }, [slug, episode, token]);

    // Lưu tiến trình xem phim (debounce 10s)
    const handleTimeUpdate = async (currentTime, duration) => {
        if (!token || !movieData || !movieData.movie) return;
        
        // Chỉ lưu nếu đã qua 10 giây kể từ lần lưu trước
        const now = Date.now();
        if (now - lastSaveTimeRef.current < 10000) return;
        
        lastSaveTimeRef.current = now;

        try {
            await axios.post(`${BACKEND_URL}/progress`, {
                movieSlug: slug,
                movieName: movieData.movie.name,
                episodeSlug: episode,
                episodeName: decodedEpisode,
                currentTime,
                duration,
                posterUrl: movieData.movie.poster_url || movieData.movie.thumb_url
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error("Error saving progress:", error);
        }
    };

    // 2. useEffect xử lý sự kiện bấm phím mũi tên để tua 5 giây
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Bỏ qua nếu người dùng đang nhập liệu (ví dụ: ô tìm kiếm)
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) {
                return;
            }

            // Tìm thẻ video trên màn hình
            const videoElement = document.querySelector('video'); 
            if (!videoElement) return;

            // Xử lý mũi tên phải (Tua tới 5s)
            if (e.key === 'ArrowRight') {
                videoElement.currentTime += 5;
                e.preventDefault(); // Chặn hành vi cuộn trang ngang của trình duyệt
            } 
            // Xử lý mũi tên trái (Tua lùi 5s)
            else if (e.key === 'ArrowLeft') {
                videoElement.currentTime -= 5;
                e.preventDefault();
            }
            // Thêm luôn phím Space để Dừng/Phát video cho xịn
            else if (e.key === ' ') {
                if (videoElement.paused) {
                    videoElement.play();
                } else {
                    videoElement.pause();
                }
                e.preventDefault(); // Chặn hành vi cuộn trang dọc của phím Space
            }
        };

        // Lắng nghe sự kiện
        window.addEventListener('keydown', handleKeyDown);
        
        // Dọn dẹp sự kiện khi chuyển sang trang khác
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <h2>Đang tải tập phim...</h2>
            </div>
        );
    }

    if (!movieData || !movieData.movie) {
        return (
            <div className="error-container">
                <h2>Không tìm thấy phân cảnh này!</h2>
                <Link to="/" className="back-btn"><ChevronLeft /> Về trang chủ</Link>
            </div>
        );
    }

    const { movie, episodes } = movieData;
    let currentEpisodeData = null;

    if (episodes && episodes.length > 0 && episodes[0].server_data) {
        currentEpisodeData = episodes[0].server_data.find(ep => ep.name === decodedEpisode) 
            || episodes[0].server_data[0]; // fallback to first ep
    }

    return (
        <div className="watch-page">
            <div className="watch-header-bar">
                <Link to={`/phim/${slug}`} className="back-to-detail">
                    <ChevronLeft size={20} /> Xem thông tin phim
                </Link>
                <div className="watch-title-area">
                    <h1 className="watch-movie-title">{movie.name}</h1>
                    <span className="watch-episode-badge">Tập {currentEpisodeData?.name}</span>
                </div>
            </div>

            {currentEpisodeData ? (
                <div className="video-player-section">
                    <div className="video-wrapper">
                        {movie.episode_current === 'Trailer' && movie.trailer_url ? (
                            <iframe 
                                src={movie.trailer_url.replace('watch?v=', 'embed/')} 
                                frameBorder="0" 
                                allowFullScreen
                                title="Trailer"
                            ></iframe>
                        ) : (!currentEpisodeData.link_embed && !currentEpisodeData.link_m3u8) ? (
                            <div style={{ color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', flexDirection: 'column', gap: '10px' }}>
                                <h3 style={{ margin: 0 }}>Tập phim này đang bị lỗi</h3>
                                <p style={{ margin: 0, color: '#94a3b8' }}>Link video chưa được cập nhật từ máy chủ. Vui lòng thử lại sau.</p>
                            </div>
                        ) : useIframe || !currentEpisodeData.link_m3u8 ? (
                            <iframe 
                                src={currentEpisodeData.link_embed} 
                                frameBorder="0" 
                                allowFullScreen
                                title="Phim"
                            ></iframe>
                        ) : (
                            <CustomPlayer 
                                key={currentEpisodeData.link_m3u8}
                                src={currentEpisodeData.link_m3u8} 
                                poster={movie.poster_url || movie.thumb_url} 
                                initialTime={initialTime}
                                onTimeUpdate={handleTimeUpdate}
                            />
                        )}
                    </div>
                </div>
            ) : (
                <div className="no-video">Không tìm thấy video cho tập này.</div>
            )}

            <div className="watch-content-container">
                <div className="watch-episodes-section">
                    <h3><MonitorPlay size={20} /> Chọn Tập Khác</h3>
                    {episodes && episodes.length > 0 && episodes[0].server_data && (
                        <div className="ep-grid">
                            {episodes[0].server_data.map((ep, index) => (
                                <button 
                                    key={index} 
                                    className={`ep-btn ${currentEpisodeData?.name === ep.name ? 'active' : ''}`}
                                    onClick={() => {
                                        setUseIframe(false);
                                        navigate(`/xem-phim/${slug}/${encodeURIComponent(ep.name)}`);
                                    }}
                                >
                                    {currentEpisodeData?.name === ep.name ? <Play size={16} /> : null}
                                    {ep.name}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {movie.episode_current !== 'Trailer' && currentEpisodeData?.link_m3u8 && currentEpisodeData?.link_embed && (
                        <div className="server-switch-container" style={{ marginTop: '20px' }}>
                            <h4 style={{ color: '#94a3b8', marginBottom: '10px' }}>Đổi nguồn phát (Nếu bị lỗi không xem được):</h4>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    className={`ep-btn ${!useIframe ? 'active' : ''}`}
                                    onClick={() => setUseIframe(false)}
                                >
                                    Server VIP (M3U8)
                                </button>
                                <button 
                                    className={`ep-btn ${useIframe ? 'active' : ''}`}
                                    onClick={() => setUseIframe(true)}
                                >
                                    Server Dự Phòng (Embed)
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="watch-movie-info">
                    <h2>Nội dung phim</h2>
                    <div className="watch-description" dangerouslySetInnerHTML={{ __html: movie.content }} />
                </div>
            </div>
        </div>
    );
};

export default WatchPage;