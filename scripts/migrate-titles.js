const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateTitles() {
  try {
    console.log('Starting title migration...');
    
    // Get all reviews that don't have multilingual titles
    const reviews = await prisma.review.findMany({
      where: {
        OR: [
          { titleEs: null },
          { titleEn: null }
        ]
      }
    });

    console.log(`Found ${reviews.length} reviews to migrate`);

    for (const review of reviews) {
      const updateData = {};
      
      // If no Spanish title, use the main title as Spanish (assuming it's Spanish)
      if (!review.titleEs && review.title) {
        updateData.titleEs = review.title;
      }
      
      // For now, leave English title empty if not set
      // User can add it manually later
      
      if (Object.keys(updateData).length > 0) {
        await prisma.review.update({
          where: { id: review.id },
          data: updateData
        });
        
        console.log(`Updated review: ${review.title}`);
      }
    }

    console.log('Title migration completed!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateTitles(); 