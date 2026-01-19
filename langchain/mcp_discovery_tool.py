"""MCP Discovery Tool for LangChain.

This tool enables LangChain agents to dynamically discover MCP (Model Context Protocol)
servers based on natural language queries about their needs.
"""

from typing import Optional, Type, Dict, Any
from pydantic import BaseModel, Field
from langchain_core.tools import BaseTool
import requests


class MCPDiscoveryInput(BaseModel):
    """Input schema for MCP Discovery tool."""
    
    query: str = Field(
        description="Natural language description of the capability or tool needed. "
        "Examples: 'database access', 'send emails', 'file system operations', 'weather data'"
    )


class MCPDiscoveryTool(BaseTool):
    """Tool for discovering MCP servers based on task requirements.
    
    This tool connects to the MCP Discovery API to find relevant MCP servers
    that match an agent's needs. It returns server information including:
    - Server name and description
    - Installation commands
    - Performance metrics (latency, uptime)
    - Capability matches
    
    Example:
        >>> from langchain.agents import AgentExecutor, create_react_agent
        >>> from langchain_openai import ChatOpenAI
        >>> 
        >>> discovery = MCPDiscoveryTool()
        >>> llm = ChatOpenAI()
        >>> 
        >>> # Agent can now discover tools dynamically
        >>> result = discovery.run("I need to query a PostgreSQL database")
        >>> print(result)
    """
    
    name: str = "mcp_discovery"
    description: str = (
        "Discovers MCP (Model Context Protocol) servers based on task requirements. "
        "Use this when you need to find tools or capabilities that aren't currently available. "
        "Input should be a natural language description of what you need to accomplish. "
        "Returns server details with installation instructions and performance metrics."
    )
    args_schema: Type[BaseModel] = MCPDiscoveryInput
    api_url: str = Field(
        default="https://mcp-discovery-two.vercel.app",
        description="Base URL for the MCP Discovery API"
    )
    
    def _run(
        self,
        query: str,
        run_manager: Optional[Any] = None,
    ) -> str:
        """Execute the discovery query.
        
        Args:
            query: Natural language description of needed capability
            run_manager: Optional callback manager for the run
            
        Returns:
            Formatted string with discovered server information
            
        Raises:
            Exception: If the API request fails
        """
        try:
            # Make request to MCP Discovery API
            response = requests.post(
                f"{self.api_url}/api/v1/discover",
                json={"need": query, "limit": 5},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            response.raise_for_status()

            data = response.json()

            # Parse and format the results
            servers = data.get("recommendations", [])
            if not servers:
                return f"No MCP servers found matching: '{query}'. Try a different search."

            results = []
            results.append(f"Found {len(servers)} MCP server(s) for: '{query}'\n")

            for idx, server in enumerate(servers, 1):
                results.append(f"\n{idx}. {server.get('name', server.get('server', 'Unknown'))}")
                results.append(f"   Description: {server.get('description', 'No description')}")

                # Add installation info if available
                install_cmd = server.get("install_command") or server.get("installCommand")
                if install_cmd:
                    results.append(f"   Install: {install_cmd}")

                # Add confidence/match score if available
                if "confidence" in server:
                    results.append(f"   Confidence: {server['confidence']:.1%}")
                elif "matchScore" in server:
                    results.append(f"   Match Score: {server['matchScore']:.1%}")

                # Add category if available
                if server.get("category"):
                    results.append(f"   Category: {server['category']}")

                # Add repository link if available
                repo = server.get("github_url") or server.get("repository")
                if repo:
                    results.append(f"   Repo: {repo}")
            
            return "\n".join(results)
            
        except requests.exceptions.Timeout:
            return "MCP Discovery API request timed out. Please try again."
        except requests.exceptions.RequestException as e:
            return f"Error connecting to MCP Discovery API: {str(e)}"
        except Exception as e:
            return f"Unexpected error during MCP discovery: {str(e)}"
    
    async def _arun(
        self,
        query: str,
        run_manager: Optional[Any] = None,
    ) -> str:
        """Async version of _run.
        
        Note: Currently uses synchronous implementation.
        Future versions may implement true async HTTP calls.
        """
        # For now, use synchronous version
        # TODO: Implement with aiohttp for true async support
        return self._run(query, run_manager)


def create_mcp_discovery_tool(api_url: Optional[str] = None) -> MCPDiscoveryTool:
    """Factory function to create an MCP Discovery tool instance.
    
    Args:
        api_url: Optional custom API URL. Defaults to production endpoint.
        
    Returns:
        Configured MCPDiscoveryTool instance
        
    Example:
        >>> tool = create_mcp_discovery_tool()
        >>> result = tool.run("file system access")
    """
    if api_url:
        return MCPDiscoveryTool(api_url=api_url)
    return MCPDiscoveryTool()
