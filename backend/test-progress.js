const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const userId = 1; // Assuming user 1 exists
        const movieSlug = "er-phong-cap-cuu-phan-6";
        
        let progress = await prisma.watchProgress.findFirst({
            where: { userId, movieSlug },
            orderBy: { updatedAt: 'desc' }
        });
        
        console.log("Found progress:", progress);
        
        if (progress) {
            progress = await prisma.watchProgress.update({
                where: { id: progress.id },
                data: {
                    episodeSlug: "tap-6",
                    episodeName: "Tập 6",
                    currentTime: 120.5,
                    duration: 2500,
                    posterUrl: "test",
                    updatedAt: new Date()
                }
            });
            console.log("Updated progress:", progress);
        } else {
            console.log("No progress found");
        }
    } catch (e) {
        console.error("Prisma error:", e);
    } finally {
        await prisma.$disconnect();
    }
}
test();
