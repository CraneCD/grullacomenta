const { default: fetch } = require('node-fetch');

async function testLocalAPI() {
  try {
    console.log('Testing local API...');
    
    const response = await fetch('http://localhost:3002/api/public/reviews');
    
    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log(`Found ${data.length} reviews in API response`);
    
    // Check the specific review
    const specificReview = data.find(review => review.id === 'cmb174837431827915amr6nswam');
    
    if (specificReview) {
      console.log('\nSpecific review from local API:');
      console.log(`Title: ${specificReview.title}`);
      console.log(`YouTube URL: ${specificReview.youtubeUrl || 'MISSING'}`);
      console.log(`Has youtubeUrl field: ${specificReview.hasOwnProperty('youtubeUrl')}`);
      
      // Show all fields
      console.log('\nAll fields in response:');
      console.log(Object.keys(specificReview));
    } else {
      console.log('Specific review not found in API response');
    }
    
  } catch (error) {
    console.error('Error testing local API:', error.message);
  }
}

testLocalAPI(); 