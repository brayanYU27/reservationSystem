import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNotifications() {
    const email = 'maria.garcia@example.com';

    console.log(`Checking notifications for ${email}...`);

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            notifications: {
                orderBy: { createdAt: 'desc' },
                take: 5
            }
        }
    });

    if (!user) {
        console.error('❌ User not found!');
        return;
    }

    console.log(`User ID: ${user.id}`);
    console.log(`Total Notifications: ${user.notifications.length}`);

    if (user.notifications.length === 0) {
        console.log('⚠️ No notifications found for this user.');
    } else {
        console.log('✅ Last 5 notifications:');
        user.notifications.forEach(n => {
            console.log(`- [${n.createdAt.toISOString()}] ${n.type}: ${n.title} (Read: ${n.isRead})`);
        });
    }
}

checkNotifications()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
