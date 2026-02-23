
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const appointments = await prisma.appointment.findMany({
        include: {
            business: true,
            client: true,
            employee: true
        },
        orderBy: {
            date: 'desc'
        }
    });

    console.log('Total Appointments:', appointments.length);
    appointments.forEach(apt => {
        console.log(`
      ID: ${apt.id}
      Date: ${apt.date.toISOString()}
      Start: ${apt.startTime}
      Status: ${apt.status}
      Client: ${apt.client?.firstName}
      Business: ${apt.business?.name}
    `);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
