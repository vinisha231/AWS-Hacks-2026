-- Benefits Navigator — Aurora PostgreSQL Schema

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
  user_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cognito_id    VARCHAR(255) UNIQUE NOT NULL,
  full_name     VARCHAR(255),
  language      VARCHAR(10) DEFAULT 'en',
  phone         VARCHAR(20),
  email         VARCHAR(255),
  state         CHAR(2),
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE intake_sessions (
  session_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(user_id) ON DELETE CASCADE,
  raw_input     TEXT NOT NULL,
  structured    JSONB,
  language      VARCHAR(10) DEFAULT 'en',
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE eligibility_results (
  result_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID REFERENCES intake_sessions(session_id) ON DELETE CASCADE,
  user_id           UUID REFERENCES users(user_id) ON DELETE CASCADE,
  program           VARCHAR(100) NOT NULL,
  eligible          BOOLEAN NOT NULL,
  estimated_value   INTEGER,
  reason            TEXT,
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE applications (
  application_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
  session_id      UUID REFERENCES intake_sessions(session_id),
  program         VARCHAR(100) NOT NULL,
  status          VARCHAR(50) DEFAULT 'draft',
  form_data       JSONB,
  submitted_at    TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW(),
  updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documents (
  document_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID REFERENCES applications(application_id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
  s3_key          VARCHAR(500) NOT NULL,
  doc_type        VARCHAR(100),
  file_name       VARCHAR(255),
  uploaded_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE renewal_reminders (
  reminder_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID REFERENCES applications(application_id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(user_id) ON DELETE CASCADE,
  remind_at       TIMESTAMP NOT NULL,
  sent            BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_intake_user ON intake_sessions(user_id);
CREATE INDEX idx_eligibility_user ON eligibility_results(user_id);
CREATE INDEX idx_eligibility_session ON eligibility_results(session_id);
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_documents_application ON documents(application_id);
CREATE INDEX idx_reminders_remind_at ON renewal_reminders(remind_at) WHERE sent = FALSE;
