import React from 'react';
import { Link } from 'react-router-dom';
import './SidebarRanking.css';

const SidebarRanking = ({ title, movies, pathImage, titleColor = '#facc15' }) => {
    if (!movies || movies.length === 0) return null;

    return (
        <div className="sidebar-ranking">
            <div className="sidebar-header">
                <h2 className="sidebar-heading" style={{ borderLeftColor: titleColor }}>
                    {title}
                </h2>
            </div>
            
            <div className="ranking-list">
                {movies.slice(0, 10).map((movie, index) => (
                    <Link to={`/phim/${movie.slug}`} className="ranking-item" key={movie._id || movie.slug}>
                        <div className={`rank-number rank-${index + 1}`}>{index + 1}</div>
                        <div className="ranking-image-wrapper">
                            <img 
                                src={movie.thumb_url?.startsWith('http') ? movie.thumb_url : `${pathImage}${movie.thumb_url}`} 
                                alt={movie.name} 
                                className="ranking-img"
                                onError={(e) => {
                                    e.target.onerror = null; 
                                    e.target.src = movie.poster_url?.startsWith('http') ? movie.poster_url : `${pathImage}${movie.poster_url}`;
                                }}
                            />
                        </div>
                        <div className="ranking-info">
                            <h3 className="ranking-title">{movie.name}</h3>
                            <p className="ranking-meta">{movie.episode_current || movie.year}</p>
                            <p className="ranking-views">{Math.floor(Math.random() * 100000 + 10000).toLocaleString('vi-VN')} lượt xem</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default SidebarRanking;
