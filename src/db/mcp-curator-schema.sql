-- MCP Curator Schema Extensions
-- Add cost optimization and intelligent routing to MCP Discovery

-- 1. Add cost and performance fields to mcp_servers
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS cost_per_call DECIMAL(10,4) DEFAULT 0;
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS avg_latency_ms INTEGER DEFAULT 1000;
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS reliability_score DECIMAL(3,2) DEFAULT 0.95;
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'free';
ALTER TABLE mcp_servers ADD COLUMN IF NOT EXISTS last_cost_update TIMESTAMPTZ;

-- 2. Create table for routing decisions and cost tracking
CREATE TABLE IF NOT EXISTS routing_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  task_description TEXT NOT NULL,
  recommended_server_id UUID REFERENCES mcp_servers(id),
  alternative_server_ids UUID[] DEFAULT '{}',
  estimated_cost DECIMAL(10,4),
  estimated_latency_ms INTEGER,
  routing_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create table for actual usage and costs
CREATE TABLE IF NOT EXISTS actual_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routing_decision_id UUID REFERENCES routing_decisions(id) ON DELETE CASCADE,
  server_id UUID REFERENCES mcp_servers(id),
  actual_cost DECIMAL(10,4),
  actual_latency_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. Create table for cost savings calculations
CREATE TABLE IF NOT EXISTS cost_savings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_actual_cost DECIMAL(10,2) DEFAULT 0,
  total_estimated_cost_without_optimization DECIMAL(10,2) DEFAULT 0,
  savings DECIMAL(10,2) DEFAULT 0,
  savings_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(api_key_id, month)
);

-- 5. Create table for task categories (for better routing)
CREATE TABLE IF NOT EXISTS task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  common_keywords TEXT[] DEFAULT '{}',
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Link servers to task categories
CREATE TABLE IF NOT EXISTS server_task_categories (
  server_id UUID REFERENCES mcp_servers(id) ON DELETE CASCADE,
  task_category_id UUID REFERENCES task_categories(id) ON DELETE CASCADE,
  suitability_score DECIMAL(3,2) DEFAULT 1.0,
  PRIMARY KEY (server_id, task_category_id)
);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mcp_servers_cost ON mcp_servers(cost_per_call);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_latency ON mcp_servers(avg_latency_ms);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_reliability ON mcp_servers(reliability_score);
CREATE INDEX IF NOT EXISTS idx_mcp_servers_tags ON mcp_servers USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_routing_decisions_api_key ON routing_decisions(api_key_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_actual_usage_routing ON actual_usage(routing_decision_id);
CREATE INDEX IF NOT EXISTS idx_cost_savings_api_month ON cost_savings(api_key_id, month DESC);

-- 8. Function to get optimal server for a task
CREATE OR REPLACE FUNCTION get_optimal_server(
  p_task_description TEXT,
  p_max_cost DECIMAL(10,4) DEFAULT 1.0,
  p_max_latency_ms INTEGER DEFAULT 5000,
  p_min_reliability DECIMAL(3,2) DEFAULT 0.8,
  p_required_tags TEXT[] DEFAULT '{}'
) RETURNS TABLE (
  server_id UUID,
  server_name TEXT,
  server_slug TEXT,
  install_command TEXT,
  estimated_cost DECIMAL(10,4),
  estimated_latency_ms INTEGER,
  reliability_score DECIMAL(3,2),
  suitability_score DECIMAL(3,2),
  matching_tags TEXT[],
  routing_reason TEXT
) AS $$
DECLARE
  v_task_embedding VECTOR(1536);
  v_task_keywords TEXT[];
BEGIN
  -- In production, we would generate embedding from task description
  -- For MVP, we'll use keyword matching
  v_task_keywords := string_to_array(lower(regexp_replace(p_task_description, '[^a-zA-Z0-9\s]', '', 'g')), ' ');
  
  RETURN QUERY
  WITH ranked_servers AS (
    SELECT 
      s.id,
      s.name,
      s.slug,
      s.install_command,
      s.cost_per_call,
      s.avg_latency_ms,
      s.reliability_score,
      s.tags,
      -- Calculate suitability score
      CASE 
        WHEN s.cost_per_call = 0 THEN 1.0
        ELSE GREATEST(0.1, 1.0 - (s.cost_per_call / p_max_cost))
      END * 
      CASE 
        WHEN s.avg_latency_ms = 0 THEN 1.0
        ELSE GREATEST(0.1, 1.0 - (s.avg_latency_ms::DECIMAL / p_max_latency_ms))
      END *
      s.reliability_score AS suitability,
      -- Check tag matches
      array_intersect(s.tags, v_task_keywords) AS matching_tags,
      -- Generate routing reason
      CASE 
        WHEN s.cost_per_call = 0 AND s.avg_latency_ms < 100 THEN 'Free and fast'
        WHEN s.cost_per_call = 0 THEN 'Free but slower'
        WHEN s.cost_per_call < 0.01 THEN 'Very low cost'
        ELSE 'Balanced cost/performance'
      END AS reason
    FROM mcp_servers s
    WHERE s.cost_per_call <= p_max_cost
      AND s.avg_latency_ms <= p_max_latency_ms
      AND s.reliability_score >= p_min_reliability
      AND (p_required_tags = '{}' OR s.tags @> p_required_tags)
  )
  SELECT 
    id,
    name,
    slug,
    install_command,
    cost_per_call,
    avg_latency_ms,
    reliability_score,
    suitability,
    matching_tags,
    reason
  FROM ranked_servers
  ORDER BY suitability DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;

-- 9. Function to calculate monthly savings for an API key
CREATE OR REPLACE FUNCTION calculate_monthly_savings(p_api_key_id UUID)
RETURNS TABLE (
  month DATE,
  actual_cost DECIMAL(10,2),
  estimated_cost_without_optimization DECIMAL(10,2),
  savings DECIMAL(10,2),
  savings_percentage DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  WITH monthly_data AS (
    SELECT 
      date_trunc('month', rd.created_at) AS month,
      SUM(au.actual_cost) AS total_actual,
      -- Estimate what it would have cost without optimization (using most expensive alternative)
      SUM(
        CASE 
          WHEN rd.alternative_server_ids IS NOT NULL AND array_length(rd.alternative_server_ids, 1) > 0 THEN
            (SELECT MAX(cost_per_call) 
             FROM mcp_servers 
             WHERE id = ANY(rd.alternative_server_ids))
          ELSE rd.estimated_cost * 1.5 -- 50% more if no alternatives
        END
      ) AS total_estimated
    FROM routing_decisions rd
    LEFT JOIN actual_usage au ON rd.id = au.routing_decision_id
    WHERE rd.api_key_id = p_api_key_id
      AND rd.created_at >= date_trunc('month', NOW() - INTERVAL '3 months')
    GROUP BY date_trunc('month', rd.created_at)
  )
  SELECT 
    month::DATE,
    COALESCE(total_actual, 0),
    COALESCE(total_estimated, 0),
    COALESCE(total_estimated - total_actual, 0),
    CASE 
      WHEN COALESCE(total_estimated, 0) = 0 THEN 0
      ELSE ROUND(((total_estimated - total_actual) / total_estimated * 100)::NUMERIC, 2)
    END
  FROM monthly_data
  ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql;

-- 10. Function to update server costs based on actual usage
CREATE OR REPLACE FUNCTION update_server_costs_from_usage()
RETURNS VOID AS $$
BEGIN
  -- Update cost_per_call based on actual usage (moving average)
  UPDATE mcp_servers s
  SET 
    cost_per_call = COALESCE(
      (SELECT AVG(au.actual_cost) 
       FROM actual_usage au 
       WHERE au.server_id = s.id 
         AND au.completed_at > NOW() - INTERVAL '7 days'
         AND au.actual_cost > 0),
      s.cost_per_call
    ),
    avg_latency_ms = COALESCE(
      (SELECT AVG(au.actual_latency_ms) 
       FROM actual_usage au 
       WHERE au.server_id = s.id 
         AND au.completed_at > NOW() - INTERVAL '7 days'
         AND au.success = true),
      s.avg_latency_ms
    ),
    reliability_score = COALESCE(
      (SELECT 
         COUNT(CASE WHEN au.success THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0)
       FROM actual_usage au 
       WHERE au.server_id = s.id 
         AND au.completed_at > NOW() - INTERVAL '7 days'),
      s.reliability_score
    ),
    last_cost_update = NOW()
  WHERE EXISTS (
    SELECT 1 FROM actual_usage au 
    WHERE au.server_id = s.id 
      AND au.completed_at > NOW() - INTERVAL '7 days'
  );
END;
$$ LANGUAGE plpgsql;

-- 11. Initialize with some common task categories
INSERT INTO task_categories (name, description, common_keywords) VALUES
  ('database', 'Database operations and queries', ARRAY['database', 'sql', 'query', 'postgres', 'mysql', 'mongodb', 'redis']),
  ('github', 'GitHub repository operations', ARRAY['github', 'repo', 'repository', 'git', 'commit', 'pull', 'issue']),
  ('filesystem', 'File system operations', ARRAY['file', 'directory', 'folder', 'read', 'write', 'list', 'delete']),
  ('http', 'HTTP requests and API calls', ARRAY['http', 'api', 'request', 'fetch', 'get', 'post', 'rest']),
  ('ai', 'AI model interactions', ARRAY['ai', 'llm', 'openai', 'claude', 'gpt', 'model', 'generate']),
  ('stripe', 'Payment processing with Stripe', ARRAY['stripe', 'payment', 'charge', 'customer', 'invoice', 'subscription']),
  ('email', 'Email sending and management', ARRAY['email', 'send', 'smtp', 'mail', 'message', 'notification'])
ON CONFLICT (name) DO NOTHING;

-- 12. Grant permissions (adjust based on your Supabase setup)
-- GRANT SELECT, INSERT, UPDATE ON routing_decisions, actual_usage, cost_savings, task_categories, server_task_categories TO authenticated;
-- GRANT EXECUTE ON FUNCTION get_optimal_server, calculate_monthly_savings, update_server_costs_from_usage TO authenticated;

-- 13. Create a trigger to update cost savings monthly
CREATE OR REPLACE FUNCTION update_cost_savings_monthly()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update cost savings for the current month
  INSERT INTO cost_savings (api_key_id, month, total_actual_cost, total_estimated_cost_without_optimization, savings, savings_percentage)
  SELECT 
    api_key_id,
    date_trunc('month', NOW())::DATE,
    total_actual_cost,
    total_estimated_cost_without_optimization,
    savings,
    savings_percentage
  FROM calculate_monthly_savings(NEW.api_key_id)
  WHERE month = date_trunc('month', NOW())::DATE
  ON CONFLICT (api_key_id, month) 
  DO UPDATE SET
    total_actual_cost = EXCLUDED.total_actual_cost,
    total_estimated_cost_without_optimization = EXCLUDED.total_estimated_cost_without_optimization,
    savings = EXCLUDED.savings,
    savings_percentage = EXCLUDED.savings_percentage,
    created_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Run the cost update function daily (you would set this up as a cron job)
-- SELECT update_server_costs_from_usage();