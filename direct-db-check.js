const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function directDatabaseCheck() {
  try {
    console.log('=== DIRECT DATABASE CHECK ===\n');
    
    // 1. Check table structure
    console.log('1. Checking table structure...');
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'Review' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('Columns in Review table:');
    columns.forEach((col, index) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });
    
    const hasYouTubeUrl = columns.some(col => col.column_name === 'youtubeUrl');
    console.log(`\nHas youtubeUrl column: ${hasYouTubeUrl}\n`);
    
    // 2. Check actual data
    console.log('2. Checking actual data in Review table...');
    const reviews = await prisma.$queryRaw`SELECT * FROM "Review" LIMIT 5;`;
    
    console.log(`Found ${reviews.length} reviews`);
    
    if (reviews.length > 0) {
      const firstReview = reviews[0];
      console.log('\nFirst review data:');
      console.log('ID:', firstReview.id);
      console.log('Title:', firstReview.title);
      console.log('Has youtubeUrl property:', firstReview.hasOwnProperty('youtubeUrl'));
      
      if (firstReview.hasOwnProperty('youtubeUrl')) {
        console.log('YouTube URL value:', firstReview.youtubeUrl || 'NULL');
      } else {
        console.log('❌ youtubeUrl property does NOT exist in the data');
      }
      
      console.log('\nAll properties in first review:');
      console.log(Object.keys(firstReview));
    }
    
    // 3. Try to select youtubeUrl specifically
    console.log('\n3. Trying to select youtubeUrl specifically...');
    try {
      const youtubeCheck = await prisma.$queryRaw`SELECT id, title, "youtubeUrl" FROM "Review" LIMIT 1;`;
      console.log('✅ Successfully selected youtubeUrl column');
      console.log('Data:', youtubeCheck);
    } catch (error) {
      console.log('❌ Error selecting youtubeUrl column:', error.message);
    }
    
  } catch (error) {
    console.error('Error in direct database check:', error);
  } finally {
    await prisma.$disconnect();
  }
}

directDatabaseCheck(); 