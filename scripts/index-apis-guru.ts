#!/usr/bin/env tsx
/**
 * APIs.guru Indexer
 * Indexes 2000+ OpenAPI specs into Agent Tool Index
 */

import { getSupabaseClient } from '../src/db/client.js';
import OpenAI from 'openai';
import 'dotenv/config';

const openai = new OpenAI();
const supabase = getSupabaseClient();

interface APIInfo {
  name: string;
  description: string;
  category: string;
  protocol: string;
  base_url: string;
  documentation_url: string;
  openapi_spec_url: string;
}

// Category mapping based on API names/descriptions
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'communication': ['email', 'sms', 'chat', 'message', 'slack', 'discord', 'twilio', 'sendgrid'],
  'data': ['database', 'storage', 'file', 's3', 'cloud', 'firebase', 'supabase'],
  'payments': ['payment', 'stripe', 'paypal', 'billing', 'invoice', 'financial'],
  'productivity': ['calendar', 'task', 'project', 'notion', 'asana', 'trello'],
  'ai': ['ai', 'ml', 'machine learning', 'openai', 'anthropic', 'llm', 'embedding'],
  'development': ['github', 'gitlab', 'ci', 'deploy', 'vercel', 'netlify'],
  'marketing': ['analytics', 'seo', 'social', 'twitter', 'linkedin', 'mailchimp'],
  'ecommerce': ['shop', 'commerce', 'product', 'inventory', 'order'],
};

function categorize(name: string, description: string): string {
  const text = `${name} ${description}`.toLowerCase();

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => text.includes(kw))) {
      return category;
    }
  }
  return 'other';
}

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000), // Limit input size
    dimensions: 1536,
  });
  return response.data[0].embedding;
}

async function fetchAPIsGuru(): Promise<Record<string, any>> {
  console.log('Fetching APIs.guru directory...');
  const response = await fetch('https://api.apis.guru/v2/list.json');
  return response.json();
}

async function indexAPI(api: APIInfo): Promise<boolean> {
  try {
    // Generate embedding
    const embeddingText = `${api.name} ${api.description}`;
    const embedding = await generateEmbedding(embeddingText);

    // Insert into database
    const { error } = await supabase.from('agent_tools').upsert({
      name: api.name,
      description: api.description,
      category: api.category,
      protocol: api.protocol,
      base_url: api.base_url,
      documentation_url: api.documentation_url,
      openapi_spec_url: api.openapi_spec_url,
      embedding: embedding,
      verified: false,
      pricing: 'unknown',
    }, {
      onConflict: 'name',
    });

    if (error) {
      console.error(`Failed to index ${api.name}:`, error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error indexing ${api.name}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting APIs.guru indexer...\n');

  const apis = await fetchAPIsGuru();
  const apiList = Object.entries(apis);

  console.log(`Found ${apiList.length} APIs to index\n`);

  let indexed = 0;
  let failed = 0;

  for (const [key, value] of apiList) {
    const preferred = value.preferred || Object.keys(value.versions)[0];
    const apiInfo = value.versions[preferred];

    if (!apiInfo || !apiInfo.info) continue;

    const api: APIInfo = {
      name: apiInfo.info.title || key,
      description: apiInfo.info.description || '',
      category: categorize(apiInfo.info.title || '', apiInfo.info.description || ''),
      protocol: 'rest',
      base_url: apiInfo.swaggerUrl ? new URL(apiInfo.swaggerUrl).origin : '',
      documentation_url: apiInfo.info['x-origin']?.[0]?.url || apiInfo.externalDocs?.url || '',
      openapi_spec_url: apiInfo.swaggerUrl || '',
    };

    const success = await indexAPI(api);

    if (success) {
      indexed++;
      console.log(`✓ [${indexed}/${apiList.length}] ${api.name} (${api.category})`);
    } else {
      failed++;
    }

    // Rate limit: 1 request per 100ms to avoid OpenAI limits
    await new Promise(resolve => setTimeout(resolve, 100));

    // Progress update every 100 APIs
    if ((indexed + failed) % 100 === 0) {
      console.log(`\n📊 Progress: ${indexed} indexed, ${failed} failed\n`);
    }
  }

  console.log('\n========================================');
  console.log(`✅ Indexing complete!`);
  console.log(`   Indexed: ${indexed}`);
  console.log(`   Failed: ${failed}`);
  console.log('========================================\n');
}

main().catch(console.error);
