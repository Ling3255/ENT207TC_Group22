const { getOpenAIClient, chatCompletion } = require('./src/lib/ai-client');

async function testAIClient() {
  try {
    console.log('Testing AI client...');
    const client = getOpenAIClient();
    console.log('Client created successfully');
    
    const response = await chatCompletion([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello, test message!' }
    ]);
    
    console.log('Response received:', response);
  } catch (error) {
    console.error('Error testing AI client:', error);
  }
}

testAIClient();