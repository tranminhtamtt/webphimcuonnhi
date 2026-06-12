const express = require('express');
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey123';

// Middleware kiểm tra token
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Không tìm thấy token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.userId;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token không hợp lệ' });
    }
};

// Toggle yêu thích (Thêm nếu chưa có, xóa nếu đã có)
router.post('/toggle', authMiddleware, async (req, res) => {
    try {
        const { movieSlug, movieName, posterUrl } = req.body;
        const userId = req.userId;

        if (!movieSlug || !movieName) {
            return res.status(400).json({ error: 'Thiếu thông tin phim' });
        }

        const existingFav = await prisma.favoriteMovie.findUnique({
            where: {
                userId_movieSlug: { userId, movieSlug }
            }
        });

        if (existingFav) {
            // Đã yêu thích -> Xóa
            await prisma.favoriteMovie.delete({
                where: { id: existingFav.id }
            });
            return res.json({ isFavorite: false, message: 'Đã bỏ yêu thích' });
        } else {
            // Chưa yêu thích -> Thêm
            await prisma.favoriteMovie.create({
                data: {
                    userId,
                    movieSlug,
                    movieName,
                    posterUrl
                }
            });
            return res.json({ isFavorite: true, message: 'Đã thêm vào yêu thích' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Kiểm tra trạng thái yêu thích
router.get('/check/:slug', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const movieSlug = req.params.slug;

        const existingFav = await prisma.favoriteMovie.findUnique({
            where: {
                userId_movieSlug: { userId, movieSlug }
            }
        });

        return res.json({ isFavorite: !!existingFav });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Lấy danh sách phim yêu thích
router.get('/', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        
        const favorites = await prisma.favoriteMovie.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });

        res.json(favorites);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
