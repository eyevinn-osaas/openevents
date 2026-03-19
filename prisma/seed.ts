import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create categories
  const categories = [
    { name: 'Conference', slug: 'conference', description: 'Professional conferences and summits' },
    { name: 'Workshop', slug: 'workshop', description: 'Hands-on learning sessions' },
    { name: 'Meetup', slug: 'meetup', description: 'Casual community gatherings' },
    { name: 'Concert', slug: 'concert', description: 'Live music performances' },
    { name: 'Networking', slug: 'networking', description: 'Professional networking events' },
    { name: 'Sports', slug: 'sports', description: 'Sports events and competitions' },
    { name: 'Charity', slug: 'charity', description: 'Fundraising and charity events' },
    { name: 'Festival', slug: 'festival', description: 'Multi-day festivals and celebrations' },
  ]

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    })
  }
  console.log('Categories created')

  // Create a super admin user
  const adminPassword = await bcrypt.hash('Admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@openevents.local' },
    update: {},
    create: {
      email: 'admin@openevents.local',
      passwordHash: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      emailVerified: new Date(),
    },
  })

  await prisma.userRole.upsert({
    where: { userId_role: { userId: admin.id, role: 'SUPER_ADMIN' } },
    update: {},
    create: { userId: admin.id, role: 'SUPER_ADMIN' },
  })
  await prisma.userRole.upsert({
    where: { userId_role: { userId: admin.id, role: 'ATTENDEE' } },
    update: {},
    create: { userId: admin.id, role: 'ATTENDEE' },
  })
  console.log('Super admin created: admin@openevents.local / Admin123!')

  // Create platform settings
  await prisma.platformSetting.upsert({
    where: { key: 'default_currency' },
    update: {},
    create: {
      key: 'default_currency',
      value: 'SEK',
      type: 'string',
    },
  })

  await prisma.platformSetting.upsert({
    where: { key: 'platform_name' },
    update: {},
    create: {
      key: 'platform_name',
      value: 'OpenEvents',
      type: 'string',
    },
  })

  console.log('Platform settings created')
  console.log('='.repeat(50))
  console.log('SEED COMPLETED!')
  console.log('='.repeat(50))
  console.log('')
  console.log('Admin login: admin@openevents.local / Admin123!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
