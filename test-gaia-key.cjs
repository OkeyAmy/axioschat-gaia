// test-gaia-key.cjs - Simple script to test a Gaia Network API key

const { OpenAI } = require('openai');
const https = require('https');

// Replace with your actual Gaia Network API key
const API_KEY = process.argv[2] || '';
const BASE_URL = 'https://qwen72b.gaia.domains/v1';

if (!API_KEY) {
  console.error('❌ Error: No API key provided!');
  console.log('Usage: node test-gaia-key.cjs YOUR_GAIA_API_KEY');
  process.exit(1);
}

// Check if the key format is correct
if (!API_KEY.startsWith('gaia-')) {
  console.error('❌ Error: Invalid Gaia Network API key format!');
  console.error('API keys must start with "gaia-". Current key:', API_KEY.substring(0, 8) + '...');
  process.exit(1);
}

console.log('✅ API key format appears valid (starts with "gaia-")');
console.log(`🔑 Testing with key: ${API_KEY.substring(0, 8)}...${API_KEY.substring(API_KEY.length - 4)}`);

// Test using the OpenAI SDK
async function testWithOpenAISdk() {
  console.log('\n🛠️ Testing with OpenAI SDK...');
  const openai = new OpenAI({
    apiKey: API_KEY,
    baseURL: BASE_URL,
  });

  try {
    const res = await openai.chat.completions.create({
      model: 'qwen72b',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user',   content: 'Reply with only the word "SUCCESS" if you can read this message.' },
      ],
      temperature: 0.7,
      max_tokens: 50,
    });
    
    const content = res.choices[0]?.message?.content || '';
    if (content.includes('SUCCESS')) {
      console.log('✅ SDK TEST PASSED: Successfully received response from Gaia Network API');
    } else {
      console.log('⚠️ SDK TEST WARNING: Received response but content was unexpected:', content);
    }
    return true;
  } catch (err) {
    console.error('❌ SDK TEST FAILED:', err.message);
    if (err.status === 401) {
      console.error('   This looks like an authentication error. Please check your API key.');
    }
    return false;
  }
}

// Test using raw HTTPS
function testWithRawHttps() {
  return new Promise((resolve) => {
    console.log('\n🛠️ Testing with raw HTTPS request...');
    const payload = JSON.stringify({
      model: 'qwen72b',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user',   content: 'Reply with only the word "SUCCESS" if you can read this message.' },
      ],
      temperature: 0.7,
      max_tokens: 50,
    });

    const opts = {
      hostname: 'qwen72b.gaia.domains',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(opts, (res) => {
      console.log(`🔄 HTTPS Response Status: ${res.statusCode}`);
      
      if (res.statusCode === 401) {
        console.error('❌ HTTPS TEST FAILED: Authentication error (401 Unauthorized)');
        console.error('   Please check that your API key is correct and active.');
        resolve(false);
        return;
      }
      
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const msg = json.choices?.[0]?.message?.content;
          if (msg && msg.includes('SUCCESS')) {
            console.log('✅ HTTPS TEST PASSED: Successfully received response from Gaia Network API');
            resolve(true);
          } else {
            console.log('⚠️ HTTPS TEST WARNING: Received response but content was unexpected:', msg);
            resolve(true);
          }
        } catch (parseErr) {
          console.error('❌ HTTPS TEST FAILED: Parse error:', parseErr.message);
          console.error('   Raw response:', body);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('❌ HTTPS TEST FAILED: Request error:', err.message);
      resolve(false);
    });
    
    req.write(payload);
    req.end();
  });
}

// Run the tests
(async () => {
  try {
    const sdkResult = await testWithOpenAISdk();
    const httpsResult = await testWithRawHttps();
    
    console.log('\n📊 TEST SUMMARY:');
    console.log(`OpenAI SDK Test: ${sdkResult ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Raw HTTPS Test: ${httpsResult ? '✅ PASSED' : '❌ FAILED'}`);
    
    if (sdkResult && httpsResult) {
      console.log('\n🎉 SUCCESS! Your Gaia Network API key is working properly!');
    } else {
      console.log('\n⚠️ WARNING: At least one test failed. Please check the logs above for details.');
    }
  } catch (error) {
    console.error('\n❌ ERROR: An unexpected error occurred during testing:', error);
  }
})(); 