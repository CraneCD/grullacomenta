const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Updating review images...');

  // Update existing reviews with new image URLs
  const updates = [
    {
      slug: 'final-fantasy-xvi',
      coverImage: 'https://picsum.photos/400/600?random=1'
    },
    {
      slug: 'attack-on-titan',
      coverImage: 'https://picsum.photos/400/600?random=2'
    },
    {
      slug: 'one-piece',
      coverImage: 'https://picsum.photos/400/600?random=3'
    }
  ];

  for (const update of updates) {
    try {
      const result = await prisma.review.updateMany({
        where: { slug: update.slug },
        data: { coverImage: update.coverImage }
      });
      console.log(`Updated ${result.count} review(s) with slug: ${update.slug}`);
    } catch (error) {
      console.error(`Error updating review ${update.slug}:`, error);
    }
  }

  console.log('Image update completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 