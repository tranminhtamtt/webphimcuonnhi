const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    try {
        await prisma.watchProgress.update({
            where: { id: 2 },
            data: {
                posterUrl: 'https://img.ophim.live/uploads/movies/er-phong-cap-cuu-phan-6-poster.jpg',
                episodeName: '6'
            }
        });
        console.log("Fixed!");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
fix();
