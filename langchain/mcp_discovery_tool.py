"""MCP Discovery Tool for LangChain.

This tool enables LangChain agents to dynamically discover MCP (Model Context Protocol)
servers based on natural language queries about their needs.
"""

from typing import Optional, Type, Any
import asyncio

import aiohttp
import requests
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field


class MCPDiscoveryInput(BaseModel):
    """Input schema for MCP Discovery tool."""

    query: str = Field(
        description=(
            "Natural language description of the capability or tool needed. "
            "Examples: 'database access', 'send emails', 'file system operations', 'weather data'"
        )
    )
    limit: int = Field(
        default=5,
        ge=1,
        le=20,
        description="Maximum number of servers to return (1–20).",
    )
    force_refresh: bool = Field(
        default=False,
        description=(
            "Set to True to bypass the server-side cache and fetch the latest "
            "results. Useful when you need up-to-date server listings rather "
            "than a cached response."
        ),
    )


def _format_results(query: str, servers: list[dict]) -> str:
    """Format discovery results into a human-readable string."""
    if not servers:
        return f"No MCP servers found matching: '{query}'. Try a different search."

    lines: list[str] = [f"Found {len(servers)} MCP server(s) for: '{query}'
"]

    for idx, server in enumerate(servers, 1):
        name = server.get("name") or server.get("server") or "Unknown"
        verified = server.get("is_verified", False)
        trust_score = server.get("trust_score")
        verified_badge = " ✓ Verified" if verified else ""

        lines.append(f"
{idx}. {name}{verified_badge}")

        if server.get("description"):
            lines.append(f"   Description: {server['description']}")

        if trust_score is not None:
            lines.append(f"   Trust Score:  {trust_score}/100")

        install_cmd = server.get("install_command") or server.get("installCommand")
        if install_cmd:
            lines.append(f"   Install:      {install_cmd}")

        if "confidence" in server:
            lines.append(f"   Confidence:   {server['confidence']:.1%}")

        if server.get("category"):
            lines.append(f"   Category:     {server['category']}")

        metrics = server.get("metrics", {})
        if metrics.get("uptime_pct") is not None:
            lines.append(f"   Uptime:       {metrics['uptime_pct']:.1f}%")
        if metrics.get("avg_latency_ms") is not None:
            lines.append(f"   Avg Latency:  {metrics['avg_latency_ms']}ms")

        repo = server.get("github_url") or server.get("repository")
        if repo:
            lines.append(f"   Repo:         {repo}")

    return "
".join(lines)


class MCPDiscoveryTool(BaseTool):
    """Tool for discovering MCP servers based on task requirements.

    This tool connects to the MCP Discovery API to find relevant MCP servers
    that match an agent's needs. Each result includes:
    - Server name, description, and install command
    - Verification status and trust score (0–100)
    - Performance metrics (latency, uptime)
    - Capability matches

    Example::

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
        "Returns server details with installation instructions, trust scores, and performance metrics."
    )
    args_schema: Type[BaseModel] = MCPDiscoveryInput
    api_url: str = Field(
        default="https://mcp-discovery-two.vercel.app",
        description="Base URL for the MCP Discovery API",
    )

    def _run(
        self,
        query: str,
        limit: int = 5,
        force_refresh: bool = False,
        run_manager: Optional[Any] = None,
    ) -> str:
        """Execute the discovery query (synchronous).

        Args:
            query: Natural language description of needed capability.
            limit: Max number of results (1–20).
            force_refresh: Bypass server-side cache when True.
            run_manager: Optional callback manager.

        Returns:
            Formatted string with discovered server information.
        """
        try:
            response = requests.post(
                f"{self.api_url}/api/v1/discover",
                json={"need": query, "limit": limit, "force_refresh": force_refresh},
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
            response.raise_for_status()
            data = response.json()
            return _format_results(query, data.get("recommendations", []))
        except requests.exceptions.Timeout:
            return "MCP Discovery API request timed out. Please try again."
        except requests.exceptions.RequestException as e:
            return f"Error connecting to MCP Discovery API: {str(e)}"
        except Exception as e:
            return f"Unexpected error during MCP discovery: {str(e)}"

    async def _arun(
        self,
        query: str,
        limit: int = 5,
        force_refresh: bool = False,
        run_manager: Optional[Any] = None,
    ) -> str:
        """Execute the discovery query (async with aiohttp).

        Args:
            query: Natural language description of needed capability.
            limit: Max number of results (1–20).
            force_refresh: Bypass server-side cache when True.
            run_manager: Optional callback manager.

        Returns:
            Formatted string with discovered server information.
        """
        try:
            timeout = aiohttp.ClientTimeout(total=10)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    f"{self.api_url}/api/v1/discover",
                    json={"need": query, "limit": limit, "force_refresh": force_refresh},
                    headers={"Content-Type": "application/json"},
                ) as resp:
                    resp.raise_for_status()
                    data = await resp.json()
                    return _format_results(query, data.get("recommendations", []))
        except asyncio.TimeoutError:
            return "MCP Discovery API request timed out. Please try again."
        except aiohttp.ClientError as e:
            return f"Error connecting to MCP Discovery API: {str(e)}"
        except Exception as e:
            return f"Unexpected error during MCP discovery: {str(e)}"


def create_mcp_discovery_tool(api_url: Optional[str] = None) -> MCPDiscoveryTool:
    """Factory function to create an MCP Discovery tool instance.

    Args:
        api_url: Optional custom API URL. Defaults to production endpoint.

    Returns:
        Configured MCPDiscoveryTool instance.

    Example::

        >>> tool = create_mcp_discovery_tool()
        >>> result = tool.run("file system access")
    """
    if api_url:
        return MCPDiscoveryTool(api_url=api_url)
    return MCPDiscoveryTool()
