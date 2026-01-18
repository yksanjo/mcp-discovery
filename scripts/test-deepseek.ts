import { config } from 'dotenv';
config();

import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com/v1',
});

async function test() {
  console.log('Testing DeepSeek API...');
  
  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: 'Say "API working!" in 3 words max.' }
      ],
      max_tokens: 20,
    });
    
    console.log('Response:', response.choices[0]?.message?.content);
    console.log('API key is valid!');
  } catch (error: any) {
    console.error('API Error:', error.message);
  }
}

test();
