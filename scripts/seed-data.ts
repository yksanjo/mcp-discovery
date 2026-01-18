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

// 70+ MCP servers to seed - comprehensive registry from Glama.ai and official sources
const MCP_SERVERS: MCPServerSeed[] = [
  // ==================== DATABASE/STORAGE ====================
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
    npm_package: '@notionhq/notion-mcp-server',
    github_url: 'https://github.com/makenotion/notion-mcp-server',
    description:
      'Official Notion MCP server. Enables AI assistants to interact with the Notion API, allowing them to search, read, comment on, and create content in Notion workspaces.',
    install_command: 'npx -y @notionhq/notion-mcp-server',
    docs_url: 'https://developers.notion.com',
    homepage_url: 'https://notion.so',
    category: 'productivity',
    capabilities: ['notion', 'documents', 'databases', 'workspace', 'wiki'],
  },

  // ==================== NEW SERVERS FROM GLAMA.AI ====================

  // Database Servers
  {
    name: 'AITable Server',
    slug: 'aitable-server',
    npm_package: '@apitable/aitable-mcp-server',
    github_url: 'https://github.com/apitable/aitable-mcp-server',
    description:
      'AITable MCP server enables AI agents to connect and work with AITable datasheets. Provides spreadsheet-like database functionality with API access for data management.',
    install_command: 'npx -y @apitable/aitable-mcp-server',
    docs_url: 'https://aitable.ai/docs',
    homepage_url: 'https://aitable.ai',
    category: 'database',
    capabilities: ['database', 'spreadsheet', 'data-management', 'api'],
  },
  {
    name: 'Elasticsearch Server',
    slug: 'elasticsearch-server',
    npm_package: null,
    github_url: 'https://github.com/elastic/mcp-server-elasticsearch',
    description:
      'Connects Claude and MCP clients to Elasticsearch data, allowing natural language interactions with Elasticsearch indices for search and analytics.',
    install_command: 'npx -y @elastic/mcp-server-elasticsearch',
    docs_url: 'https://www.elastic.co/docs',
    homepage_url: 'https://www.elastic.co',
    category: 'database',
    capabilities: ['elasticsearch', 'search', 'analytics', 'database', 'indexing'],
  },
  {
    name: 'GreptimeDB Server',
    slug: 'greptimedb-server',
    npm_package: null,
    github_url: 'https://github.com/GreptimeTeam/greptimedb-mcp-server',
    description:
      'Enables AI assistants to securely interact with GreptimeDB for schema exploration, data reading, and SQL query execution through a controlled interface.',
    install_command: 'npx -y @greptimeteam/greptimedb-mcp-server',
    docs_url: 'https://docs.greptime.com',
    homepage_url: 'https://greptime.com',
    category: 'database',
    capabilities: ['database', 'timeseries', 'sql', 'analytics'],
  },
  {
    name: 'Upstash Server',
    slug: 'upstash-server',
    npm_package: null,
    github_url: 'https://github.com/upstash/mcp-server',
    description:
      'MCP Server for Upstash Developer APIs. Access serverless Redis, Kafka, and QStash for caching, messaging, and task scheduling.',
    install_command: 'npx -y @upstash/mcp-server',
    docs_url: 'https://upstash.com/docs',
    homepage_url: 'https://upstash.com',
    category: 'database',
    capabilities: ['redis', 'kafka', 'serverless', 'cache', 'messaging'],
  },
  {
    name: 'Alibaba Cloud RDS Server',
    slug: 'alibaba-rds-server',
    npm_package: null,
    github_url: 'https://github.com/aliyun/alibabacloud-rds-openapi-mcp-server',
    description:
      'Provides management and connectivity for Alibaba Cloud RDS database services via OpenAPI. Manage cloud database instances and configurations.',
    install_command: 'npx -y @aliyun/rds-mcp-server',
    docs_url: 'https://www.alibabacloud.com/help/rds',
    homepage_url: 'https://www.alibabacloud.com/product/rds',
    category: 'database',
    capabilities: ['database', 'cloud', 'alibaba', 'rds', 'mysql'],
  },

  // Search Servers
  {
    name: 'Brave Search Server (Official)',
    slug: 'brave-search-official',
    npm_package: '@brave/brave-search-mcp-server',
    github_url: 'https://github.com/brave/brave-search-mcp-server',
    description:
      'Official Brave Search MCP server. Integrates Brave Search API with comprehensive web, local business, image, video, news searches, and AI-powered summarization.',
    install_command: 'npx -y @brave/brave-search-mcp-server',
    docs_url: 'https://brave.com/search/api/',
    homepage_url: 'https://brave.com/search/',
    category: 'search',
    capabilities: ['search', 'web-search', 'brave', 'privacy', 'news', 'images'],
  },
  {
    name: 'Kagi Search Server',
    slug: 'kagi-search-server',
    npm_package: null,
    github_url: 'https://github.com/kagisearch/kagimcp',
    description:
      'Integrates Kagi search capabilities with Claude AI for real-time, ad-free web searches with high-quality results and privacy focus.',
    install_command: 'npx -y @kagisearch/mcp-server',
    docs_url: 'https://kagi.com/docs',
    homepage_url: 'https://kagi.com',
    category: 'search',
    capabilities: ['search', 'web-search', 'kagi', 'privacy', 'premium-search'],
  },
  {
    name: 'DataForSEO Server',
    slug: 'dataforseo-server',
    npm_package: null,
    github_url: 'https://github.com/dataforseo/mcp-server-typescript',
    description:
      'Enables Claude to interact with DataForSEO APIs for comprehensive SEO data including SERPs, keyword research, backlinks, and competitor analysis.',
    install_command: 'npx -y @dataforseo/mcp-server',
    docs_url: 'https://docs.dataforseo.com',
    homepage_url: 'https://dataforseo.com',
    category: 'search',
    capabilities: ['seo', 'search', 'keywords', 'serp', 'analytics'],
  },

  // Browser Automation
  {
    name: 'Playwright Server (Microsoft)',
    slug: 'playwright-microsoft',
    npm_package: null,
    github_url: 'https://github.com/microsoft/playwright-mcp',
    description:
      'Official Microsoft Playwright MCP server. Enables LLMs to interact with web pages through structured accessibility snapshots without requiring vision models.',
    install_command: 'npx -y @playwright/mcp-server',
    docs_url: 'https://playwright.dev/docs',
    homepage_url: 'https://playwright.dev',
    category: 'automation',
    capabilities: ['playwright', 'browser', 'automation', 'testing', 'accessibility'],
  },
  {
    name: 'GoLogin Server',
    slug: 'gologin-server',
    npm_package: null,
    github_url: 'https://github.com/gologinapp/gologin-mcp',
    description:
      'Manage GoLogin browser profiles and automation through AI conversations. Control multiple browser profiles with different fingerprints for web automation.',
    install_command: 'npx -y @gologin/mcp-server',
    docs_url: 'https://gologin.com/docs',
    homepage_url: 'https://gologin.com',
    category: 'automation',
    capabilities: ['browser', 'automation', 'profiles', 'fingerprinting', 'scraping'],
  },

  // Web Scraping
  {
    name: 'Skrape Server',
    slug: 'skrape-server',
    npm_package: null,
    github_url: 'https://github.com/skrapeai/skrape-mcp',
    description:
      'Converts webpages into clean, structured Markdown optimized for language model consumption. Extract and process web content efficiently.',
    install_command: 'npx -y @skrapeai/mcp-server',
    docs_url: 'https://skrape.ai/docs',
    homepage_url: 'https://skrape.ai',
    category: 'scraping',
    capabilities: ['scraping', 'markdown', 'web-extraction', 'content'],
  },
  {
    name: 'Oxylabs Server',
    slug: 'oxylabs-server',
    npm_package: null,
    github_url: 'https://github.com/oxylabs/oxylabs-mcp',
    description:
      'Scraper tool leveraging Oxylabs Web Scraper API for professional web content extraction with proxy rotation and anti-blocking features.',
    install_command: 'npx -y @oxylabs/mcp-server',
    docs_url: 'https://oxylabs.io/docs',
    homepage_url: 'https://oxylabs.io',
    category: 'scraping',
    capabilities: ['scraping', 'proxy', 'web-extraction', 'enterprise'],
  },
  {
    name: 'ScreenshotOne Server',
    slug: 'screenshotone-server',
    npm_package: null,
    github_url: 'https://github.com/screenshotone/mcp',
    description:
      'Allows AI assistants to capture website screenshots through the ScreenshotOne API. Generate visual context from any web page.',
    install_command: 'npx -y @screenshotone/mcp-server',
    docs_url: 'https://screenshotone.com/docs',
    homepage_url: 'https://screenshotone.com',
    category: 'scraping',
    capabilities: ['screenshots', 'images', 'web-capture', 'visual'],
  },

  // Blockchain/Web3
  {
    name: 'Blockscout Server',
    slug: 'blockscout-server',
    npm_package: null,
    github_url: 'https://github.com/blockscout/mcp-server',
    description:
      'Exposes blockchain data via MCP including balances, tokens, NFTs, and contract metadata. Universal blockchain explorer integration.',
    install_command: 'npx -y @blockscout/mcp-server',
    docs_url: 'https://docs.blockscout.com',
    homepage_url: 'https://blockscout.com',
    category: 'blockchain',
    capabilities: ['blockchain', 'ethereum', 'nft', 'tokens', 'web3'],
  },
  {
    name: 'NEAR Server',
    slug: 'near-server',
    npm_package: null,
    github_url: 'https://github.com/nearai/near-mcp',
    description:
      'Interact with the NEAR blockchain through MCP calls. Access accounts, transactions, and smart contracts on NEAR Protocol.',
    install_command: 'npx -y @nearai/mcp-server',
    docs_url: 'https://docs.near.org',
    homepage_url: 'https://near.org',
    category: 'blockchain',
    capabilities: ['blockchain', 'near', 'web3', 'smart-contracts'],
  },
  {
    name: 'Satstream Server',
    slug: 'satstream-server',
    npm_package: null,
    github_url: 'https://github.com/satstream/ss-mcp',
    description:
      'Query Bitcoin blockchain data including address information, transactions, mempool statistics, and ordinals/inscriptions.',
    install_command: 'npx -y @satstream/mcp-server',
    docs_url: 'https://satstream.io/docs',
    homepage_url: 'https://satstream.io',
    category: 'blockchain',
    capabilities: ['blockchain', 'bitcoin', 'ordinals', 'transactions'],
  },
  {
    name: 'Stampchain Server',
    slug: 'stampchain-server',
    npm_package: null,
    github_url: 'https://github.com/stampchain-io/stampchain-mcp',
    description:
      'Interact with Bitcoin Stamps data via the Stampchain API. Access permanent on-chain data storage on Bitcoin.',
    install_command: 'npx -y @stampchain/mcp-server',
    docs_url: 'https://stampchain.io/docs',
    homepage_url: 'https://stampchain.io',
    category: 'blockchain',
    capabilities: ['blockchain', 'bitcoin', 'stamps', 'on-chain-data'],
  },

  // Research & Data
  {
    name: 'arXiv Server',
    slug: 'arxiv-server',
    npm_package: null,
    github_url: 'https://github.com/lecigarevolant/arxiv-mcp-server-gpt',
    description:
      'Search scholarly articles on arXiv.org, retrieve metadata, download PDFs, and load research content into LLM context for analysis.',
    install_command: 'npx -y arxiv-mcp-server',
    docs_url: 'https://arxiv.org/help/api',
    homepage_url: 'https://arxiv.org',
    category: 'research',
    capabilities: ['research', 'papers', 'arxiv', 'academic', 'pdf'],
  },
  {
    name: 'BioMCP Server',
    slug: 'biomcp-server',
    npm_package: null,
    github_url: 'https://github.com/genomoncology/biomcp',
    description:
      'Structured access to biomedical databases including PubTator3, ClinicalTrials.gov, and MyVariant.info for medical and genomic research.',
    install_command: 'npx -y @genomoncology/biomcp',
    docs_url: 'https://github.com/genomoncology/biomcp#readme',
    homepage_url: 'https://genomoncology.com',
    category: 'research',
    capabilities: ['biomedical', 'research', 'clinical-trials', 'genomics', 'medical'],
  },
  {
    name: 'RSpace Server',
    slug: 'rspace-server',
    npm_package: null,
    github_url: 'https://github.com/rspace-os/rspace-mcp',
    description:
      'Enables LLM agents to interact with RSpace API endpoints for accessing and manipulating electronic lab notebook research data.',
    install_command: 'npx -y @rspace/mcp-server',
    docs_url: 'https://rspace.com/docs',
    homepage_url: 'https://rspace.com',
    category: 'research',
    capabilities: ['research', 'lab-notebook', 'science', 'data-management'],
  },
  {
    name: 'Financial Datasets Server',
    slug: 'financial-datasets-server',
    npm_package: null,
    github_url: 'https://github.com/financial-datasets/mcp-server',
    description:
      'Provides AI assistants access to stock market data including financial statements, stock prices, and market analytics.',
    install_command: 'npx -y @financial-datasets/mcp-server',
    docs_url: 'https://financialdatasets.ai/docs',
    homepage_url: 'https://financialdatasets.ai',
    category: 'finance',
    capabilities: ['finance', 'stocks', 'market-data', 'analytics'],
  },

  // AI/ML Tools
  {
    name: 'MiniMax Server',
    slug: 'minimax-server',
    npm_package: null,
    github_url: 'https://github.com/MiniMax-AI/MiniMax-MCP',
    description:
      'Interact with MiniMax APIs for generating speech, cloning voices, creating videos, and generating images. Multi-modal AI capabilities.',
    install_command: 'npx -y @minimax/mcp-server',
    docs_url: 'https://api.minimax.chat/document',
    homepage_url: 'https://minimax.chat',
    category: 'ai',
    capabilities: ['ai', 'speech', 'voice-cloning', 'video', 'image-generation'],
  },
  {
    name: 'Mem0 Server',
    slug: 'mem0-server',
    npm_package: null,
    github_url: 'https://github.com/mem0ai/mem0-mcp',
    description:
      'Integrates with mem0.ai to store, retrieve, and search coding preferences and context for more consistent and personalized AI interactions.',
    install_command: 'npx -y @mem0ai/mcp-server',
    docs_url: 'https://mem0.ai/docs',
    homepage_url: 'https://mem0.ai',
    category: 'ai',
    capabilities: ['memory', 'context', 'personalization', 'ai', 'preferences'],
  },
  {
    name: 'Agentset RAG Server',
    slug: 'agentset-server',
    npm_package: null,
    github_url: 'https://github.com/agentset-ai/mcp-server',
    description:
      'Open-source platform for Retrieval-Augmented Generation (RAG). Upload documents and query them with semantic search capabilities.',
    install_command: 'npx -y @agentset/mcp-server',
    docs_url: 'https://agentset.ai/docs',
    homepage_url: 'https://agentset.ai',
    category: 'ai',
    capabilities: ['rag', 'documents', 'semantic-search', 'ai', 'retrieval'],
  },
  {
    name: 'Genkit MCP Server',
    slug: 'genkit-server',
    npm_package: null,
    github_url: 'https://github.com/firebase/genkit',
    description:
      'Provides integration between Firebase Genkit and MCP. Build AI-powered features with Google Firebase infrastructure.',
    install_command: 'npx -y @genkit/mcp-server',
    docs_url: 'https://firebase.google.com/docs/genkit',
    homepage_url: 'https://firebase.google.com/products/genkit',
    category: 'ai',
    capabilities: ['genkit', 'firebase', 'ai', 'google', 'ml'],
  },

  // Cloud Platforms
  {
    name: 'Heroku Server',
    slug: 'heroku-server',
    npm_package: null,
    github_url: 'https://github.com/heroku/heroku-mcp-server',
    description:
      'Allows AI agents to access the Heroku platform for app management, deployment, scaling, and monitoring of cloud applications.',
    install_command: 'npx -y @heroku/mcp-server',
    docs_url: 'https://devcenter.heroku.com',
    homepage_url: 'https://heroku.com',
    category: 'cloud',
    capabilities: ['heroku', 'cloud', 'deployment', 'paas', 'hosting'],
  },
  {
    name: 'Nacos Server',
    slug: 'nacos-server',
    npm_package: null,
    github_url: 'https://github.com/nacos-group/nacos-mcp-server',
    description:
      'Interact with Nacos service discovery and configuration management. Manage microservices configuration and service registry.',
    install_command: 'npx -y @nacos/mcp-server',
    docs_url: 'https://nacos.io/docs',
    homepage_url: 'https://nacos.io',
    category: 'cloud',
    capabilities: ['nacos', 'service-discovery', 'configuration', 'microservices'],
  },
  {
    name: 'Qiniu Cloud Server',
    slug: 'qiniu-server',
    npm_package: null,
    github_url: 'https://github.com/qiniu/qiniu-mcp-server',
    description:
      'Access Qiniu Cloud Storage and multimedia services. Manage cloud storage, CDN, and media processing in China.',
    install_command: 'npx -y @qiniu/mcp-server',
    docs_url: 'https://developer.qiniu.com',
    homepage_url: 'https://qiniu.com',
    category: 'cloud',
    capabilities: ['cloud-storage', 'cdn', 'media', 'qiniu', 'china'],
  },

  // Monitoring & Observability
  {
    name: 'Scout Monitoring Server',
    slug: 'scout-monitoring-server',
    npm_package: null,
    github_url: 'https://github.com/scoutapp/scout-mcp-local',
    description:
      'Access Scout Monitoring performance and error data for Rails, Django, FastAPI, and Laravel applications. Debug production issues with AI.',
    install_command: 'npx -y @scoutapp/mcp-server',
    docs_url: 'https://scoutapm.com/docs',
    homepage_url: 'https://scoutapm.com',
    category: 'monitoring',
    capabilities: ['monitoring', 'apm', 'performance', 'errors', 'debugging'],
  },
  {
    name: 'Rootly Server',
    slug: 'rootly-server',
    npm_package: null,
    github_url: 'https://github.com/Rootly-AI-Labs/Rootly-MCP-server',
    description:
      'Manage incidents from your IDE using Rootly API. Pull incidents, metadata, and coordinate incident response.',
    install_command: 'npx -y @rootly/mcp-server',
    docs_url: 'https://docs.rootly.com',
    homepage_url: 'https://rootly.com',
    category: 'monitoring',
    capabilities: ['incidents', 'monitoring', 'on-call', 'incident-management'],
  },
  {
    name: 'Logfire Server',
    slug: 'logfire-server',
    npm_package: null,
    github_url: 'https://github.com/pydantic/logfire-mcp',
    description:
      'Retrieve and analyze OpenTelemetry traces and metrics from Logfire. Debug distributed systems with AI assistance.',
    install_command: 'npx -y @pydantic/logfire-mcp',
    docs_url: 'https://logfire.pydantic.dev/docs',
    homepage_url: 'https://logfire.pydantic.dev',
    category: 'monitoring',
    capabilities: ['observability', 'traces', 'metrics', 'opentelemetry', 'debugging'],
  },

  // Security & Code Analysis
  {
    name: 'Semgrep Server',
    slug: 'semgrep-server',
    npm_package: null,
    github_url: 'https://github.com/semgrep/mcp',
    description:
      'Comprehensive interface to Semgrep for scanning code vulnerabilities, creating custom security rules, and automating code review.',
    install_command: 'npx -y @semgrep/mcp-server',
    docs_url: 'https://semgrep.dev/docs',
    homepage_url: 'https://semgrep.dev',
    category: 'security',
    capabilities: ['security', 'code-analysis', 'sast', 'vulnerabilities', 'rules'],
  },

  // Communication
  {
    name: 'MailPace Server',
    slug: 'mailpace-server',
    npm_package: null,
    github_url: 'https://github.com/mailpace/mailpace-mcp',
    description:
      'Send emails over MailPace transactional email API. Fast, reliable email delivery for applications.',
    install_command: 'npx -y @mailpace/mcp-server',
    docs_url: 'https://docs.mailpace.com',
    homepage_url: 'https://mailpace.com',
    category: 'communication',
    capabilities: ['email', 'transactional', 'smtp', 'communication'],
  },
  {
    name: 'Geekbot Server',
    slug: 'geekbot-server',
    npm_package: null,
    github_url: 'https://github.com/geekbot-com/geekbot-mcp',
    description:
      'Bridges Claude AI with Geekbot standup management tools. Automate and analyze team standups and async communication.',
    install_command: 'npx -y @geekbot/mcp-server',
    docs_url: 'https://geekbot.com/docs',
    homepage_url: 'https://geekbot.com',
    category: 'communication',
    capabilities: ['standups', 'team', 'async', 'slack', 'communication'],
  },

  // Project Management
  {
    name: 'Webvizio Server',
    slug: 'webvizio-server',
    npm_package: null,
    github_url: 'https://github.com/Webvizio/mcp',
    description:
      'Interact with Webvizio projects and development tasks. Access task management, screenshots, and development logs.',
    install_command: 'npx -y @webvizio/mcp-server',
    docs_url: 'https://webvizio.com/docs',
    homepage_url: 'https://webvizio.com',
    category: 'productivity',
    capabilities: ['project-management', 'tasks', 'screenshots', 'development'],
  },
  {
    name: 'Teamwork Server',
    slug: 'teamwork-server',
    npm_package: null,
    github_url: 'https://github.com/Teamwork/mcp',
    description:
      'Official Teamwork.com MCP server. Manage projects, tasks, milestones, and team collaboration.',
    install_command: 'npx -y @teamwork/mcp-server',
    docs_url: 'https://developer.teamwork.com',
    homepage_url: 'https://teamwork.com',
    category: 'productivity',
    capabilities: ['project-management', 'tasks', 'milestones', 'collaboration'],
  },

  // Social Media
  {
    name: 'Reddit Server',
    slug: 'reddit-server',
    npm_package: null,
    github_url: 'https://github.com/adhikasp/mcp-reddit',
    description:
      'Read Reddit posts, hot threads, and subreddit content. Access Reddit data for research and monitoring.',
    install_command: 'npx -y mcp-reddit',
    docs_url: 'https://github.com/adhikasp/mcp-reddit#readme',
    homepage_url: 'https://reddit.com',
    category: 'social',
    capabilities: ['reddit', 'social-media', 'posts', 'community'],
  },
  {
    name: 'Metricool Server',
    slug: 'metricool-server',
    npm_package: null,
    github_url: 'https://github.com/metricool/mcp-metricool',
    description:
      'Social media analytics and management through Metricool. Track metrics, schedule posts, and analyze performance.',
    install_command: 'npx -y @metricool/mcp-server',
    docs_url: 'https://metricool.com/docs',
    homepage_url: 'https://metricool.com',
    category: 'social',
    capabilities: ['social-media', 'analytics', 'scheduling', 'marketing'],
  },

  // Content & Documents
  {
    name: 'DeepWriter Server',
    slug: 'deepwriter-server',
    npm_package: null,
    github_url: 'https://github.com/deepwriter-ai/Deepwriter-MCP',
    description:
      'Tools for creating, managing, and generating content for DeepWriter projects. AI-powered writing assistance.',
    install_command: 'npx -y @deepwriter/mcp-server',
    docs_url: 'https://deepwriter.ai/docs',
    homepage_url: 'https://deepwriter.ai',
    category: 'content',
    capabilities: ['writing', 'content', 'ai-writing', 'documents'],
  },
  {
    name: 'IBM FileNet Server',
    slug: 'ibm-filenet-server',
    npm_package: null,
    github_url: 'https://github.com/ibm-ecm/ibm-content-services-mcp-server',
    description:
      'AI agents interact with IBM FileNet Content Manager for enterprise document and folder management.',
    install_command: 'npx -y @ibm/content-services-mcp-server',
    docs_url: 'https://www.ibm.com/docs/filenet',
    homepage_url: 'https://www.ibm.com/products/filenet-content-manager',
    category: 'content',
    capabilities: ['enterprise', 'documents', 'ecm', 'ibm', 'content-management'],
  },

  // Translation
  {
    name: 'DeepL Server',
    slug: 'deepl-server',
    npm_package: null,
    github_url: 'https://github.com/DeepLcom/deepl-mcp-server',
    description:
      'Translate and rephrase text between numerous languages using the DeepL API. High-quality neural machine translation.',
    install_command: 'npx -y @deepl/mcp-server',
    docs_url: 'https://developers.deepl.com',
    homepage_url: 'https://deepl.com',
    category: 'translation',
    capabilities: ['translation', 'languages', 'deepl', 'localization'],
  },

  // Finance
  {
    name: 'Chargebee Server',
    slug: 'chargebee-server',
    npm_package: '@chargebee/mcp',
    github_url: 'https://github.com/chargebee/agentkit',
    description:
      'MCP Server connecting AI agents to Chargebee Platform for subscription management, billing, and revenue operations.',
    install_command: 'npx -y @chargebee/mcp',
    docs_url: 'https://apidocs.chargebee.com',
    homepage_url: 'https://chargebee.com',
    category: 'finance',
    capabilities: ['billing', 'subscriptions', 'payments', 'saas', 'revenue'],
  },
  {
    name: 'Norman Finance Server',
    slug: 'norman-finance-server',
    npm_package: null,
    github_url: 'https://github.com/norman-finance/norman-mcp-server',
    description:
      'Accounting and tax filing automation for entrepreneurs in Germany. Automate financial operations and compliance.',
    install_command: 'npx -y @norman-finance/mcp-server',
    docs_url: 'https://norman.finance/docs',
    homepage_url: 'https://norman.finance',
    category: 'finance',
    capabilities: ['accounting', 'tax', 'finance', 'germany', 'automation'],
  },

  // Health & Fitness
  {
    name: 'Strava Server',
    slug: 'strava-server',
    npm_package: null,
    github_url: 'https://github.com/yorrickjansen/strava-mcp',
    description:
      'Access Strava fitness data including activities, segments, and leaderboards. Analyze workout and training data.',
    install_command: 'npx -y strava-mcp-server',
    docs_url: 'https://developers.strava.com',
    homepage_url: 'https://strava.com',
    category: 'fitness',
    capabilities: ['fitness', 'strava', 'activities', 'sports', 'tracking'],
  },
  {
    name: 'Intervals.icu Server',
    slug: 'intervals-icu-server',
    npm_package: null,
    github_url: 'https://github.com/mvilanova/intervals-mcp-server',
    description:
      'Connect Claude with Intervals.icu API for fitness data including activities, workouts, and training analytics.',
    install_command: 'npx -y intervals-mcp-server',
    docs_url: 'https://intervals.icu/api',
    homepage_url: 'https://intervals.icu',
    category: 'fitness',
    capabilities: ['fitness', 'training', 'cycling', 'analytics', 'workouts'],
  },

  // Developer Tools
  {
    name: 'Requestly Server',
    slug: 'requestly-server',
    npm_package: null,
    github_url: 'https://github.com/requestly/mcp',
    description:
      'Full CRUD operations for Requestly rules and groups. Manage HTTP request interception rules for API testing and debugging.',
    install_command: 'npx -y @requestly/mcp-server',
    docs_url: 'https://docs.requestly.io',
    homepage_url: 'https://requestly.io',
    category: 'development',
    capabilities: ['api-testing', 'http', 'debugging', 'mocking', 'rules'],
  },
  {
    name: 'VChart Server',
    slug: 'vchart-server',
    npm_package: null,
    github_url: 'https://github.com/VisActor/vchart-mcp-server',
    description:
      'Enable AI assistants to generate interactive charts and data visualizations using the VChart library.',
    install_command: 'npx -y @visactor/vchart-mcp-server',
    docs_url: 'https://visactor.io/vchart',
    homepage_url: 'https://visactor.io',
    category: 'development',
    capabilities: ['charts', 'visualization', 'data-viz', 'graphics'],
  },

  // 3D & Creative Tools
  {
    name: 'BlenderMCP Server',
    slug: 'blender-mcp',
    npm_package: null,
    github_url: 'https://github.com/ahujasid/blender-mcp',
    description:
      'Connects Blender to Claude AI for prompt-assisted 3D modeling, scene creation, and manipulation. Create, modify, and delete 3D objects, apply materials, execute Python code in Blender, and download assets from Poly Haven and Sketchfab.',
    install_command: 'uvx blender-mcp',
    docs_url: 'https://github.com/ahujasid/blender-mcp#readme',
    homepage_url: 'https://blender.org',
    category: '3d',
    capabilities: ['3d-modeling', 'blender', 'creative', 'python', 'assets'],
  },
  {
    name: 'Unity MCP Server',
    slug: 'unity-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Unity game engine integration for MCP. Control Unity scenes, create game objects, and manipulate game state through AI assistants.',
    install_command: 'npx -y @anthropic/unity-mcp-server',
    docs_url: 'https://unity.com/docs',
    homepage_url: 'https://unity.com',
    category: '3d',
    capabilities: ['unity', 'game-development', '3d', 'game-engine'],
  },

  // Additional Popular Tools
  {
    name: 'Docker MCP Server',
    slug: 'docker-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Docker container management for MCP. List, start, stop, and manage Docker containers and images through AI assistants.',
    install_command: 'npx -y @anthropic/docker-mcp-server',
    docs_url: 'https://docs.docker.com',
    homepage_url: 'https://docker.com',
    category: 'development',
    capabilities: ['docker', 'containers', 'devops', 'deployment'],
  },
  {
    name: 'Kubernetes MCP Server',
    slug: 'kubernetes-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Kubernetes cluster management for MCP. Deploy, scale, and manage Kubernetes resources through AI assistants.',
    install_command: 'npx -y @anthropic/kubernetes-mcp-server',
    docs_url: 'https://kubernetes.io/docs',
    homepage_url: 'https://kubernetes.io',
    category: 'cloud',
    capabilities: ['kubernetes', 'k8s', 'containers', 'orchestration', 'devops'],
  },
  {
    name: 'Figma MCP Server',
    slug: 'figma-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Figma design integration for MCP. Access Figma files, components, and design tokens through AI assistants.',
    install_command: 'npx -y @anthropic/figma-mcp-server',
    docs_url: 'https://www.figma.com/developers',
    homepage_url: 'https://figma.com',
    category: 'design',
    capabilities: ['figma', 'design', 'ui', 'components', 'design-tokens'],
  },
  {
    name: 'Jira MCP Server',
    slug: 'jira-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Jira project management integration for MCP. Create, update, and manage Jira issues, sprints, and boards.',
    install_command: 'npx -y @anthropic/jira-mcp-server',
    docs_url: 'https://developer.atlassian.com/cloud/jira',
    homepage_url: 'https://www.atlassian.com/software/jira',
    category: 'productivity',
    capabilities: ['jira', 'issues', 'agile', 'project-management', 'atlassian'],
  },
  {
    name: 'Confluence MCP Server',
    slug: 'confluence-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Confluence wiki integration for MCP. Create, read, and update Confluence pages and spaces.',
    install_command: 'npx -y @anthropic/confluence-mcp-server',
    docs_url: 'https://developer.atlassian.com/cloud/confluence',
    homepage_url: 'https://www.atlassian.com/software/confluence',
    category: 'productivity',
    capabilities: ['confluence', 'wiki', 'documentation', 'atlassian', 'knowledge-base'],
  },
  {
    name: 'Airtable MCP Server',
    slug: 'airtable-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Airtable database integration for MCP. Query, create, and update Airtable bases, tables, and records.',
    install_command: 'npx -y @anthropic/airtable-mcp-server',
    docs_url: 'https://airtable.com/developers',
    homepage_url: 'https://airtable.com',
    category: 'database',
    capabilities: ['airtable', 'database', 'spreadsheet', 'no-code'],
  },
  {
    name: 'Supabase MCP Server',
    slug: 'supabase-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Supabase backend integration for MCP. Manage databases, authentication, storage, and edge functions through AI.',
    install_command: 'npx -y @anthropic/supabase-mcp-server',
    docs_url: 'https://supabase.com/docs',
    homepage_url: 'https://supabase.com',
    category: 'database',
    capabilities: ['supabase', 'postgres', 'auth', 'storage', 'realtime'],
  },
  {
    name: 'Vercel MCP Server',
    slug: 'vercel-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Vercel deployment platform integration for MCP. Deploy, manage, and monitor Vercel projects and deployments.',
    install_command: 'npx -y @anthropic/vercel-mcp-server',
    docs_url: 'https://vercel.com/docs',
    homepage_url: 'https://vercel.com',
    category: 'cloud',
    capabilities: ['vercel', 'deployment', 'hosting', 'serverless', 'edge'],
  },
  {
    name: 'Cloudflare MCP Server',
    slug: 'cloudflare-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Cloudflare integration for MCP. Manage Workers, Pages, R2 storage, D1 databases, and DNS through AI.',
    install_command: 'npx -y @anthropic/cloudflare-mcp-server',
    docs_url: 'https://developers.cloudflare.com',
    homepage_url: 'https://cloudflare.com',
    category: 'cloud',
    capabilities: ['cloudflare', 'workers', 'edge', 'cdn', 'dns'],
  },
  {
    name: 'OpenAI MCP Server',
    slug: 'openai-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'OpenAI API integration for MCP. Access GPT models, DALL-E, Whisper, and other OpenAI services.',
    install_command: 'npx -y @anthropic/openai-mcp-server',
    docs_url: 'https://platform.openai.com/docs',
    homepage_url: 'https://openai.com',
    category: 'ai',
    capabilities: ['openai', 'gpt', 'dalle', 'whisper', 'embeddings'],
  },
  {
    name: 'Anthropic MCP Server',
    slug: 'anthropic-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Anthropic Claude API integration for MCP. Access Claude models for text generation, analysis, and reasoning.',
    install_command: 'npx -y @anthropic/anthropic-mcp-server',
    docs_url: 'https://docs.anthropic.com',
    homepage_url: 'https://anthropic.com',
    category: 'ai',
    capabilities: ['anthropic', 'claude', 'llm', 'reasoning', 'analysis'],
  },
  {
    name: 'HuggingFace MCP Server',
    slug: 'huggingface-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Hugging Face integration for MCP. Access models, datasets, and spaces on the Hugging Face Hub.',
    install_command: 'npx -y @anthropic/huggingface-mcp-server',
    docs_url: 'https://huggingface.co/docs',
    homepage_url: 'https://huggingface.co',
    category: 'ai',
    capabilities: ['huggingface', 'models', 'datasets', 'transformers', 'ml'],
  },
  {
    name: 'Twilio MCP Server',
    slug: 'twilio-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Twilio communication integration for MCP. Send SMS, make calls, and manage communications through AI.',
    install_command: 'npx -y @anthropic/twilio-mcp-server',
    docs_url: 'https://www.twilio.com/docs',
    homepage_url: 'https://twilio.com',
    category: 'communication',
    capabilities: ['twilio', 'sms', 'voice', 'phone', 'communication'],
  },
  {
    name: 'Stripe MCP Server',
    slug: 'stripe-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Stripe payments integration for MCP. Manage payments, subscriptions, invoices, and customers through AI.',
    install_command: 'npx -y @anthropic/stripe-mcp-server',
    docs_url: 'https://stripe.com/docs',
    homepage_url: 'https://stripe.com',
    category: 'finance',
    capabilities: ['stripe', 'payments', 'subscriptions', 'invoices', 'checkout'],
  },
  {
    name: 'AWS MCP Server',
    slug: 'aws-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'AWS cloud services integration for MCP. Manage S3, Lambda, EC2, and other AWS services through AI.',
    install_command: 'npx -y @anthropic/aws-mcp-server',
    docs_url: 'https://docs.aws.amazon.com',
    homepage_url: 'https://aws.amazon.com',
    category: 'cloud',
    capabilities: ['aws', 's3', 'lambda', 'ec2', 'cloud'],
  },
  {
    name: 'Google Cloud MCP Server',
    slug: 'gcp-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Google Cloud Platform integration for MCP. Manage GCS, Cloud Functions, BigQuery, and more through AI.',
    install_command: 'npx -y @anthropic/gcp-mcp-server',
    docs_url: 'https://cloud.google.com/docs',
    homepage_url: 'https://cloud.google.com',
    category: 'cloud',
    capabilities: ['gcp', 'bigquery', 'cloud-functions', 'gcs', 'google-cloud'],
  },
  {
    name: 'Azure MCP Server',
    slug: 'azure-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Microsoft Azure integration for MCP. Manage Azure services, resources, and deployments through AI.',
    install_command: 'npx -y @anthropic/azure-mcp-server',
    docs_url: 'https://docs.microsoft.com/azure',
    homepage_url: 'https://azure.microsoft.com',
    category: 'cloud',
    capabilities: ['azure', 'microsoft', 'cloud', 'devops', 'functions'],
  },
  {
    name: 'Discord MCP Server',
    slug: 'discord-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Discord integration for MCP. Send messages, manage servers, and interact with Discord communities.',
    install_command: 'npx -y @anthropic/discord-mcp-server',
    docs_url: 'https://discord.com/developers/docs',
    homepage_url: 'https://discord.com',
    category: 'communication',
    capabilities: ['discord', 'chat', 'community', 'bots', 'messaging'],
  },
  {
    name: 'Telegram MCP Server',
    slug: 'telegram-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Telegram messaging integration for MCP. Send messages, manage bots, and interact with Telegram chats.',
    install_command: 'npx -y @anthropic/telegram-mcp-server',
    docs_url: 'https://core.telegram.org/bots/api',
    homepage_url: 'https://telegram.org',
    category: 'communication',
    capabilities: ['telegram', 'messaging', 'bots', 'chat'],
  },
  {
    name: 'Spotify MCP Server',
    slug: 'spotify-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Spotify music integration for MCP. Control playback, manage playlists, and search music through AI.',
    install_command: 'npx -y @anthropic/spotify-mcp-server',
    docs_url: 'https://developer.spotify.com/documentation',
    homepage_url: 'https://spotify.com',
    category: 'media',
    capabilities: ['spotify', 'music', 'playlists', 'streaming', 'audio'],
  },
  {
    name: 'YouTube MCP Server',
    slug: 'youtube-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'YouTube integration for MCP. Search videos, manage playlists, and access video metadata.',
    install_command: 'npx -y @anthropic/youtube-mcp-server',
    docs_url: 'https://developers.google.com/youtube',
    homepage_url: 'https://youtube.com',
    category: 'media',
    capabilities: ['youtube', 'video', 'streaming', 'playlists', 'google'],
  },
  {
    name: 'Twitter/X MCP Server',
    slug: 'twitter-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Twitter/X integration for MCP. Post tweets, search, and interact with the Twitter API.',
    install_command: 'npx -y @anthropic/twitter-mcp-server',
    docs_url: 'https://developer.twitter.com/docs',
    homepage_url: 'https://twitter.com',
    category: 'social',
    capabilities: ['twitter', 'x', 'social-media', 'posts', 'api'],
  },
  {
    name: 'LinkedIn MCP Server',
    slug: 'linkedin-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'LinkedIn professional network integration for MCP. Manage profiles, posts, and professional connections.',
    install_command: 'npx -y @anthropic/linkedin-mcp-server',
    docs_url: 'https://developer.linkedin.com',
    homepage_url: 'https://linkedin.com',
    category: 'social',
    capabilities: ['linkedin', 'professional', 'networking', 'jobs', 'social'],
  },
  {
    name: 'Zapier MCP Server',
    slug: 'zapier-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Zapier automation integration for MCP. Trigger zaps, manage workflows, and connect 5000+ apps.',
    install_command: 'npx -y @anthropic/zapier-mcp-server',
    docs_url: 'https://zapier.com/developer',
    homepage_url: 'https://zapier.com',
    category: 'automation',
    capabilities: ['zapier', 'automation', 'workflows', 'integrations', 'no-code'],
  },
  {
    name: 'Make (Integromat) MCP Server',
    slug: 'make-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'Make (formerly Integromat) automation integration for MCP. Build and trigger complex automation scenarios.',
    install_command: 'npx -y @anthropic/make-mcp-server',
    docs_url: 'https://www.make.com/en/api-documentation',
    homepage_url: 'https://make.com',
    category: 'automation',
    capabilities: ['make', 'integromat', 'automation', 'workflows', 'scenarios'],
  },
  {
    name: 'n8n MCP Server',
    slug: 'n8n-mcp',
    npm_package: null,
    github_url: 'https://github.com/anthropics/mcp-servers',
    description:
      'n8n workflow automation integration for MCP. Self-hosted workflow automation with AI integration.',
    install_command: 'npx -y @anthropic/n8n-mcp-server',
    docs_url: 'https://docs.n8n.io',
    homepage_url: 'https://n8n.io',
    category: 'automation',
    capabilities: ['n8n', 'automation', 'workflows', 'self-hosted', 'integrations'],
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

  // New capabilities from Glama.ai servers
  { name: 'spreadsheet', category: 'database', description: 'Spreadsheet/table data management' },
  { name: 'data-management', category: 'database', description: 'Data management operations' },
  { name: 'elasticsearch', category: 'database', description: 'Elasticsearch search engine' },
  { name: 'indexing', category: 'database', description: 'Data indexing capabilities' },
  { name: 'timeseries', category: 'database', description: 'Time-series data support' },
  { name: 'serverless', category: 'cloud', description: 'Serverless infrastructure' },
  { name: 'alibaba', category: 'cloud', description: 'Alibaba Cloud services' },
  { name: 'mysql', category: 'database', description: 'MySQL database support' },
  { name: 'premium-search', category: 'search', description: 'Premium search services' },
  { name: 'seo', category: 'search', description: 'Search engine optimization' },
  { name: 'keywords', category: 'search', description: 'Keyword research and analysis' },
  { name: 'serp', category: 'search', description: 'Search engine results pages' },
  { name: 'news', category: 'search', description: 'News search and aggregation' },
  { name: 'images', category: 'search', description: 'Image search capabilities' },
  { name: 'profiles', category: 'automation', description: 'Browser profile management' },
  { name: 'fingerprinting', category: 'automation', description: 'Browser fingerprint management' },
  { name: 'markdown', category: 'scraping', description: 'Markdown conversion' },
  { name: 'web-extraction', category: 'scraping', description: 'Web content extraction' },
  { name: 'content', category: 'scraping', description: 'Content processing' },
  { name: 'proxy', category: 'scraping', description: 'Proxy rotation support' },
  { name: 'enterprise', category: 'scraping', description: 'Enterprise-grade features' },
  { name: 'screenshots', category: 'scraping', description: 'Screenshot capture' },
  { name: 'web-capture', category: 'scraping', description: 'Web page capture' },
  { name: 'visual', category: 'scraping', description: 'Visual content processing' },
  { name: 'blockchain', category: 'blockchain', description: 'Blockchain technology' },
  { name: 'ethereum', category: 'blockchain', description: 'Ethereum blockchain' },
  { name: 'nft', category: 'blockchain', description: 'NFT/Non-fungible tokens' },
  { name: 'tokens', category: 'blockchain', description: 'Cryptocurrency tokens' },
  { name: 'web3', category: 'blockchain', description: 'Web3 technologies' },
  { name: 'near', category: 'blockchain', description: 'NEAR Protocol' },
  { name: 'smart-contracts', category: 'blockchain', description: 'Smart contract interaction' },
  { name: 'bitcoin', category: 'blockchain', description: 'Bitcoin blockchain' },
  { name: 'ordinals', category: 'blockchain', description: 'Bitcoin ordinals/inscriptions' },
  { name: 'transactions', category: 'blockchain', description: 'Transaction processing' },
  { name: 'stamps', category: 'blockchain', description: 'Bitcoin stamps protocol' },
  { name: 'on-chain-data', category: 'blockchain', description: 'On-chain data storage' },
  { name: 'research', category: 'research', description: 'Research capabilities' },
  { name: 'papers', category: 'research', description: 'Academic papers access' },
  { name: 'arxiv', category: 'research', description: 'arXiv.org integration' },
  { name: 'academic', category: 'research', description: 'Academic resources' },
  { name: 'pdf', category: 'research', description: 'PDF document handling' },
  { name: 'biomedical', category: 'research', description: 'Biomedical data access' },
  { name: 'clinical-trials', category: 'research', description: 'Clinical trials data' },
  { name: 'genomics', category: 'research', description: 'Genomics and genetics' },
  { name: 'medical', category: 'research', description: 'Medical information' },
  { name: 'lab-notebook', category: 'research', description: 'Electronic lab notebooks' },
  { name: 'science', category: 'research', description: 'Scientific research' },
  { name: 'finance', category: 'finance', description: 'Financial services' },
  { name: 'stocks', category: 'finance', description: 'Stock market data' },
  { name: 'market-data', category: 'finance', description: 'Market data access' },
  { name: 'speech', category: 'ai', description: 'Speech synthesis' },
  { name: 'voice-cloning', category: 'ai', description: 'Voice cloning technology' },
  { name: 'video', category: 'ai', description: 'Video generation' },
  { name: 'personalization', category: 'ai', description: 'Personalization features' },
  { name: 'preferences', category: 'ai', description: 'User preference management' },
  { name: 'semantic-search', category: 'ai', description: 'Semantic search capabilities' },
  { name: 'genkit', category: 'ai', description: 'Firebase Genkit framework' },
  { name: 'ml', category: 'ai', description: 'Machine learning' },
  { name: 'heroku', category: 'cloud', description: 'Heroku platform' },
  { name: 'deployment', category: 'cloud', description: 'Application deployment' },
  { name: 'paas', category: 'cloud', description: 'Platform as a Service' },
  { name: 'hosting', category: 'cloud', description: 'Web hosting services' },
  { name: 'service-discovery', category: 'cloud', description: 'Service discovery' },
  { name: 'configuration', category: 'cloud', description: 'Configuration management' },
  { name: 'microservices', category: 'cloud', description: 'Microservices architecture' },
  { name: 'cdn', category: 'cloud', description: 'Content delivery network' },
  { name: 'media', category: 'cloud', description: 'Media processing' },
  { name: 'china', category: 'cloud', description: 'China cloud services' },
  { name: 'apm', category: 'monitoring', description: 'Application performance monitoring' },
  { name: 'performance', category: 'monitoring', description: 'Performance monitoring' },
  { name: 'incidents', category: 'monitoring', description: 'Incident management' },
  { name: 'on-call', category: 'monitoring', description: 'On-call management' },
  { name: 'incident-management', category: 'monitoring', description: 'Incident response' },
  { name: 'traces', category: 'monitoring', description: 'Distributed tracing' },
  { name: 'opentelemetry', category: 'monitoring', description: 'OpenTelemetry support' },
  { name: 'security', category: 'security', description: 'Security features' },
  { name: 'code-analysis', category: 'security', description: 'Code analysis tools' },
  { name: 'sast', category: 'security', description: 'Static application security testing' },
  { name: 'vulnerabilities', category: 'security', description: 'Vulnerability detection' },
  { name: 'rules', category: 'security', description: 'Security rules' },
  { name: 'transactional', category: 'communication', description: 'Transactional messaging' },
  { name: 'smtp', category: 'communication', description: 'SMTP email protocol' },
  { name: 'standups', category: 'communication', description: 'Standup meetings' },
  { name: 'team', category: 'communication', description: 'Team collaboration' },
  { name: 'async', category: 'communication', description: 'Asynchronous communication' },
  { name: 'project-management', category: 'productivity', description: 'Project management' },
  { name: 'tasks', category: 'productivity', description: 'Task management' },
  { name: 'development', category: 'productivity', description: 'Development workflow' },
  { name: 'milestones', category: 'productivity', description: 'Milestone tracking' },
  { name: 'collaboration', category: 'productivity', description: 'Team collaboration' },
  { name: 'reddit', category: 'social', description: 'Reddit integration' },
  { name: 'social-media', category: 'social', description: 'Social media platforms' },
  { name: 'posts', category: 'social', description: 'Social posts management' },
  { name: 'community', category: 'social', description: 'Community engagement' },
  { name: 'scheduling', category: 'social', description: 'Content scheduling' },
  { name: 'marketing', category: 'social', description: 'Marketing tools' },
  { name: 'writing', category: 'content', description: 'Writing assistance' },
  { name: 'ai-writing', category: 'content', description: 'AI-powered writing' },
  { name: 'ecm', category: 'content', description: 'Enterprise content management' },
  { name: 'content-management', category: 'content', description: 'Content management systems' },
  { name: 'translation', category: 'translation', description: 'Language translation' },
  { name: 'languages', category: 'translation', description: 'Multi-language support' },
  { name: 'localization', category: 'translation', description: 'Content localization' },
  { name: 'billing', category: 'finance', description: 'Billing systems' },
  { name: 'subscriptions', category: 'finance', description: 'Subscription management' },
  { name: 'payments', category: 'finance', description: 'Payment processing' },
  { name: 'saas', category: 'finance', description: 'SaaS business tools' },
  { name: 'revenue', category: 'finance', description: 'Revenue operations' },
  { name: 'accounting', category: 'finance', description: 'Accounting tools' },
  { name: 'tax', category: 'finance', description: 'Tax management' },
  { name: 'germany', category: 'finance', description: 'Germany-specific services' },
  { name: 'fitness', category: 'fitness', description: 'Fitness tracking' },
  { name: 'strava', category: 'fitness', description: 'Strava integration' },
  { name: 'activities', category: 'fitness', description: 'Activity tracking' },
  { name: 'sports', category: 'fitness', description: 'Sports analytics' },
  { name: 'training', category: 'fitness', description: 'Training analytics' },
  { name: 'cycling', category: 'fitness', description: 'Cycling data' },
  { name: 'workouts', category: 'fitness', description: 'Workout management' },
  { name: 'api-testing', category: 'development', description: 'API testing tools' },
  { name: 'mocking', category: 'development', description: 'API mocking' },
  { name: 'charts', category: 'development', description: 'Chart generation' },
  { name: 'data-viz', category: 'development', description: 'Data visualization' },
  { name: 'graphics', category: 'development', description: 'Graphics generation' },
  { name: 'scraping', category: 'scraping', description: 'Web scraping' },
  { name: 'observability', category: 'monitoring', description: 'System observability' },
  { name: 'kagi', category: 'search', description: 'Kagi search engine' },
  { name: 'nacos', category: 'cloud', description: 'Nacos service' },
  { name: 'qiniu', category: 'cloud', description: 'Qiniu cloud services' },
  { name: 'deepl', category: 'translation', description: 'DeepL translation' },
  { name: 'ibm', category: 'content', description: 'IBM services' },
  { name: 'memory', category: 'ai', description: 'Memory management for AI' },
  { name: 'context', category: 'ai', description: 'Context management' },

  // 3D & Creative
  { name: '3d-modeling', category: '3d', description: '3D modeling capabilities' },
  { name: 'blender', category: '3d', description: 'Blender 3D software' },
  { name: 'assets', category: '3d', description: '3D asset management' },
  { name: 'unity', category: '3d', description: 'Unity game engine' },
  { name: 'game-development', category: '3d', description: 'Game development tools' },
  { name: '3d', category: '3d', description: '3D graphics' },
  { name: 'game-engine', category: '3d', description: 'Game engine integration' },

  // DevOps & Containers
  { name: 'docker', category: 'development', description: 'Docker containers' },
  { name: 'containers', category: 'development', description: 'Container management' },
  { name: 'devops', category: 'development', description: 'DevOps tools' },
  { name: 'kubernetes', category: 'cloud', description: 'Kubernetes orchestration' },
  { name: 'k8s', category: 'cloud', description: 'Kubernetes shorthand' },
  { name: 'orchestration', category: 'cloud', description: 'Container orchestration' },

  // Design
  { name: 'figma', category: 'design', description: 'Figma design tool' },
  { name: 'design', category: 'design', description: 'Design tools' },
  { name: 'ui', category: 'design', description: 'UI design' },
  { name: 'components', category: 'design', description: 'UI components' },
  { name: 'design-tokens', category: 'design', description: 'Design tokens' },

  // Atlassian
  { name: 'jira', category: 'productivity', description: 'Jira project management' },
  { name: 'agile', category: 'productivity', description: 'Agile methodologies' },
  { name: 'atlassian', category: 'productivity', description: 'Atlassian products' },
  { name: 'confluence', category: 'productivity', description: 'Confluence wiki' },

  // Databases
  { name: 'airtable', category: 'database', description: 'Airtable database' },
  { name: 'no-code', category: 'database', description: 'No-code tools' },
  { name: 'supabase', category: 'database', description: 'Supabase platform' },
  { name: 'auth', category: 'database', description: 'Authentication' },
  { name: 'realtime', category: 'database', description: 'Real-time features' },

  // Cloud Platforms
  { name: 'vercel', category: 'cloud', description: 'Vercel platform' },
  { name: 'edge', category: 'cloud', description: 'Edge computing' },
  { name: 'cloudflare', category: 'cloud', description: 'Cloudflare services' },
  { name: 'workers', category: 'cloud', description: 'Cloudflare Workers' },
  { name: 'dns', category: 'cloud', description: 'DNS management' },
  { name: 's3', category: 'cloud', description: 'AWS S3 storage' },
  { name: 'lambda', category: 'cloud', description: 'AWS Lambda functions' },
  { name: 'ec2', category: 'cloud', description: 'AWS EC2 instances' },
  { name: 'gcp', category: 'cloud', description: 'Google Cloud Platform' },
  { name: 'bigquery', category: 'cloud', description: 'Google BigQuery' },
  { name: 'cloud-functions', category: 'cloud', description: 'Cloud Functions' },
  { name: 'gcs', category: 'cloud', description: 'Google Cloud Storage' },
  { name: 'google-cloud', category: 'cloud', description: 'Google Cloud' },
  { name: 'azure', category: 'cloud', description: 'Microsoft Azure' },
  { name: 'microsoft', category: 'cloud', description: 'Microsoft services' },
  { name: 'functions', category: 'cloud', description: 'Serverless functions' },

  // AI Providers
  { name: 'openai', category: 'ai', description: 'OpenAI services' },
  { name: 'gpt', category: 'ai', description: 'GPT models' },
  { name: 'dalle', category: 'ai', description: 'DALL-E image generation' },
  { name: 'whisper', category: 'ai', description: 'Whisper speech recognition' },
  { name: 'anthropic', category: 'ai', description: 'Anthropic AI' },
  { name: 'claude', category: 'ai', description: 'Claude AI' },
  { name: 'llm', category: 'ai', description: 'Large language models' },
  { name: 'analysis', category: 'ai', description: 'AI analysis' },
  { name: 'huggingface', category: 'ai', description: 'Hugging Face' },
  { name: 'models', category: 'ai', description: 'AI models' },
  { name: 'transformers', category: 'ai', description: 'Transformer models' },

  // Communication
  { name: 'twilio', category: 'communication', description: 'Twilio services' },
  { name: 'sms', category: 'communication', description: 'SMS messaging' },
  { name: 'voice', category: 'communication', description: 'Voice calls' },
  { name: 'phone', category: 'communication', description: 'Phone services' },
  { name: 'discord', category: 'communication', description: 'Discord platform' },
  { name: 'chat', category: 'communication', description: 'Chat messaging' },
  { name: 'bots', category: 'communication', description: 'Bot automation' },
  { name: 'telegram', category: 'communication', description: 'Telegram messenger' },

  // Finance
  { name: 'stripe', category: 'finance', description: 'Stripe payments' },
  { name: 'invoices', category: 'finance', description: 'Invoice management' },
  { name: 'checkout', category: 'finance', description: 'Checkout process' },

  // Media
  { name: 'spotify', category: 'media', description: 'Spotify music' },
  { name: 'music', category: 'media', description: 'Music services' },
  { name: 'audio', category: 'media', description: 'Audio processing' },
  { name: 'streaming', category: 'media', description: 'Streaming services' },
  { name: 'youtube', category: 'media', description: 'YouTube platform' },

  // Social
  { name: 'twitter', category: 'social', description: 'Twitter/X platform' },
  { name: 'x', category: 'social', description: 'X (Twitter)' },
  { name: 'linkedin', category: 'social', description: 'LinkedIn network' },
  { name: 'professional', category: 'social', description: 'Professional networking' },
  { name: 'networking', category: 'social', description: 'Social networking' },
  { name: 'jobs', category: 'social', description: 'Job listings' },

  // Automation
  { name: 'zapier', category: 'automation', description: 'Zapier automation' },
  { name: 'integrations', category: 'automation', description: 'App integrations' },
  { name: 'make', category: 'automation', description: 'Make (Integromat)' },
  { name: 'integromat', category: 'automation', description: 'Integromat automation' },
  { name: 'scenarios', category: 'automation', description: 'Automation scenarios' },
  { name: 'n8n', category: 'automation', description: 'n8n automation' },
  { name: 'self-hosted', category: 'automation', description: 'Self-hosted solutions' },
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
