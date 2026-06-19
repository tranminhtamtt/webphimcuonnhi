import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Heart } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import TiltCard from './TiltCard';
import './MovieSection.css';

const MovieSection = ({ title, movies, pathImage, titleColor = '#38bdf8', viewAllLink }) => {
    const { favoritesList, toggleFavorite } = useContext(AuthContext);

    if (!movies || movies.length === 0) return null;

    return (
        <div className="movie-section">
            <div className="section-header">
                <h2 className="section-heading" style={{ borderLeftColor: titleColor }}>
                    {title}
                </h2>
                {viewAllLink && (
                    <Link to={viewAllLink} className="view-all-btn">
                        Xem tất cả
                    </Link>
                )}
            </div>
            
            <div className="movie-grid">
                {movies.map(movie => {
                    const isFav = favoritesList.some(f => f.movieSlug === movie.slug);
                    return (
                        <TiltCard key={movie._id || movie.slug} className="movie-card-container" style={{ position: 'relative' }}>
                            <Link to={`/phim/${movie.slug}`} className="movie-card">
                                <div className="movie-image-wrapper">
                                    <img 
                                        src={movie.thumb_url?.startsWith('http') ? movie.thumb_url : `${pathImage}${movie.thumb_url}`} 
                                        alt={movie.name} 
                                        className="movie-img"
                                        onError={(e) => {
                                            e.target.onerror = null; 
                                            e.target.src = movie.poster_url?.startsWith('http') ? movie.poster_url : `${pathImage}${movie.poster_url}`;
                                        }}
                                    />
                                    <div className="movie-overlay">
                                        <button className="movie-play-btn">
                                            <PlayCircle size={48} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                    <div className="movie-badge">
                                        {movie.episode_current || movie.year}
                                    </div>
                                </div>
                                <div className="movie-card-info" style={{ transform: "translateZ(30px)" }}>
                                    <h3>{movie.name}</h3>
                                    <p>{movie.origin_name}</p>
                                </div>
                            </Link>
                            <button 
                                className={`quick-fav-btn ${isFav ? 'active' : ''}`}
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    toggleFavorite({
                                        slug: movie.slug,
                                        name: movie.name,
                                        thumb_url: movie.thumb_url
                                    });
                                }}
                                title={isFav ? "Bỏ yêu thích" : "Yêu thích"}
                            >
                                <Heart size={18} fill={isFav ? "currentColor" : "none"} />
                            </button>
                        </TiltCard>
                    );
                })}
            </div>
        </div>
    );
};

export default MovieSection;
