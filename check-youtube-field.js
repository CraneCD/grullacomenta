const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkYouTubeField() {
  try {
    console.log('Checking youtubeUrl field in database...');
    
    // Get all reviews and check if youtubeUrl field exists
    const reviews = await prisma.review.findMany({
      select: {
        id: true,
        title: true,
        youtubeUrl: true,
        createdAt: true
      }
    });

    console.log(`Found ${reviews.length} reviews in database`);
    
    // Check if any reviews have youtubeUrl data
    const reviewsWithYouTube = reviews.filter(review => review.youtubeUrl);
    console.log(`Reviews with YouTube URL: ${reviewsWithYouTube.length}`);
    
    if (reviewsWithYouTube.length > 0) {
      console.log('Reviews with YouTube URLs:');
      reviewsWithYouTube.forEach(review => {
        console.log(`- ${review.title}: ${review.youtubeUrl}`);
      });
    }
    
    // Check the specific review from the API response
    const specificReview = reviews.find(review => review.id === 'cmb174837431827915amr6nswam');
    if (specificReview) {
      console.log('\nSpecific review from API:');
      console.log(`Title: ${specificReview.title}`);
      console.log(`YouTube URL: ${specificReview.youtubeUrl || 'NULL'}`);
    } else {
      console.log('\nSpecific review not found in database');
    }
    
  } catch (error) {
    console.error('Error checking YouTube field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkYouTubeField(); 