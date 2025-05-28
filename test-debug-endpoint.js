const { default: fetch } = require('node-fetch');

async function testDebugEndpoint() {
  try {
    console.log('🔍 Testing debug endpoint...\n');
    
    const response = await fetch('https://grullacomenta.vercel.app/api/debug');
    
    if (!response.ok) {
      console.error('❌ Debug endpoint failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    
    if (data.status === 'error') {
      console.error('❌ Debug endpoint returned error:', data.error);
      if (data.stack) {
        console.error('Stack trace:', data.stack);
      }
      return;
    }
    
    console.log('✅ Debug endpoint successful!\n');
    
    const tests = data.tests;
    
    console.log('🔗 Connection Test:', tests.connectionTest);
    console.log('\n📊 Table Structure:');
    tests.tableStructure.forEach((col, index) => {
      console.log(`  ${index + 1}. ${col.column_name} (${col.data_type}) - Nullable: ${col.is_nullable}`);
    });
    
    console.log(`\n🎬 Has youtubeUrl in table: ${tests.hasYouTubeUrlInTable}`);
    console.log(`🎬 Has youtubeUrl in Prisma: ${tests.hasYouTubeUrlInPrisma}`);
    
    console.log('\n📝 Raw Review from SQL:');
    if (tests.rawReview && tests.rawReview.length > 0) {
      const rawReview = tests.rawReview[0];
      console.log(`  Title: ${rawReview.title}`);
      console.log(`  YouTube URL: ${rawReview.youtubeUrl || 'NULL'}`);
      console.log(`  All fields: ${Object.keys(rawReview).join(', ')}`);
    }
    
    console.log('\n🔧 Prisma Review:');
    if (tests.prismaReview) {
      console.log(`  Title: ${tests.prismaReview.title}`);
      console.log(`  YouTube URL: ${tests.prismaReview.youtubeUrl || 'NULL'}`);
      console.log(`  Prisma fields: ${tests.prismaReviewKeys.join(', ')}`);
    }
    
    // Analysis
    console.log('\n🔍 ANALYSIS:');
    if (tests.hasYouTubeUrlInTable && !tests.hasYouTubeUrlInPrisma) {
      console.log('❌ ISSUE FOUND: youtubeUrl exists in database but NOT in Prisma client!');
      console.log('   This suggests a Prisma client generation issue in production.');
    } else if (!tests.hasYouTubeUrlInTable) {
      console.log('❌ ISSUE FOUND: youtubeUrl column missing from database table!');
    } else if (tests.hasYouTubeUrlInTable && tests.hasYouTubeUrlInPrisma) {
      console.log('✅ Both database and Prisma have youtubeUrl field - investigating further...');
    }
    
  } catch (error) {
    console.error('❌ Error testing debug endpoint:', error.message);
  }
}

testDebugEndpoint(); 