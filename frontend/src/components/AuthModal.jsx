import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { X } from 'lucide-react';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    const { login, register } = useContext(AuthContext);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password);
            }
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-modal-overlay">
            <div className="auth-modal">
                <button className="auth-close-btn" onClick={onClose}>
                    <X size={24} />
                </button>
                <h2>{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</h2>
                
                {error && <div className="auth-error">{error}</div>}
                
                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label>Email</label>
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Nhập email của bạn"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Mật khẩu</label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Nhập mật khẩu"
                            required
                        />
                    </div>
                    
                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')}
                    </button>
                </form>

                <div className="auth-toggle">
                    {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
                    <button type="button" onClick={() => setIsLogin(!isLogin)}>
                        {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
