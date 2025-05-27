"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    const existingAdmin = await prisma.adminUser.findUnique({
        where: { username: defaultAdminUsername }
    });
    if (!existingAdmin) {
        const saltRounds = 12;
        const password_hash = await bcryptjs_1.default.hash(defaultAdminPassword, saltRounds);
        const admin = await prisma.adminUser.create({
            data: {
                username: defaultAdminUsername,
                password_hash
            }
        });
        console.log(`✅ Created admin user: ${admin.username}`);
    }
    else {
        console.log(`ℹ️  Admin user already exists: ${existingAdmin.username}`);
    }
    const today = new Date();
    const slots = [];
    for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        const dateString = date.toISOString().split('T')[0];
        slots.push({
            date: dateString,
            start_time: '09:00',
            end_time: '12:00',
            is_booked: false
        });
        slots.push({
            date: dateString,
            start_time: '14:00',
            end_time: '17:00',
            is_booked: false
        });
    }
    for (const slotData of slots) {
        const existingSlot = await prisma.availableSlot.findFirst({
            where: {
                date: slotData.date,
                start_time: slotData.start_time,
                end_time: slotData.end_time
            }
        });
        if (!existingSlot) {
            await prisma.availableSlot.create({
                data: slotData
            });
            console.log(`✅ Created slot: ${slotData.date} ${slotData.start_time}-${slotData.end_time}`);
        }
    }
    console.log('🎉 Database seeding completed!');
}
main()
    .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map