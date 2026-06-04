import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSearchParams } from 'react-router-dom';
import './HomePage.css';
import { OPHIM_BASE_URL } from '../config';
import HeroBanner from '../components/HeroBanner';
import MovieSlider from '../components/MovieSlider';

const HomePage = () => {
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search');
    const categoryQuery = searchParams.get('category');
    const countryQuery = searchParams.get('country');
    const listQuery = searchParams.get('list');

    const [loading, setLoading] = useState(true);
    
    // States for different sections
    const [newMovies, setNewMovies] = useState({ items: [], pathImage: '' });
    const [koreanMovies, setKoreanMovies] = useState({ items: [], pathImage: '' });
    const [chineseMovies, setChineseMovies] = useState({ items: [], pathImage: '' });
    const [usMovies, setUsMovies] = useState({ items: [], pathImage: '' });
    const [actionMovies, setActionMovies] = useState({ items: [], pathImage: '' });
    const [romanticMovies, setRomanticMovies] = useState({ items: [], pathImage: '' });

    // States for generic search/category views
    const [genericMovies, setGenericMovies] = useState({ items: [], pathImage: '', title: '' });

    const filterMovies = (items) => items ? items.filter(m => {
        const ep = m.episode_current?.toLowerCase() || '';
        const status = m.status?.toLowerCase() || '';
        // Loại bỏ các phim là trailer, sắp chiếu, chưa có tập nào
        if (ep.includes('trailer') || status === 'trailer') return false;
        if (ep.includes('đang cập nhật') || ep === 'tập 0' || ep === '0') return false;
        return true;
    }) : [];

    const fetchSection = async (url, isV1Api = true) => {
        try {
            const response = await axios.get(`${OPHIM_BASE_URL}${url}`);
            if (isV1Api && response.data?.status === 'success') {
                return {
                    items: filterMovies(response.data.data.items),
                    pathImage: response.data.data.APP_DOMAIN_CDN_IMAGE + '/uploads/movies/'
                };
            } else if (!isV1Api && response.data?.status) {
                return {
                    items: filterMovies(response.data.items),
                    pathImage: response.data.pathImage
                };
            }
            return { items: [], pathImage: '' };
        } catch (error) {
            console.error(`Error fetching ${url}:`, error);
            return { items: [], pathImage: '' };
        }
    };

    useEffect(() => {
        const fetchAllData = async () => {
            setLoading(true);
            
            if (searchQuery) {
                const res = await fetchSection(`/v1/api/tim-kiem?keyword=${searchQuery}&page=1`);
                setGenericMovies({ ...res, title: `Kết quả tìm kiếm: "${searchQuery}"` });
            } 
            else if (categoryQuery) {
                const res = await fetchSection(`/v1/api/the-loai/${categoryQuery}?page=1`);
                const catNames = {
                    'hanh-dong': 'Hành Động', 'tinh-cam': 'Tình Cảm', 'hai-huoc': 'Hài Hước',
                    'kinh-di': 'Kinh Dị', 'hoat-hinh': 'Hoạt Hình', 'vien-tuong': 'Viễn Tưởng',
                    'co-trang': 'Cổ Trang', 'tam-ly': 'Tâm Lý', 'the-thao': 'Thể Thao', 'hinh-su': 'Hình Sự'
                };
                setGenericMovies({ ...res, title: `Phim Thể Loại: ${catNames[categoryQuery] || categoryQuery}` });
            } 
            else if (countryQuery) {
                const res = await fetchSection(`/v1/api/quoc-gia/${countryQuery}?page=1`);
                const countryNames = {
                    'han-quoc': 'Hàn Quốc', 'trung-quoc': 'Trung Quốc', 'au-my': 'Âu Mỹ',
                    'nhat-ban': 'Nhật Bản', 'thai-lan': 'Thái Lan'
                };
                setGenericMovies({ ...res, title: `Phim Quốc Gia: ${countryNames[countryQuery] || countryQuery}` });
            }
            else if (listQuery) {
                const res = await fetchSection(`/v1/api/danh-sach/${listQuery}?page=1`);
                const listNames = {
                    'phim-bo': 'Phim Bộ', 'phim-le': 'Phim Lẻ', 'tv-shows': 'TV Shows', 'hoat-hinh': 'Hoạt Hình'
                };
                setGenericMovies({ ...res, title: `Danh Sách: ${listNames[listQuery] || listQuery}` });
            }
            else {
                // Fetch Home Page Sections Concurrently
                const [newData, krData, cnData, usData, actionData, romanticData] = await Promise.all([
                    fetchSection('/danh-sach/phim-moi-cap-nhat?page=1', false),
                    fetchSection('/v1/api/quoc-gia/han-quoc?page=1'),
                    fetchSection('/v1/api/quoc-gia/trung-quoc?page=1'),
                    fetchSection('/v1/api/quoc-gia/au-my?page=1'),
                    fetchSection('/v1/api/the-loai/hanh-dong?page=1'),
                    fetchSection('/v1/api/the-loai/tinh-cam?page=1')
                ]);
                
                setNewMovies(newData);
                setKoreanMovies(krData);
                setChineseMovies(cnData);
                setUsMovies(usData);
                setActionMovies(actionData);
                setRomanticMovies(romanticData);
            }

            setLoading(false);
        };

        fetchAllData();
    }, [searchQuery, categoryQuery, countryQuery, listQuery]);

    if (loading) {
        return (
            <div className="homepage-loading">
                <div className="spinner"></div>
                <h2>Đang tải phim...</h2>
            </div>
        );
    }

    // Render generic view (Search / Category)
    if (searchQuery || categoryQuery || countryQuery || listQuery) {
        return (
            <div className="homepage generic-view">
                <h2 className="section-title" style={{ marginTop: '100px', marginLeft: '40px' }}>
                    {genericMovies.title}
                </h2>
                {genericMovies.items.length === 0 ? (
                    <div style={{ margin: '40px', color: '#94a3b8' }}>Không tìm thấy phim nào.</div>
                ) : (
                    <div className="movies-grid" style={{ padding: '20px 40px' }}>
                        {genericMovies.items.map(movie => (
                            <a href={`/phim/${movie.slug}`} className="movie-card" key={movie._id}>
                                <div className="card-img-wrapper">
                                    <img 
                                        src={movie.thumb_url?.startsWith('http') ? movie.thumb_url : `${genericMovies.pathImage}${movie.thumb_url}`} 
                                        alt={movie.name} 
                                        className="movie-image"
                                    />
                                </div>
                                <div className="movie-info">
                                    <h3 className="movie-name">{movie.name}</h3>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Render Home Page
    return (
        <div className="homepage">
            {newMovies.items.length > 0 && (
                <HeroBanner 
                    movies={newMovies.items.slice(0, 10)} 
                    pathImage={newMovies.pathImage} 
                />
            )}
            
            <div className="sliders-container">
                <MovieSlider title="Phim Mới Nổi Bật" movies={newMovies.items} pathImage={newMovies.pathImage} isVertical={true} titleColor="#e2e8f0" />
                <MovieSlider title="Tuyệt Đỉnh Phim Hàn" movies={koreanMovies.items} pathImage={koreanMovies.pathImage} titleColor="#f43f5e" />
                <MovieSlider title="Cổ Trang Hoa Ngữ" movies={chineseMovies.items} pathImage={chineseMovies.pathImage} titleColor="#eab308" />
                <MovieSlider title="Bom Tấn Hollywood" movies={usMovies.items} pathImage={usMovies.pathImage} titleColor="#38bdf8" />
                <MovieSlider title="Hành Động Nghẹt Thở" movies={actionMovies.items} pathImage={actionMovies.pathImage} titleColor="#22c55e" />
                <MovieSlider title="Tình Cảm Lãng Mạn" movies={romanticMovies.items} pathImage={romanticMovies.pathImage} titleColor="#ec4899" />
            </div>
        </div>
    );
};

export default HomePage;
