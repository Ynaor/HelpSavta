import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Define slot data type
interface SlotData {
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create default admin user
  const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME;
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD;

  // Check if admin already exists
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { username: defaultAdminUsername }
  });

  if (!existingAdmin) {
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(defaultAdminPassword, saltRounds);

    const admin = await prisma.adminUser.create({
      data: {
        username: defaultAdminUsername,
        password_hash
      }
    });

    console.log(`✅ Created admin user: ${admin.username}`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${existingAdmin.username}`);
  }

  // Create some sample available slots for the next 7 days
  const today = new Date();
  const slots: SlotData[] = [];

  for (let i = 1; i <= 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateString = date.toISOString().split('T')[0];

    // Morning slots
    slots.push({
      date: dateString as string,
      start_time: '09:00',
      end_time: '12:00',
      is_booked: false
    });

    // Afternoon slots
    slots.push({
      date: dateString as string,
      start_time: '14:00',
      end_time: '17:00',
      is_booked: false
    });
  }

  // Create slots if they don't exist
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