"""Unit tests for MCP Discovery Tool."""

import unittest
from unittest.mock import patch, MagicMock
from mcp_discovery_tool import MCPDiscoveryTool, create_mcp_discovery_tool


class TestMCPDiscoveryTool(unittest.TestCase):
    """Test cases for MCPDiscoveryTool."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.tool = create_mcp_discovery_tool()
    
    def test_tool_initialization(self):
        """Test tool is initialized with correct properties."""
        self.assertEqual(self.tool.name, "mcp_discovery")
        self.assertIn("MCP", self.tool.description)
        self.assertIsNotNone(self.tool.api_url)
    
    def test_custom_api_url(self):
        """Test tool can be initialized with custom API URL."""
        custom_url = "https://custom-api.example.com"
        tool = create_mcp_discovery_tool(api_url=custom_url)
        self.assertEqual(tool.api_url, custom_url)
    
    @patch('mcp_discovery_tool.requests.post')
    def test_successful_discovery(self, mock_post):
        """Test successful server discovery."""
        # Mock API response
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "recommendations": [
                {
                    "name": "PostgreSQL MCP Server",
                    "server": "postgres-server",
                    "description": "Connect to PostgreSQL databases",
                    "install_command": "npx @mcp/postgres",
                    "confidence": 0.95,
                    "category": "database",
                    "github_url": "https://github.com/example/postgres-mcp"
                }
            ]
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        # Execute query
        result = self.tool.run("database access")

        # Verify
        self.assertIn("PostgreSQL MCP Server", result)
        self.assertIn("Connect to PostgreSQL databases", result)
        self.assertIn("npx @mcp/postgres", result)
        self.assertIn("95.0%", result)

        # Verify API was called correctly
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        self.assertIn("/api/v1/discover", call_args[0][0])
        self.assertEqual(call_args[1]["json"]["need"], "database access")
    
    @patch('mcp_discovery_tool.requests.post')
    def test_no_results_found(self, mock_post):
        """Test handling when no servers match the query."""
        mock_response = MagicMock()
        mock_response.json.return_value = {"recommendations": []}
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = self.tool.run("nonexistent capability")

        self.assertIn("No MCP servers found", result)
        self.assertIn("nonexistent capability", result)
    
    @patch('mcp_discovery_tool.requests.post')
    def test_timeout_handling(self, mock_post):
        """Test handling of API timeout."""
        import requests
        mock_post.side_effect = requests.exceptions.Timeout()
        
        result = self.tool.run("database")
        
        self.assertIn("timed out", result.lower())
    
    @patch('mcp_discovery_tool.requests.post')
    def test_connection_error_handling(self, mock_post):
        """Test handling of connection errors."""
        import requests
        mock_post.side_effect = requests.exceptions.ConnectionError("Network error")
        
        result = self.tool.run("database")
        
        self.assertIn("Error connecting", result)
    
    @patch('mcp_discovery_tool.requests.post')
    def test_multiple_servers_returned(self, mock_post):
        """Test formatting of multiple server results."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "recommendations": [
                {
                    "name": "Server 1",
                    "description": "First server",
                    "install_command": "npm install server1"
                },
                {
                    "name": "Server 2",
                    "description": "Second server",
                    "install_command": "npm install server2"
                },
                {
                    "name": "Server 3",
                    "description": "Third server",
                    "install_command": "npm install server3"
                }
            ]
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = self.tool.run("test query")

        # Should mention 3 servers
        self.assertIn("3 MCP server(s)", result)

        # Should include all server names
        self.assertIn("Server 1", result)
        self.assertIn("Server 2", result)
        self.assertIn("Server 3", result)
    
    @patch('mcp_discovery_tool.requests.post')
    def test_server_without_metrics(self, mock_post):
        """Test handling of servers without performance metrics."""
        mock_response = MagicMock()
        mock_response.json.return_value = {
            "recommendations": [
                {
                    "name": "Basic Server",
                    "description": "A basic server without metrics"
                }
            ]
        }
        mock_response.raise_for_status = MagicMock()
        mock_post.return_value = mock_response

        result = self.tool.run("test")

        # Should still work and include server name
        self.assertIn("Basic Server", result)
        self.assertIn("A basic server without metrics", result)
    
    def test_input_schema(self):
        """Test the input schema is properly defined."""
        from mcp_discovery_tool import MCPDiscoveryInput
        
        # Should have query field
        self.assertIn("query", MCPDiscoveryInput.model_fields)
        
        # Query should be required string
        field = MCPDiscoveryInput.model_fields["query"]
        self.assertIsNotNone(field.description)


class TestFactoryFunction(unittest.TestCase):
    """Test the factory function."""
    
    def test_create_default_tool(self):
        """Test creating tool with default settings."""
        tool = create_mcp_discovery_tool()

        self.assertIsInstance(tool, MCPDiscoveryTool)
        self.assertEqual(
            tool.api_url,
            "https://mcp-discovery-two.vercel.app"
        )
    
    def test_create_custom_tool(self):
        """Test creating tool with custom API URL."""
        custom_url = "https://test.example.com"
        tool = create_mcp_discovery_tool(api_url=custom_url)
        
        self.assertIsInstance(tool, MCPDiscoveryTool)
        self.assertEqual(tool.api_url, custom_url)


if __name__ == "__main__":
    unittest.main()
