const { default: fetch } = require('node-fetch');

async function testLocalAPI() {
  try {
    console.log('Testing local API...');
    
    // Try different ports
    const ports = [3000, 3001, 3002];
    let response = null;
    let workingPort = null;
    
    for (const port of ports) {
      try {
        console.log(`Trying port ${port}...`);
        response = await fetch(`http://localhost:${port}/api/public/reviews`);
        if (response.ok) {
          workingPort = port;
          break;
        }
      } catch (error) {
        console.log(`Port ${port} not available`);
      }
    }
    
    if (!response || !response.ok) {
      console.error('No working API found on any port');
      return;
    }
    
    console.log(`✅ Found working API on port ${workingPort}`);
    
    const data = await response.json();
    console.log(`Found ${data.length} reviews in local API response`);
    
    if (data.length > 0) {
      const firstReview = data[0];
      console.log('\nFirst review from local API:');
      console.log(`Title: ${firstReview.title}`);
      console.log(`YouTube URL: ${firstReview.youtubeUrl || 'MISSING'}`);
      console.log(`Has youtubeUrl field: ${firstReview.hasOwnProperty('youtubeUrl')}`);
      
      // Show all fields
      console.log('\nAll fields in local API response:');
      console.log(Object.keys(firstReview));
      
      if (firstReview.youtubeUrl) {
        console.log('\n✅ SUCCESS: Local API is returning youtubeUrl field!');
      } else {
        console.log('\n❌ ISSUE: Local API not returning youtubeUrl field');
      }
    } else {
      console.log('No reviews found in local API response');
    }
    
  } catch (error) {
    console.error('Error testing local API:', error.message);
  }
}

testLocalAPI(); 