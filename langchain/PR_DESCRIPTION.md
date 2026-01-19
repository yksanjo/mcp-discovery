# Add MCP Discovery Tool for Dynamic Server Discovery

## Description

This PR adds the `MCPDiscoveryTool` to enable LangChain agents to dynamically discover Model Context Protocol (MCP) servers based on their task requirements.

Related issue: #34795

## Motivation

Currently, LangChain agents work with pre-configured toolsets. This limitation means:
- Agents can't adapt to new requirements that need different tools
- Users must manually research and configure all possible tools upfront
- No way to compare tools based on performance metrics

The MCP Discovery tool solves this by allowing agents to:
- Search for tools using natural language (e.g., "I need to query a database")
- Compare servers based on performance metrics (latency, uptime)
- Get installation instructions automatically
- Dynamically expand their capabilities based on task needs

## What's New

### Core Implementation
- **MCPDiscoveryTool**: BaseTool subclass implementing MCP server discovery
- **Semantic Search**: Natural language queries for capability matching
- **Performance Metrics**: Returns latency, uptime, and match scores
- **Error Handling**: Graceful handling of timeouts, connection errors, and empty results

### Documentation
- Comprehensive README with examples
- Jupyter notebook with 7 complete usage examples
- Inline documentation and type hints
- Unit tests with 10+ test cases

## Example Usage

```python
from langchain.tools import create_mcp_discovery_tool
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_react_agent
from langchain import hub

# Create tool
discovery_tool = create_mcp_discovery_tool()

# Use directly
result = discovery_tool.run("I need to query a PostgreSQL database")
print(result)
# Output:
# Found 1 MCP server(s) for: 'I need to query a PostgreSQL database'
# 
# 1. PostgreSQL MCP Server
#    Description: Connect to PostgreSQL databases
#    Install: npx @modelcontextprotocol/postgres
#    Performance:
#      - Latency: 150ms
#      - Uptime: 99.9%
#    Match Score: 95.0%

# Or integrate with agent
llm = ChatOpenAI(model="gpt-4", temperature=0)
tools = [discovery_tool]
prompt = hub.pull("hwchase17/react")

agent = create_react_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# Agent can now discover tools dynamically
response = agent_executor.invoke({
    "input": "Find me the fastest database MCP server available"
})
```

## Testing

All tests pass:

```bash
python -m pytest test_mcp_discovery_tool.py -v
```

Test coverage includes:
- ✅ Successful discovery with formatted output
- ✅ Empty results handling
- ✅ Timeout and connection error handling
- ✅ Multiple server results
- ✅ Servers with/without metrics
- ✅ Custom API endpoints

## Backend Service

The tool connects to the [MCP Discovery API](https://github.com/yksanjo/mcp-discovery):
- **Production endpoint**: https://mcp-discovery-production.up.railway.app
- **Open source**: MIT licensed
- **Current index**: 24+ MCP servers
- **Free tier**: 100 queries/month

## Breaking Changes

None - this is a new tool addition.

## Checklist

- [x] Added comprehensive documentation
- [x] Included usage examples
- [x] Added unit tests with mocking
- [x] Followed LangChain BaseTool patterns
- [x] Type hints throughout
- [x] Error handling for common failure modes
- [x] No external dependencies beyond standard LangChain requirements

## Future Enhancements

Potential improvements for future PRs:
- Async HTTP support with `aiohttp`
- Result caching for frequently queried capabilities
- Filter by server capabilities/tags
- Integration with LangChain's tool calling features

## Related Links

- MCP Discovery GitHub: https://github.com/yksanjo/mcp-discovery
- MCP Discovery npm: https://www.npmjs.com/package/mcp-discovery-api
- Model Context Protocol: https://github.com/mcp
- Original feature request: #34795
