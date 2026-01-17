#!/usr/bin/env tsx

import { config } from 'dotenv';
config();

import { getServersWithoutEmbeddings, updateServerEmbedding } from '../src/db/queries.js';
import { generateEmbedding } from '../src/services/embeddings.js';

async function main(): Promise<void> {
  console.log('Generating embeddings for MCP servers...\n');

  // Get servers without embeddings
  const servers = await getServersWithoutEmbeddings();
  console.log(`Found ${servers.length} servers without embeddings\n`);

  if (servers.length === 0) {
    console.log('All servers already have embeddings!');
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const server of servers) {
    try {
      // Create embedding text from name and description
      const text = `${server.name}. ${server.description || ''}`.trim();

      console.log(`Generating embedding for: ${server.name}`);

      const embedding = await generateEmbedding(text);
      await updateServerEmbedding(server.id, embedding);

      successCount++;
      console.log(`  ✓ Embedding saved (${embedding.length} dimensions)`);

      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      errorCount++;
      console.error(
        `  ✗ Failed:`,
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total: ${servers.length}`);
}

main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});
