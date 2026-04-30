# Security Policy

## Reporting a vulnerability

Report security issues privately to the maintainers via the GitHub Security
Advisory tab on this repository before public disclosure. We aim to acknowledge
within 72 hours.

## Threat model

mcp-discovery is a **metadata index**. The service stores and serves
descriptions of MCP servers (name, description, category, capabilities,
`install_command` string, GitHub/NPM links, latency/uptime metrics). It does
not execute install commands and does not run any code from the indexed
servers. The official LangChain integration (`langchain/mcp_discovery_tool.py`)
also displays install commands as text — it never invokes them.

Whether to install or run a discovered server is a decision made by the
**client** (the agent or the human operator), not by mcp-discovery. The same
trust boundary applies to MCP server registries that mcp-discovery indexes
(Glama.ai, NPM, GitHub).

### What this means for callers

- Treat `install_command` and `github_url` fields as **untrusted user input**.
  They originate from third-party registries and repositories.
- Pin versions when running discovered servers (`npx -y package@1.2.3`,
  not `npx -y package`) so a later registry compromise cannot silently
  change what your agent installs.
- Run discovered MCP servers in the same sandbox you would apply to any
  third-party code: separate user, restricted filesystem access, no
  unnecessary network egress, no access to host secrets.
- Prefer servers with `is_verified: true` and a high `trust_score` for
  unattended/agent-driven installs.

## How the index is populated

The index is built from three sources via the scripts in `scripts/`:

| Source            | Script                          | Notes                                          |
|-------------------|---------------------------------|------------------------------------------------|
| Glama.ai          | `scrape-glama.ts`, `scrape-glama-api.ts` | Public registry, filtered by listing visibility |
| NPM Registry      | `scrape-all-platforms.ts`       | Filtered by `mcp` / `model-context-protocol` keywords |
| GitHub            | `scrape-all-platforms.ts`       | Public repos with MCP-related topics           |

Each source contributes raw metadata; embeddings for semantic search are
generated separately by `generate-embeddings.ts`. The seed lists in
`scripts/seed-data.ts` and `scripts/seed-data-massive.ts` are
maintainer-curated and are the entries displayed first for verified servers.

The index does not clone, install, or execute any of the servers it discovers.

## Filtering and skipping servers

The discovery API and SDK accept an `exclude_servers` parameter for
client-side allow/deny lists.

### Direct API call

```bash
curl -X POST https://mcp-discovery-two.vercel.app/api/v1/discover \
  -H "Content-Type: application/json" \
  -d '{
    "query": "database access",
    "limit": 5,
    "exclude_servers": ["some-slug", "another-slug"]
  }'
```

### LangChain tool

```python
from langchain.mcp_discovery_tool import MCPDiscoveryTool

tool = MCPDiscoveryTool(exclude_servers=["some-slug"])
```

Recommended use cases:

- **Allowlist mode**: discover broadly, then filter the response to the slugs
  your organization has reviewed.
- **Denylist mode**: drop known-problematic or duplicate servers from results.
- **Per-tenant policy**: pass a different `exclude_servers` list per
  agent/user to enforce different installation policies.

For a server-side `include_only` filter or category-based policy, open an
issue — the schema in `src/db/agent-tools-schema.sql` already supports
`filter_category` / `filter_protocol` columns and we can expose them on the
public API.
