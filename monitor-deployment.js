const { default: fetch } = require('node-fetch');

async function monitorDeployment() {
  console.log('🚀 Monitoring production deployment...\n');
  
  let attempts = 0;
  const maxAttempts = 20; // Check for up to 10 minutes (30 seconds * 20)
  
  while (attempts < maxAttempts) {
    attempts++;
    console.log(`Attempt ${attempts}/${maxAttempts} - Checking production API...`);
    
    try {
      const response = await fetch('https://grullacomenta.vercel.app/api/public/reviews');
      
      if (!response.ok) {
        console.log(`❌ API returned status: ${response.status}`);
      } else {
        const data = await response.json();
        
        if (data.length > 0) {
          const firstReview = data[0];
          const hasYouTubeUrl = firstReview.hasOwnProperty('youtubeUrl');
          
          console.log(`📊 Found ${data.length} reviews`);
          console.log(`🎬 Has youtubeUrl field: ${hasYouTubeUrl}`);
          
          if (hasYouTubeUrl && firstReview.youtubeUrl) {
            console.log(`✅ SUCCESS! Production API now returns youtubeUrl: ${firstReview.youtubeUrl}`);
            console.log('\n🎉 Deployment successful! The YouTube embed should now work on your review page.');
            return;
          } else if (hasYouTubeUrl) {
            console.log(`⚠️  Field exists but value is: ${firstReview.youtubeUrl || 'null'}`);
          } else {
            console.log('❌ youtubeUrl field still missing');
          }
        } else {
          console.log('❌ No reviews found in response');
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    if (attempts < maxAttempts) {
      console.log('⏳ Waiting 30 seconds before next check...\n');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('\n⏰ Monitoring timeout reached. Please check manually or try redeploying.');
}

monitorDeployment(); 