"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seeding...');
    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'development123';
    if (!process.env.DEFAULT_ADMIN_USERNAME || !process.env.DEFAULT_ADMIN_PASSWORD) {
        console.log('⚠️  Using default admin credentials. Please set DEFAULT_ADMIN_USERNAME and DEFAULT_ADMIN_PASSWORD in .env');
    }
    const existingAdmin = await prisma.adminUser.findUnique({
        where: { username: defaultAdminUsername }
    });
    if (existingAdmin) {
        await prisma.adminUser.delete({
            where: { username: defaultAdminUsername }
        });
        console.log(`🗑️  Deleted existing admin user: ${existingAdmin.username}`);
    }
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(defaultAdminPassword, saltRounds);
    const admin = await prisma.adminUser.create({
        data: {
            username: defaultAdminUsername,
            password_hash,
            is_active: true,
            role: 'SYSTEM_ADMIN'
        }
    });
    console.log(`✅ Created admin user: ${admin.username}`);
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