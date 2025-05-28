const { default: fetch } = require('node-fetch');

async function testProductionAPI() {
  try {
    console.log('Testing production API...');
    
    const response = await fetch('https://grullacomenta.vercel.app/api/public/reviews');
    
    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log(`Found ${data.length} reviews in production API response`);
    
    if (data.length > 0) {
      const firstReview = data[0];
      console.log('\nFirst review from production API:');
      console.log(`Title: ${firstReview.title}`);
      console.log(`YouTube URL: ${firstReview.youtubeUrl || 'MISSING'}`);
      console.log(`Has youtubeUrl field: ${firstReview.hasOwnProperty('youtubeUrl')}`);
      
      // Show all fields
      console.log('\nAll fields in production response:');
      console.log(Object.keys(firstReview));
      
      if (firstReview.youtubeUrl) {
        console.log('\n✅ SUCCESS: Production API is now returning youtubeUrl field!');
      } else {
        console.log('\n❌ ISSUE: Production API still not returning youtubeUrl field');
      }
    } else {
      console.log('No reviews found in production API response');
    }
    
  } catch (error) {
    console.error('Error testing production API:', error.message);
  }
}

testProductionAPI(); 