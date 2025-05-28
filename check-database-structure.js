const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseStructure() {
  try {
    console.log('Checking actual database table structure...');
    
    // Query the database schema directly to see what columns exist
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Review' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    
    console.log('\nActual columns in Review table:');
    console.log('================================');
    result.forEach(column => {
      console.log(`${column.column_name} (${column.data_type}) - Nullable: ${column.is_nullable}`);
    });
    
    // Check if youtubeUrl column exists
    const hasYouTubeUrl = result.some(column => column.column_name === 'youtubeUrl');
    console.log(`\nHas youtubeUrl column: ${hasYouTubeUrl}`);
    
    if (!hasYouTubeUrl) {
      console.log('\n❌ The youtubeUrl column is MISSING from the database!');
      console.log('This explains why the API is not returning this field.');
    } else {
      console.log('\n✅ The youtubeUrl column exists in the database.');
    }
    
  } catch (error) {
    console.error('Error checking database structure:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseStructure(); 