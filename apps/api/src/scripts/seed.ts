/**
 * Seed Script
 *
 * Creates initial admin user and test data.
 * Run with: pnpm --filter @pulso/api seed
 */

import { prisma } from '@pulso/db';
import * as argon2 from 'argon2';
import { initializeUserBalances } from '../services/ledger.service';
import { getOrCreateSession } from '../services/provably-fair.service';
import { INITIAL_GC_GRANT } from '@pulso/shared';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('🌱 Starting seed...');

  // Create admin user
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@pulso.mx';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123456';

  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    const passwordHash = await argon2.hash(adminPassword);

    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
      },
    });

    // Initialize admin balances with larger grant
    await initializeUserBalances(prisma, admin.id, 1000000n, 100000n);

    // Create provably fair session
    await getOrCreateSession(prisma, admin.id);

    console.log(`✅ Created admin user: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
  } else {
    console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
  }

  // Create test user
  const testEmail = 'test@pulso.mx';
  const testPassword = 'test123456';

  let testUser = await prisma.user.findUnique({
    where: { email: testEmail },
  });

  if (!testUser) {
    const passwordHash = await argon2.hash(testPassword);

    testUser = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash,
        role: 'USER',
      },
    });

    // Initialize test user balances with standard grant
    await initializeUserBalances(prisma, testUser.id, INITIAL_GC_GRANT, 500n);

    // Create provably fair session
    await getOrCreateSession(prisma, testUser.id);

    console.log(`✅ Created test user: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
  } else {
    console.log(`ℹ️  Test user already exists: ${testEmail}`);
  }

  console.log('🌱 Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
