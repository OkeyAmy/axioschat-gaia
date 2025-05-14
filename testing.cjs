// testing.cjs
const { OpenAI } = require('openai');

console.log('🛠️ Starting CommonJS test script...');

const openai = new OpenAI({
  apiKey: 'gaia-ZWUzODI4ZDMtYjQ2MC00M2RhLTg0ZjUtNjk4YjY1MDhiZGFk-nYEAs9-Qkex7z1b2',
  baseURL: 'https://qwen72b.gaia.domains/v1',
});

async function testModel() {
  console.log('➡️ Sending request...');
  try {
    const chatCompletion = await openai.chat.completions.create({
      model: 'qwen72b',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user',   content: 'What is the capital of France?' },
      ],
      temperature: 0.7,
    });
    console.log('🧠 Response:', chatCompletion.choices[0].message.content);
  } catch (error) {
    console.error('❌ Error communicating with the model:', error);
  }
}

testModel();
