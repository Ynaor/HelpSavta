import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Environment-aware seeding configuration
const ENVIRONMENT = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = ENVIRONMENT === 'production';
const SKIP_PRODUCTION_SEEDING = process.env.SKIP_PRODUCTION_SEEDING === 'true';

console.log(`🌍 Running in ${ENVIRONMENT} environment`);

// Define slot data type
interface SlotData {
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // Production safety check
  if (IS_PRODUCTION && SKIP_PRODUCTION_SEEDING) {
    console.log('🚨 PRODUCTION: Seeding skipped due to SKIP_PRODUCTION_SEEDING=true');
    return;
  }

  if (IS_PRODUCTION) {
    console.log('⚠️  PRODUCTION ENVIRONMENT: Using safe seeding mode');
  }

  // Check if this is an existing database with data
  // Wrap in try-catch to handle cases where tables don't exist yet
  let existingRequestsCount = 0;
  let existingAdminsCount = 0;
  let existingSlotsCount = 0;

  try {
    existingRequestsCount = await prisma.techRequest.count();
  } catch (error) {
    console.log('📊 Table tech_requests does not exist yet, proceeding with initial seeding');
  }

  try {
    existingAdminsCount = await prisma.adminUser.count();
  } catch (error) {
    console.log('📊 Table admin_users does not exist yet, proceeding with initial seeding');
  }

  try {
    existingSlotsCount = await prisma.availableSlot.count();
  } catch (error) {
    console.log('📊 Table available_slots does not exist yet, proceeding with initial seeding');
  }

  if (IS_PRODUCTION && (existingRequestsCount > 0 || existingAdminsCount > 1)) {
    console.log(`🛡️  PRODUCTION: Detected existing data (${existingRequestsCount} requests, ${existingAdminsCount} admins)`);
    console.log('🛡️  PRODUCTION: Skipping seeding to protect existing data');
    return;
  }

  // Create default admin user (PRODUCTION SAFE)
  const defaultAdminUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
  const defaultAdminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'development123';

  if (!process.env.DEFAULT_ADMIN_USERNAME || !process.env.DEFAULT_ADMIN_PASSWORD) {
    console.log('⚠️  Using default admin credentials. Please set DEFAULT_ADMIN_USERNAME and DEFAULT_ADMIN_PASSWORD in .env');
  }

  // SAFE ADMIN CREATION: Use upsert instead of delete/create
  const saltRounds = 12;
  const password_hash = await bcrypt.hash(defaultAdminPassword, saltRounds);

  const admin = await prisma.adminUser.upsert({
    where: { username: defaultAdminUsername },
    update: IS_PRODUCTION ? {} : {
      // Only update in development
      password_hash,
      is_active: true,
      role: 'SYSTEM_ADMIN'
    },
    create: {
      username: defaultAdminUsername,
      password_hash,
      is_active: true,
      role: 'SYSTEM_ADMIN'
    }
  });

  console.log(`✅ ${admin ? 'Ensured' : 'Created'} admin user: ${defaultAdminUsername}`);
  if (IS_PRODUCTION) {
    console.log('🛡️  PRODUCTION: Admin password NOT updated (preserving existing)');
  }

  // SAFE SLOT CREATION: Only in development or when no slots exist
  if (!IS_PRODUCTION || existingSlotsCount === 0) {
    console.log('📅 Creating sample available slots...');
    
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

    // SAFE SLOT CREATION: Check existence before creating
    let slotsCreated = 0;
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
        slotsCreated++;
        console.log(`✅ Created slot: ${slotData.date} ${slotData.start_time}-${slotData.end_time}`);
      } else {
        console.log(`⏭️  Slot exists: ${slotData.date} ${slotData.start_time}-${slotData.end_time}`);
      }
    }
    
    console.log(`📅 Processed ${slotsCreated} time slots`);
  } else {
    console.log(`🛡️  PRODUCTION: Preserving existing ${existingSlotsCount} time slots`);
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