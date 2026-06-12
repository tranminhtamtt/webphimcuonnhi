const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey123';

// Middleware for authentication
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Chưa đăng nhập' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token không hợp lệ' });
    }
};

// Update or create watch progress
router.post('/', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const { movieSlug, movieName, episodeSlug, episodeName, currentTime, duration, posterUrl } = req.body;

        // Use findFirst then update to avoid unique constraint issues if duplicates exist
        let progress = await prisma.watchProgress.findFirst({
            where: { userId, movieSlug },
            orderBy: { updatedAt: 'desc' }
        });

        if (progress) {
            progress = await prisma.watchProgress.update({
                where: { id: progress.id },
                data: {
                    episodeSlug,
                    episodeName,
                    currentTime,
                    duration,
                    posterUrl,
                    updatedAt: new Date()
                }
            });
        } else {
            progress = await prisma.watchProgress.create({
                data: {
                    userId,
                    movieSlug,
                    movieName,
                    episodeSlug,
                    episodeName,
                    currentTime,
                    duration,
                    posterUrl
                }
            });
        }

        res.json(progress);
    } catch (error) {
        console.error('Save progress error:', error);
        res.status(500).json({ error: 'Lỗi khi lưu tiến trình' });
    }
});

// Get all watch progress for the user
router.get('/', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const progress = await prisma.watchProgress.findMany({
            where: { userId },
            orderBy: { updatedAt: 'desc' }
        });
        
        const uniqueProgress = [];
        const seenSlugs = new Set();
        for (const p of progress) {
            if (!seenSlugs.has(p.movieSlug)) {
                seenSlugs.add(p.movieSlug);
                uniqueProgress.push(p);
            }
        }
        res.json(uniqueProgress);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy tiến trình' });
    }
});

// Get specific watch progress for a movie
router.get('/:movieSlug', authenticate, async (req, res) => {
    try {
        const { userId } = req.user;
        const { movieSlug } = req.params;
        
        const progress = await prisma.watchProgress.findFirst({
            where: { userId, movieSlug },
            orderBy: { updatedAt: 'desc' }
        });
        
        res.json(progress);
    } catch (error) {
        res.status(500).json({ error: 'Lỗi khi lấy tiến trình' });
    }
});

module.exports = router;
