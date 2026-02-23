
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const employees = await prisma.employee.findMany({
        include: {
            user: true,
            business: true
        }
    });

    console.log('Total Employees:', employees.length);
    employees.forEach(emp => {
        console.log(`
      ID: ${emp.id}
      Name: ${emp.user?.firstName} ${emp.user?.lastName} (User ID: ${emp.userId})
      Email: ${emp.user?.email}
      Business: ${emp.business?.name}
    `);
    });
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
