import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import './MovieSlider.css';

const MovieSlider = ({ title, movies, pathImage, isVertical = false, titleColor = '#f8fafc' }) => {
    const sliderRef = useRef(null);

    const scroll = (direction) => {
        if (sliderRef.current) {
            // If vertical, card width is ~180px. If horizontal, card width is ~280px.
            const cardWidth = isVertical ? 180 : 280;
            const gap = 15;
            const scrollAmount = direction === 'left' ? -(cardWidth + gap) * 3 : (cardWidth + gap) * 3;
            sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    if (!movies || movies.length === 0) return null;

    return (
        <div className={`movie-slider-section ${isVertical ? 'slider-vertical' : 'slider-horizontal'}`}>
            <h2 className="slider-title" style={{ color: titleColor }}>{title}</h2>
            
            <div className="slider-container">
                <button className="slider-btn left" onClick={() => scroll('left')}>
                    <ChevronLeft size={40} />
                </button>

                <div className="slider-track" ref={sliderRef}>
                    {movies.map(movie => (
                        <Link to={`/phim/${movie.slug}`} className="slider-card" key={movie._id || movie.slug}>
                            <div className="slider-image-wrapper">
                                <img 
                                    src={
                                        isVertical 
                                        ? (movie.poster_url?.startsWith('http') ? movie.poster_url : `${pathImage}${movie.poster_url}`)
                                        : (movie.thumb_url?.startsWith('http') ? movie.thumb_url : `${pathImage}${movie.thumb_url}`)
                                    } 
                                    alt={movie.name} 
                                    className="slider-image"
                                    onError={(e) => {
                                        // Fallback to whichever is available
                                        e.target.onerror = null; 
                                        e.target.src = isVertical
                                            ? (movie.thumb_url?.startsWith('http') ? movie.thumb_url : `${pathImage}${movie.thumb_url}`)
                                            : (movie.poster_url?.startsWith('http') ? movie.poster_url : `${pathImage}${movie.poster_url}`);
                                    }}
                                />
                                <div className="slider-overlay">
                                    <button className="slider-play-btn">
                                        <PlayCircle size={48} strokeWidth={1.5} />
                                    </button>
                                </div>
                                <div className="slider-badge">
                                    {movie.episode_current || movie.year}
                                </div>
                            </div>
                            <div className="slider-info">
                                <h3>{movie.name}</h3>
                            </div>
                        </Link>
                    ))}
                </div>

                <button className="slider-btn right" onClick={() => scroll('right')}>
                    <ChevronRight size={40} />
                </button>
            </div>
        </div>
    );
};

export default MovieSlider;
