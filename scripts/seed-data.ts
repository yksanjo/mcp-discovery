#!/usr/bin/env tsx

import { config } from 'dotenv';
config();

import { getSupabaseClient } from '../src/db/client.js';
import {
  bulkInsertServers,
  upsertCapability,
  linkServerCapability,
  getServerBySlug,
} from '../src/db/queries.js';
import type { MCPServerSeed } from '../src/types/index.js';

// 20+ MCP servers to seed
const MCP_SERVERS: MCPServerSeed[] = [
  // Database/Storage
  {
    name: 'PostgreSQL Server',
    slug: 'postgres-server',
    npm_package: '@modelcontextprotocol/server-postgres',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/postgres',
    description:
      'PostgreSQL database server for MCP. Enables AI agents to query and manage PostgreSQL databases with full SQL support, transactions, and connection pooling.',
    install_command: 'npx -y @modelcontextprotocol/server-postgres',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/postgres',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'database',
    capabilities: ['postgres', 'sql', 'database', 'queries'],
  },
  {
    name: 'SQLite Server',
    slug: 'sqlite-server',
    npm_package: '@modelcontextprotocol/server-sqlite',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/sqlite',
    description:
      'SQLite database server for MCP. Lightweight embedded database access for AI agents with full SQL support and local file-based storage.',
    install_command: 'npx -y @modelcontextprotocol/server-sqlite',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/sqlite',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'database',
    capabilities: ['sqlite', 'sql', 'database', 'embedded'],
  },
  {
    name: 'Memory Server',
    slug: 'memory-server',
    npm_package: '@modelcontextprotocol/server-memory',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/memory',
    description:
      'In-memory key-value store for MCP. Fast ephemeral storage for AI agent session data, caching, and temporary state management.',
    install_command: 'npx -y @modelcontextprotocol/server-memory',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/memory',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'storage',
    capabilities: ['memory', 'key-value', 'cache', 'storage'],
  },

  // File System
  {
    name: 'Filesystem Server',
    slug: 'filesystem-server',
    npm_package: '@modelcontextprotocol/server-filesystem',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem',
    description:
      'Local filesystem access for MCP. Enables AI agents to read, write, and manage files and directories on the local system with configurable permissions.',
    install_command: 'npx -y @modelcontextprotocol/server-filesystem',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/filesystem',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'filesystem',
    capabilities: ['filesystem', 'files', 'directories', 'read', 'write'],
  },
  {
    name: 'Google Drive Server',
    slug: 'gdrive-server',
    npm_package: '@modelcontextprotocol/server-gdrive',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive',
    description:
      'Google Drive integration for MCP. Access, search, and manage files in Google Drive with OAuth authentication and full file operations.',
    install_command: 'npx -y @modelcontextprotocol/server-gdrive',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/gdrive',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'storage',
    capabilities: ['google-drive', 'cloud-storage', 'files', 'oauth'],
  },

  // Version Control
  {
    name: 'Git Server',
    slug: 'git-server',
    npm_package: '@modelcontextprotocol/server-git',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/git',
    description:
      'Git version control for MCP. Enables AI agents to clone, commit, push, pull, and manage Git repositories with full git operations support.',
    install_command: 'npx -y @modelcontextprotocol/server-git',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/git',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'development',
    capabilities: ['git', 'version-control', 'repositories', 'commits'],
  },
  {
    name: 'GitHub Server',
    slug: 'github-server',
    npm_package: '@modelcontextprotocol/server-github',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    description:
      'GitHub API integration for MCP. Manage repositories, issues, pull requests, and GitHub actions with full GitHub API access.',
    install_command: 'npx -y @modelcontextprotocol/server-github',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/github',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'development',
    capabilities: ['github', 'repositories', 'issues', 'pull-requests', 'api'],
  },
  {
    name: 'GitLab Server',
    slug: 'gitlab-server',
    npm_package: '@modelcontextprotocol/server-gitlab',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/gitlab',
    description:
      'GitLab API integration for MCP. Manage GitLab projects, merge requests, issues, and CI/CD pipelines through the GitLab API.',
    install_command: 'npx -y @modelcontextprotocol/server-gitlab',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/gitlab',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'development',
    capabilities: ['gitlab', 'repositories', 'merge-requests', 'ci-cd'],
  },

  // Search
  {
    name: 'Brave Search Server',
    slug: 'brave-search-server',
    npm_package: '@modelcontextprotocol/server-brave-search',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/brave-search',
    description:
      'Brave Search API for MCP. Perform web searches using the Brave Search API with privacy-focused results and no tracking.',
    install_command: 'npx -y @modelcontextprotocol/server-brave-search',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/brave-search',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'search',
    capabilities: ['search', 'web-search', 'brave', 'privacy'],
  },
  {
    name: 'Exa Search Server',
    slug: 'exa-search-server',
    npm_package: '@modelcontextprotocol/server-exa',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/exa',
    description:
      'Exa neural search for MCP. AI-powered semantic search that understands meaning and context, not just keywords.',
    install_command: 'npx -y @modelcontextprotocol/server-exa',
    docs_url: 'https://exa.ai/docs',
    homepage_url: 'https://exa.ai',
    category: 'search',
    capabilities: ['search', 'neural-search', 'semantic', 'ai-powered'],
  },

  // Communication
  {
    name: 'Slack Server',
    slug: 'slack-server',
    npm_package: '@modelcontextprotocol/server-slack',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
    description:
      'Slack integration for MCP. Send messages, manage channels, and interact with Slack workspaces through the Slack API.',
    install_command: 'npx -y @modelcontextprotocol/server-slack',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/slack',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'communication',
    capabilities: ['slack', 'messaging', 'channels', 'workspace'],
  },
  {
    name: 'Gmail Server',
    slug: 'gmail-server',
    npm_package: '@anthropic/mcp-server-gmail',
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Gmail integration for MCP. Read, send, and manage emails in Gmail with OAuth authentication and full email operations.',
    install_command: 'npx -y @anthropic/mcp-server-gmail',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/gmail',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'communication',
    capabilities: ['gmail', 'email', 'oauth', 'google'],
  },

  // Browser Automation
  {
    name: 'Puppeteer Server',
    slug: 'puppeteer-server',
    npm_package: '@modelcontextprotocol/server-puppeteer',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/puppeteer',
    description:
      'Browser automation with Puppeteer for MCP. Control headless Chrome/Chromium for web scraping, testing, and automation tasks.',
    install_command: 'npx -y @modelcontextprotocol/server-puppeteer',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/puppeteer',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'automation',
    capabilities: ['puppeteer', 'browser', 'automation', 'scraping', 'chrome'],
  },
  {
    name: 'Playwright Server',
    slug: 'playwright-server',
    npm_package: '@anthropic/mcp-server-playwright',
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Browser automation with Playwright for MCP. Cross-browser automation supporting Chrome, Firefox, and Safari for testing and scraping.',
    install_command: 'npx -y @anthropic/mcp-server-playwright',
    docs_url: 'https://playwright.dev/docs',
    homepage_url: 'https://playwright.dev',
    category: 'automation',
    capabilities: [
      'playwright',
      'browser',
      'automation',
      'testing',
      'cross-browser',
    ],
  },

  // AI/ML
  {
    name: 'EverArt Server',
    slug: 'everart-server',
    npm_package: '@modelcontextprotocol/server-everart',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/everart',
    description:
      'AI image generation with EverArt for MCP. Generate images using various AI models with style control and customization options.',
    install_command: 'npx -y @modelcontextprotocol/server-everart',
    docs_url: 'https://everart.ai/docs',
    homepage_url: 'https://everart.ai',
    category: 'ai',
    capabilities: ['image-generation', 'ai', 'art', 'creative'],
  },

  // Data/Analytics
  {
    name: 'Sentry Server',
    slug: 'sentry-server',
    npm_package: '@modelcontextprotocol/server-sentry',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/sentry',
    description:
      'Sentry error tracking for MCP. Query and analyze application errors, performance issues, and crashes from Sentry.',
    install_command: 'npx -y @modelcontextprotocol/server-sentry',
    docs_url: 'https://sentry.io/docs',
    homepage_url: 'https://sentry.io',
    category: 'monitoring',
    capabilities: ['sentry', 'errors', 'monitoring', 'debugging', 'analytics'],
  },

  // Utilities
  {
    name: 'Fetch Server',
    slug: 'fetch-server',
    npm_package: '@modelcontextprotocol/server-fetch',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/fetch',
    description:
      'HTTP fetch capabilities for MCP. Make HTTP requests to any URL with full control over headers, methods, and request bodies.',
    install_command: 'npx -y @modelcontextprotocol/server-fetch',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/fetch',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'utilities',
    capabilities: ['http', 'fetch', 'api', 'requests', 'web'],
  },
  {
    name: 'Time Server',
    slug: 'time-server',
    npm_package: '@modelcontextprotocol/server-time',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/time',
    description:
      'Time and timezone utilities for MCP. Get current time, convert between timezones, and perform date calculations.',
    install_command: 'npx -y @modelcontextprotocol/server-time',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/time',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'utilities',
    capabilities: ['time', 'timezone', 'date', 'utilities'],
  },

  // Cloud Platforms
  {
    name: 'AWS KB Retrieval Server',
    slug: 'aws-kb-retrieval-server',
    npm_package: '@modelcontextprotocol/server-aws-kb-retrieval',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/aws-kb-retrieval',
    description:
      'AWS Bedrock Knowledge Base retrieval for MCP. Query and retrieve information from AWS Bedrock Knowledge Bases with RAG support.',
    install_command: 'npx -y @modelcontextprotocol/server-aws-kb-retrieval',
    docs_url: 'https://aws.amazon.com/bedrock',
    homepage_url: 'https://aws.amazon.com',
    category: 'cloud',
    capabilities: ['aws', 'bedrock', 'knowledge-base', 'rag', 'retrieval'],
  },

  // Documentation
  {
    name: 'Sequential Thinking Server',
    slug: 'sequential-thinking-server',
    npm_package: '@modelcontextprotocol/server-sequential-thinking',
    github_url:
      'https://github.com/modelcontextprotocol/servers/tree/main/src/sequential-thinking',
    description:
      'Sequential thinking and reasoning for MCP. Enables structured step-by-step reasoning and chain-of-thought processing for complex tasks.',
    install_command: 'npx -y @modelcontextprotocol/server-sequential-thinking',
    docs_url: 'https://modelcontextprotocol.io/docs/servers/sequential-thinking',
    homepage_url: 'https://modelcontextprotocol.io',
    category: 'reasoning',
    capabilities: ['reasoning', 'thinking', 'chain-of-thought', 'logic'],
  },

  // More databases
  {
    name: 'Redis Server',
    slug: 'redis-server',
    npm_package: '@anthropic/mcp-server-redis',
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Redis database server for MCP. Fast in-memory data store with support for strings, hashes, lists, sets, and pub/sub.',
    install_command: 'npx -y @anthropic/mcp-server-redis',
    docs_url: 'https://redis.io/docs',
    homepage_url: 'https://redis.io',
    category: 'database',
    capabilities: ['redis', 'cache', 'key-value', 'pub-sub', 'in-memory'],
  },
  {
    name: 'MongoDB Server',
    slug: 'mongodb-server',
    npm_package: '@anthropic/mcp-server-mongodb',
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'MongoDB database server for MCP. NoSQL document database access with full CRUD operations, aggregation pipelines, and indexing.',
    install_command: 'npx -y @anthropic/mcp-server-mongodb',
    docs_url: 'https://mongodb.com/docs',
    homepage_url: 'https://mongodb.com',
    category: 'database',
    capabilities: ['mongodb', 'nosql', 'documents', 'database', 'aggregation'],
  },

  // Project Management
  {
    name: 'Linear Server',
    slug: 'linear-server',
    npm_package: '@anthropic/mcp-server-linear',
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Linear integration for MCP. Manage issues, projects, and workflows in Linear with full API access for product development teams.',
    install_command: 'npx -y @anthropic/mcp-server-linear',
    docs_url: 'https://linear.app/docs',
    homepage_url: 'https://linear.app',
    category: 'productivity',
    capabilities: ['linear', 'issues', 'projects', 'workflow', 'tracking'],
  },
  {
    name: 'Notion Server',
    slug: 'notion-server',
    npm_package: '@anthropic/mcp-server-notion',
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Notion integration for MCP. Access and manage Notion pages, databases, and workspaces with full API support.',
    install_command: 'npx -y @anthropic/mcp-server-notion',
    docs_url: 'https://notion.so/help',
    homepage_url: 'https://notion.so',
    category: 'productivity',
    capabilities: ['notion', 'documents', 'databases', 'workspace', 'wiki'],
  },
];

// Unique capabilities to seed
const CAPABILITIES = [
  { name: 'postgres', category: 'database', description: 'PostgreSQL database support' },
  { name: 'sql', category: 'database', description: 'SQL query language support' },
  { name: 'database', category: 'database', description: 'General database operations' },
  { name: 'queries', category: 'database', description: 'Query execution capability' },
  { name: 'sqlite', category: 'database', description: 'SQLite embedded database' },
  { name: 'embedded', category: 'database', description: 'Embedded/local storage' },
  { name: 'memory', category: 'storage', description: 'In-memory storage' },
  { name: 'key-value', category: 'storage', description: 'Key-value store operations' },
  { name: 'cache', category: 'storage', description: 'Caching capabilities' },
  { name: 'storage', category: 'storage', description: 'General storage operations' },
  { name: 'filesystem', category: 'filesystem', description: 'Local filesystem access' },
  { name: 'files', category: 'filesystem', description: 'File operations' },
  { name: 'directories', category: 'filesystem', description: 'Directory operations' },
  { name: 'read', category: 'filesystem', description: 'Read operations' },
  { name: 'write', category: 'filesystem', description: 'Write operations' },
  { name: 'google-drive', category: 'storage', description: 'Google Drive integration' },
  { name: 'cloud-storage', category: 'storage', description: 'Cloud storage access' },
  { name: 'oauth', category: 'auth', description: 'OAuth authentication' },
  { name: 'git', category: 'development', description: 'Git version control' },
  { name: 'version-control', category: 'development', description: 'Version control operations' },
  { name: 'repositories', category: 'development', description: 'Repository management' },
  { name: 'commits', category: 'development', description: 'Commit operations' },
  { name: 'github', category: 'development', description: 'GitHub integration' },
  { name: 'issues', category: 'development', description: 'Issue tracking' },
  { name: 'pull-requests', category: 'development', description: 'Pull request management' },
  { name: 'api', category: 'utilities', description: 'API access' },
  { name: 'gitlab', category: 'development', description: 'GitLab integration' },
  { name: 'merge-requests', category: 'development', description: 'Merge request management' },
  { name: 'ci-cd', category: 'development', description: 'CI/CD pipeline management' },
  { name: 'search', category: 'search', description: 'Search capabilities' },
  { name: 'web-search', category: 'search', description: 'Web search functionality' },
  { name: 'brave', category: 'search', description: 'Brave Search integration' },
  { name: 'privacy', category: 'search', description: 'Privacy-focused features' },
  { name: 'neural-search', category: 'search', description: 'Neural/semantic search' },
  { name: 'semantic', category: 'search', description: 'Semantic understanding' },
  { name: 'ai-powered', category: 'ai', description: 'AI-powered functionality' },
  { name: 'slack', category: 'communication', description: 'Slack integration' },
  { name: 'messaging', category: 'communication', description: 'Messaging capabilities' },
  { name: 'channels', category: 'communication', description: 'Channel management' },
  { name: 'workspace', category: 'communication', description: 'Workspace management' },
  { name: 'gmail', category: 'communication', description: 'Gmail integration' },
  { name: 'email', category: 'communication', description: 'Email operations' },
  { name: 'google', category: 'cloud', description: 'Google services integration' },
  { name: 'puppeteer', category: 'automation', description: 'Puppeteer browser automation' },
  { name: 'browser', category: 'automation', description: 'Browser control' },
  { name: 'automation', category: 'automation', description: 'Automation capabilities' },
  { name: 'scraping', category: 'automation', description: 'Web scraping' },
  { name: 'chrome', category: 'automation', description: 'Chrome browser support' },
  { name: 'playwright', category: 'automation', description: 'Playwright automation' },
  { name: 'testing', category: 'automation', description: 'Testing capabilities' },
  { name: 'cross-browser', category: 'automation', description: 'Cross-browser support' },
  { name: 'image-generation', category: 'ai', description: 'AI image generation' },
  { name: 'ai', category: 'ai', description: 'Artificial intelligence features' },
  { name: 'art', category: 'ai', description: 'Art generation' },
  { name: 'creative', category: 'ai', description: 'Creative tools' },
  { name: 'sentry', category: 'monitoring', description: 'Sentry integration' },
  { name: 'errors', category: 'monitoring', description: 'Error tracking' },
  { name: 'monitoring', category: 'monitoring', description: 'Monitoring capabilities' },
  { name: 'debugging', category: 'monitoring', description: 'Debugging support' },
  { name: 'analytics', category: 'monitoring', description: 'Analytics features' },
  { name: 'http', category: 'utilities', description: 'HTTP protocol support' },
  { name: 'fetch', category: 'utilities', description: 'Fetch/request operations' },
  { name: 'requests', category: 'utilities', description: 'HTTP request handling' },
  { name: 'web', category: 'utilities', description: 'Web operations' },
  { name: 'time', category: 'utilities', description: 'Time operations' },
  { name: 'timezone', category: 'utilities', description: 'Timezone support' },
  { name: 'date', category: 'utilities', description: 'Date operations' },
  { name: 'utilities', category: 'utilities', description: 'Utility functions' },
  { name: 'aws', category: 'cloud', description: 'AWS integration' },
  { name: 'bedrock', category: 'cloud', description: 'AWS Bedrock support' },
  { name: 'knowledge-base', category: 'ai', description: 'Knowledge base access' },
  { name: 'rag', category: 'ai', description: 'Retrieval-augmented generation' },
  { name: 'retrieval', category: 'ai', description: 'Information retrieval' },
  { name: 'reasoning', category: 'ai', description: 'Reasoning capabilities' },
  { name: 'thinking', category: 'ai', description: 'Thinking/reasoning support' },
  { name: 'chain-of-thought', category: 'ai', description: 'Chain of thought reasoning' },
  { name: 'logic', category: 'ai', description: 'Logical reasoning' },
  { name: 'redis', category: 'database', description: 'Redis database support' },
  { name: 'pub-sub', category: 'database', description: 'Pub/sub messaging' },
  { name: 'in-memory', category: 'database', description: 'In-memory database' },
  { name: 'mongodb', category: 'database', description: 'MongoDB support' },
  { name: 'nosql', category: 'database', description: 'NoSQL database support' },
  { name: 'documents', category: 'database', description: 'Document storage' },
  { name: 'aggregation', category: 'database', description: 'Data aggregation' },
  { name: 'linear', category: 'productivity', description: 'Linear integration' },
  { name: 'projects', category: 'productivity', description: 'Project management' },
  { name: 'workflow', category: 'productivity', description: 'Workflow management' },
  { name: 'tracking', category: 'productivity', description: 'Tracking capabilities' },
  { name: 'notion', category: 'productivity', description: 'Notion integration' },
  { name: 'databases', category: 'database', description: 'Database management' },
  { name: 'wiki', category: 'productivity', description: 'Wiki/documentation' },
];

async function seedCapabilities(): Promise<Map<string, string>> {
  console.log('Seeding capabilities...');
  const capabilityMap = new Map<string, string>();

  for (const cap of CAPABILITIES) {
    try {
      const result = await upsertCapability({
        name: cap.name,
        category: cap.category,
        description: cap.description,
        embedding: null,
      });
      capabilityMap.set(cap.name, result.id);
      console.log(`  Added capability: ${cap.name}`);
    } catch (error) {
      console.error(`  Failed to add capability ${cap.name}:`, error);
    }
  }

  console.log(`Seeded ${capabilityMap.size} capabilities`);
  return capabilityMap;
}

async function seedServers(
  capabilityMap: Map<string, string>
): Promise<void> {
  console.log('Seeding MCP servers...');

  const serversToInsert = MCP_SERVERS.map((server) => ({
    name: server.name,
    slug: server.slug,
    npm_package: server.npm_package,
    github_url: server.github_url,
    description: server.description,
    description_embedding: null,
    install_command: server.install_command,
    docs_url: server.docs_url,
    homepage_url: server.homepage_url,
    category: server.category,
    is_verified: true,
  }));

  try {
    const insertedServers = await bulkInsertServers(serversToInsert);
    console.log(`Inserted ${insertedServers.length} servers`);

    // Link capabilities
    console.log('Linking capabilities to servers...');
    for (const serverData of MCP_SERVERS) {
      const server = await getServerBySlug(serverData.slug);
      if (!server) continue;

      for (const capName of serverData.capabilities) {
        const capId = capabilityMap.get(capName);
        if (capId) {
          try {
            await linkServerCapability(server.id, capId);
          } catch {
            // Ignore duplicate link errors
          }
        }
      }
      console.log(`  Linked capabilities for: ${server.name}`);
    }
  } catch (error) {
    console.error('Failed to seed servers:', error);
    throw error;
  }
}

async function main(): Promise<void> {
  console.log('Starting seed process...\n');

  // Verify Supabase connection
  try {
    getSupabaseClient();
    console.log('Supabase connection established\n');
  } catch (error) {
    console.error('Failed to connect to Supabase:', error);
    process.exit(1);
  }

  // Seed capabilities first
  const capabilityMap = await seedCapabilities();
  console.log('');

  // Seed servers
  await seedServers(capabilityMap);

  console.log('\nSeed process complete!');
  console.log(`Total servers: ${MCP_SERVERS.length}`);
  console.log(`Total capabilities: ${CAPABILITIES.length}`);
}

main().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
