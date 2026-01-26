# Data Model (Supabase PostgreSQL)

## 1. Tables

### `users`
- `id` (UUID, PK)
- `email` (String, Unique)
- `encrypted_password` (String)
- `interest_tags` (Array of Strings) : 사용자 취향 (예: ['축구', '재테크'])
- `risk_score` (Float) : 0.0 ~ 100.0 (기본값 0)
- `created_at` (Timestamp)

### `threat_cases` (AI Agent 수집 데이터)
- `id` (UUID, PK)
- `source_url` (String)
- `raw_text` (Text)
- `analysis_json` (JSONB) : GPT-4.1.-nano가 추출한 {type, keywords, lure_text}
- `embedding` (Vector) : `pgvector` 사용 (시나리오 매칭용)
- `collected_at` (Timestamp)

### `simulation_logs`
- `id` (UUID, PK)
- `user_id` (FK -> users.id)
- `threat_case_id` (FK -> threat_cases.id)
- `status` (Enum: SENT, OPENED, CLICKED, SUBMITTED)
- `metadata` (JSONB) : { device, ip, stay_time_sec }
- `created_at` (Timestamp)

## 2. Relationships
- User : SimulationLogs = 1 : N
- ThreatCases : SimulationLogs = 1 : N