import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create an admin user if it doesn't exist
  let adminUser = await prisma.user.findUnique({
    where: { email: 'admin@example.com' }
  });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@example.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin'
      }
    });
    console.log('Created admin user');
  }

  // Create sample reviews
  const sampleReviews = [
    {
      title: 'Final Fantasy XVI',
      slug: 'final-fantasy-xvi',
      content: 'An epic adventure with stunning visuals and compelling storytelling. The combat system is fluid and engaging, making every battle feel cinematic.',
      category: 'video-games',
      platform: 'PlayStation',
      rating: 9.2,
      coverImage: 'https://example.com/ff16-cover.jpg',
      status: 'published',
      authorId: adminUser.id
    },
    {
      title: 'Attack on Titan',
      slug: 'attack-on-titan',
      content: 'A masterpiece of storytelling that keeps you on the edge of your seat. The animation quality and character development are exceptional.',
      category: 'anime',
      rating: 9.5,
      coverImage: 'https://example.com/aot-cover.jpg',
      status: 'published',
      authorId: adminUser.id
    },
    {
      title: 'One Piece',
      slug: 'one-piece',
      content: 'An incredible journey with Luffy and his crew. The world-building is phenomenal and the character arcs are deeply satisfying.',
      category: 'manga',
      rating: 8.8,
      coverImage: 'https://example.com/onepiece-cover.jpg',
      status: 'draft',
      authorId: adminUser.id
    }
  ];

  for (const reviewData of sampleReviews) {
    const existingReview = await prisma.review.findUnique({
      where: { slug: reviewData.slug }
    });

    if (!existingReview) {
      await prisma.review.create({
        data: reviewData
      });
      console.log(`Created review: ${reviewData.title}`);
    } else {
      console.log(`Review already exists: ${reviewData.title}`);
    }
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 