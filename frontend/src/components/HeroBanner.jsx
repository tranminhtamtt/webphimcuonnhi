import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Info } from 'lucide-react';
import './HeroBanner.css';

const HeroBanner = ({ movies, pathImage }) => {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!movies || movies.length === 0) return;
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % movies.length);
        }, 5000); // 5 seconds slide
        
        return () => clearInterval(interval);
    }, [movies]);

    if (!movies || movies.length === 0) return null;

    const movie = movies[currentIndex];
    
    // Attempt to use poster as background, fallback to thumb
    const bgImage = movie.poster_url?.startsWith('http') 
        ? movie.poster_url 
        : `${pathImage}${movie.poster_url}`;
        
    const bgFallback = movie.thumb_url?.startsWith('http')
        ? movie.thumb_url
        : `${pathImage}${movie.thumb_url}`;

    return (
        <div className="hero-carousel">
            <div 
                className="hero-carousel-bg" 
                style={{ backgroundImage: `url(${bgImage}), url(${bgFallback})` }}
            >
                <div className="hero-gradient-overlay"></div>
            </div>

            <div className="hero-carousel-content">
                <span className="hero-badge">PHIM MỚI NỔI BẬT</span>
                <h1 className="hero-carousel-title">{movie.name}</h1>
                <p className="hero-carousel-desc">{movie.origin_name} • {movie.year}</p>
                
                <div className="hero-carousel-actions">
                    <Link to={`/xem-phim/${movie.slug}/Full`} className="hero-btn primary">
                        <Play fill="currentColor" size={20} />
                        Xem Ngay
                    </Link>
                    <Link to={`/phim/${movie.slug}`} className="hero-btn secondary">
                        <Info size={20} />
                        Chi Tiết
                    </Link>
                </div>
            </div>

            {/* Dots */}
            <div className="hero-dots">
                {movies.map((_, index) => (
                    <button 
                        key={index}
                        className={`hero-dot ${index === currentIndex ? 'active' : ''}`}
                        onClick={() => setCurrentIndex(index)}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroBanner;
