import OpenAI from 'openai';

let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (openaiClient) {
    return openaiClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing OpenAI configuration. Please set OPENAI_API_KEY environment variable.'
    );
  }

  openaiClient = new OpenAI({ apiKey });
  return openaiClient;
}

export async function generateEmbedding(text: string): Promise<number[]> {
  const openai = getOpenAIClient();

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.trim(),
    dimensions: 1536,
  });

  return response.data[0].embedding;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const openai = getOpenAIClient();

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts.map((t) => t.trim()),
    dimensions: 1536,
  });

  // Sort by index to ensure correct order
  const sorted = response.data.sort((a, b) => a.index - b.index);
  return sorted.map((item) => item.embedding);
}

export function resetOpenAIClient(): void {
  openaiClient = null;
}
