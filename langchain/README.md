# MCP Discovery Tool for LangChain

A LangChain tool that enables agents to dynamically discover Model Context Protocol (MCP) servers based on their task requirements.

> **Last Updated:** February 2, 2026  
> **Related:** [AutoGPT Integration #11793](https://github.com/Significant-Gravitas/AutoGPT/issues/11793)

## Overview

The MCP Discovery tool provides semantic search over **14,000+ indexed MCP servers**, allowing LangChain agents to:

- 🔍 **Discover tools dynamically** based on natural language queries
- 📊 **Compare performance metrics** (latency, uptime) before selecting servers
- 📦 **Get installation commands** automatically
- 🎯 **Match capabilities** to task requirements with semantic understanding

## Installation

```bash
pip install langchain langchain-core requests
```

## Quick Start

```python
from mcp_discovery_tool import create_mcp_discovery_tool
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain import hub

# Create the discovery tool
discovery_tool = create_mcp_discovery_tool()

# Use it directly
result = discovery_tool.run("I need to query a PostgreSQL database")
print(result)

# Or integrate with an agent
llm = ChatOpenAI(model="gpt-4", temperature=0)
tools = [discovery_tool]
prompt = hub.pull("hwchase17/react")

agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

response = agent_executor.invoke({
    "input": "Find me the best email server with low latency"
})
```

## Features

### Semantic Search

The tool understands natural language queries about capabilities:

```python
# All of these work
discovery_tool.run("database access")
discovery_tool.run("I need to send emails")
discovery_tool.run("file system operations")
discovery_tool.run("weather API")
```

### Performance Metrics

Get real-time performance data for informed decisions:

```python
# Returns metrics like:
# - Average latency (ms)
# - Uptime percentage
# - Match score for relevance
```

### Installation Info

Each result includes ready-to-use installation commands:

```python
# Example output:
# Install: npx @modelcontextprotocol/create-server postgres
```

## Use Cases

### 1. Dynamic Toolset Adaptation

Agents can expand their capabilities based on task needs:

```python
response = agent_executor.invoke({
    "input": "I need to process images. Find me the right tool and use it."
})
```

### 2. Performance-Based Selection

Choose servers based on performance requirements:

```python
response = agent_executor.invoke({
    "input": "Find the fastest database MCP server available"
})
```

### 3. Multi-Step Workflows

Discover multiple tools for complex workflows:

```python
response = agent_executor.invoke({
    "input": """
    I need to:
    1. Fetch data from a database
    2. Process it with file operations
    3. Send results via email
    
    What MCP servers should I use?
    """
})
```

## API Reference

### MCPDiscoveryTool

Main tool class for MCP server discovery.

**Parameters:**
- `api_url` (str, optional): Custom API endpoint. Defaults to production server.

**Methods:**
- `run(query: str) -> str`: Execute discovery query synchronously
- `arun(query: str) -> str`: Execute discovery query asynchronously

### create_mcp_discovery_tool

Factory function for creating tool instances.

```python
tool = create_mcp_discovery_tool(
    api_url="https://custom-endpoint.example.com"  # optional
)
```

## Examples

See [examples.ipynb](examples.ipynb) for comprehensive examples including:

- Basic usage
- Agent integration
- Performance-based selection
- Error handling
- Multi-step workflows
- Custom API endpoints

## How It Works

1. **Query**: Agent provides natural language description of needed capability
2. **Search**: MCP Discovery API performs semantic search across indexed servers
3. **Rank**: Results are ranked by relevance, performance, and popularity
4. **Return**: Formatted results with installation info and metrics

## MCP Discovery API

This tool connects to the [MCP Discovery API](https://github.com/yksanjo/mcp-discovery), which indexes and provides semantic search over:

- **14,000+ MCP servers** - The world's largest index
- Real-time performance metrics
- Server metadata and documentation
- Installation instructions

**Production API:** https://mcp-discovery-two.vercel.app

## Error Handling

The tool gracefully handles common error scenarios:

```python
# No results found
result = discovery_tool.run("nonexistent capability")
# Returns: "No MCP servers found matching: 'nonexistent capability'"

# API timeout
# Returns: "MCP Discovery API request timed out. Please try again."

# Network errors
# Returns: "Error connecting to MCP Discovery API: [details]"
```

## Contributing

Contributions welcome! Areas for improvement:

- Add async HTTP support with `aiohttp`
- Cache frequently queried results
- Add more detailed error messages
- Support for filtering by server capabilities
- Integration tests with mock API

## Resources

- **MCP Discovery GitHub**: https://github.com/yksanjo/mcp-discovery
- **MCP Discovery npm**: https://www.npmjs.com/package/mcp-discovery-api
- **MCP Registry**: https://github.com/mcp
- **LangChain Docs**: https://python.langchain.com/docs/

## License

MIT License - See LICENSE file for details

## Support

- GitHub Issues: https://github.com/yksanjo/mcp-discovery/issues
- MCP Discovery API Status: Check Railway deployment status

## Acknowledgments

- Built on top of the [Model Context Protocol](https://github.com/mcp)
- Powered by [MCP Discovery API](https://github.com/yksanjo/mcp-discovery)
- Integrates with [LangChain](https://github.com/langchain-ai/langchain)
- [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) integration contributed Feb 2026 ([Issue #11793](https://github.com/Significant-Gravitas/AutoGPT/issues/11793))
