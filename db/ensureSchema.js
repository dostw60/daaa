const pool = require("./pool");

async function ensureSchema() {
  await pool.query(`
    CREATE OR REPLACE FUNCTION status_rank(status TEXT)
    RETURNS INT AS $$
    BEGIN
      RETURN CASE
        WHEN status = 'Upcoming' THEN 1
        WHEN status = 'Open' THEN 2
        WHEN status = 'Closed' THEN 3
        ELSE 0
      END;
    END;
    $$ LANGUAGE plpgsql;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS upcoming_ipos (
      id SERIAL PRIMARY KEY,
      company_name TEXT,
      symbol TEXT,
      shares NUMERIC DEFAULT 0,
      issue_size NUMERIC DEFAULT 0,
      issue_type TEXT,
      event_value JSONB,
      status TEXT,
      source TEXT,
      source_url TEXT,
      confidence NUMERIC DEFAULT 0,
      open_date DATE,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE upcoming_ipos
      ADD COLUMN IF NOT EXISTS shares NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS issue_size NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS issue_type TEXT,
      ADD COLUMN IF NOT EXISTS event_value JSONB,
      ADD COLUMN IF NOT EXISTS status TEXT,
      ADD COLUMN IF NOT EXISTS source TEXT,
      ADD COLUMN IF NOT EXISTS source_url TEXT,
      ADD COLUMN IF NOT EXISTS confidence NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS open_date DATE,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS upcoming_ipos_company_issue_source_idx
    ON upcoming_ipos (company_name, issue_type, source)
  `);
}

module.exports = { ensureSchema };
