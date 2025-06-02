import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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

  // Simple logic: Check if any admin users exist in database
  const adminCount = await prisma.adminUser.count();

  if (adminCount === 0) {
    // No admins exist, create default admin and seed time slots
    console.log("No admin users found, creating default admin...");
    
    // Create default admin user
    const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'development123';
    
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

    console.log(`✅ Created admin user: ${defaultAdminUsername}`);

    // Create sample available slots for the next 7 days
    console.log('📅 Creating sample available slots...');
    
    const today = new Date();
    const slots: SlotData[] = [];

    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0] as string;

      // Morning slots
      slots.push({
        date: dateString,
        start_time: '09:00',
        end_time: '12:00',
        is_booked: false
      });

      // Afternoon slots
      slots.push({
        date: dateString,
        start_time: '14:00',
        end_time: '17:00',
        is_booked: false
      });
    }

    // Create slots
    let slotsCreated = 0;
    for (const slotData of slots) {
      await prisma.availableSlot.create({
        data: slotData
      });
      slotsCreated++;
      console.log(`✅ Created slot: ${slotData.date} ${slotData.start_time}-${slotData.end_time}`);
    }
    
    console.log(`📅 Created ${slotsCreated} time slots`);
  } else {
    // Admins exist, skip seeding
    console.log(`Found ${adminCount} admin users, skipping seeding`);
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