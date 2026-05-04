-- 1. Create a dedicated table for Audit Logs
CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp timestamptz DEFAULT NOW() NOT NULL,
  -- WHO did it? (Nullable because system events might not have a user)
  user_id uuid REFERENCES auth.users(id) ON DELETE
  SET
    NULL,
    ip_address text,
    -- WHAT happened?
    event_type text NOT NULL,
    -- e.g. 'payment_failed', 'settings_updated'
    severity text CHECK (
      severity IN ('info', 'warning', 'error', 'critical')
    ) DEFAULT 'info',
    -- THE DATA (Flexible storage)
    metadata jsonb DEFAULT '{}' :: jsonb,
    -- Performance: Index commonly searched fields
    CONSTRAINT audit_logs_event_type_key UNIQUE (id, timestamp) -- Helps with partitioning later
);

-- 2. Performance Indexes
-- You will almost always query logs by Time or User. Index them!
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);

CREATE INDEX idx_audit_logs_metadata ON public.audit_logs USING gin (metadata);

-- ^ GIN index allows you to query INSIDE the JSON (e.g., find logs where metadata->'amount' > 50)
-- 3. Security (RLS) - CRITICAL
ALTER TABLE
  public.audit_logs enable ROW LEVEL SECURITY;

-- Delete logs older than 90 days every night at 3 AM
SELECT
  cron.schedule(
    'purge-old-audit-logs',
    '0 3 * * *',
    -- Cron syntax for 3 AM daily
    $ $
    DELETE FROM
      public.audit_logs
    WHERE
      timestamp < NOW() - INTERVAL '90 days' $ $
  );