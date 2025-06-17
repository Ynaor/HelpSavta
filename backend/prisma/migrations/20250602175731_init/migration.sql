-- CreateTable
CREATE TABLE "tech_requests" (
    "id" SERIAL NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "problem_description" TEXT NOT NULL,
    "urgency_level" TEXT NOT NULL DEFAULT 'medium',
    "scheduled_date" TEXT,
    "scheduled_time" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "assigned_admin_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "booked_slot_id" INTEGER,

    CONSTRAINT "tech_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "available_slots" (
    "id" SERIAL NOT NULL,
    "date" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "is_booked" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "available_slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VOLUNTEER',
    "created_by_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sent_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_username_key" ON "admin_users"("username");

-- AddForeignKey
ALTER TABLE "tech_requests" ADD CONSTRAINT "tech_requests_booked_slot_id_fkey" FOREIGN KEY ("booked_slot_id") REFERENCES "available_slots"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_requests" ADD CONSTRAINT "tech_requests_assigned_admin_id_fkey" FOREIGN KEY ("assigned_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;