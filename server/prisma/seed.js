import "dotenv/config";
import { prisma } from "../src/db/prisma.js";
import bcrypt from "bcrypt";
async function main() {
    console.log("Start seeding...");
    // Create an Admin User
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.upsert({
        where: { mobile: "9876543210" },
        update: {},
        create: {
            name: "System Admin",
            mobile: "9876543210",
            email: "admin@library.com",
            passwordHash: adminPassword,
            role: "admin",
            status: "active",
        },
    });
    console.log(`Created admin user with id: ${admin.id}`);
    // Create some Student Users
    const studentPassword = await bcrypt.hash("student123", 10);
    const studentsData = [
        { name: "John Doe", mobile: "9000000001", email: "john@example.com" },
        { name: "Jane Smith", mobile: "9000000002", email: "jane@example.com" },
    ];
    for (const data of studentsData) {
        const user = await prisma.user.upsert({
            where: { mobile: data.mobile },
            update: {},
            create: {
                name: data.name,
                mobile: data.mobile,
                email: data.email,
                passwordHash: studentPassword,
                role: "student",
                status: "active",
                student: {
                    create: {
                        fullName: data.name,
                        fatherName: "Mr. " + data.name.split(" ")[1],
                        address: "123 Library St",
                        city: "Knowledge City",
                        state: "Education State",
                        pincode: "123456",
                    },
                },
            },
        });
        console.log(`Created student user with id: ${user.id}`);
    }
    console.log("Seeding finished.");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map