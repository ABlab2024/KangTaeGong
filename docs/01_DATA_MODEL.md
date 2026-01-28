# Data Model (SQLite - 로컬 개발용)

> **Note:** 이 스키마는 SQLite 호환성을 위해 최적화되었습니다.  
> PostgreSQL 전용 타입(UUID, JSONB, Vector)은 SQLite 호환 타입으로 대체되었습니다.

## 1. 타입 매핑

| PostgreSQL | SQLite | 설명 |
|------------|--------|------|
| UUID | TEXT (36자) | `uuid.uuid4()` 문자열 |
| JSONB | TEXT | JSON 문자열로 저장 |
| Vector | TEXT | JSON 배열 문자열로 저장 |
| Array | TEXT | JSON 배열 문자열로 저장 |
| Timestamp | TEXT | ISO 8601 형식 문자열 |

---

## 2. Tables

### `users`
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | TEXT(36) | PK | UUID 문자열 |
| `email` | TEXT(255) | UNIQUE, NOT NULL | 사용자 이메일 |
| `hashed_password` | TEXT(255) | NULLABLE | 비밀번호 해시 (이메일 로그인 시 NULL) |
| `age_group` | TEXT(10) | NULLABLE | 연령대 (10대, 20대 등) |
| `gender` | TEXT(10) | NULLABLE | 성별 (남성, 여성, 기타) |
| `preferences` | TEXT | DEFAULT '[]' | 콘텐츠 선호도 (JSON 배열) |
| `security_score` | INTEGER | DEFAULT 0 | 보안 점수 |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 생성일시 |

### `user_profiles`
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | TEXT(36) | PK | UUID 문자열 |
| `user_id` | TEXT(36) | FK → users.id, UNIQUE | 사용자 ID |
| `age` | INTEGER | NULLABLE | 나이 |
| `occupation` | TEXT(100) | NULLABLE | 직업 |
| `location` | TEXT(100) | NULLABLE | 위치 |
| `sns_homepage` | TEXT(500) | NULLABLE | SNS/YouTube 첫 화면 URL |
| `recent_ai_link` | TEXT(500) | NULLABLE | 최근 AI 대화 링크 |
| `content_preferences` | TEXT | DEFAULT '[]' | 선호 콘텐츠 (JSON 배열) |
| `augmented_preferences` | TEXT | DEFAULT '[]' | LLM 확장 선호도 (JSON 배열) |
| `vulnerability_analysis` | TEXT | NULLABLE | LLM 취약점 분석 결과 |
| `onboarding_completed` | INTEGER | DEFAULT 0 | 온보딩 완료 여부 (0/1) |
| `augmentation_count` | INTEGER | DEFAULT 0 | LLM 확장 횟수 |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 수정일시 |

### `content_categories`
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | TEXT(36) | PK | UUID 문자열 |
| `name` | TEXT(100) | UNIQUE, NOT NULL | 카테고리명 |
| `icon` | TEXT(50) | NULLABLE | 아이콘 |
| `category_group` | TEXT(50) | NULLABLE | 카테고리 그룹 |
| `display_order` | INTEGER | DEFAULT 0 | 표시 순서 |

### `threat_cases` (AI Agent 수집 데이터)
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | TEXT(36) | PK | UUID 문자열 |
| `source_url` | TEXT | NULLABLE | 원본 URL |
| `raw_text` | TEXT | NULLABLE | 원본 텍스트 |
| `analysis_json` | TEXT | NULLABLE | AI 분석 결과 (JSON 문자열) |
| `embedding` | TEXT | NULLABLE | 임베딩 벡터 (JSON 배열 문자열) |
| `collected_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 수집일시 |

### `phishing_scenarios`
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | TEXT(36) | PK | UUID 문자열 |
| `name` | TEXT(200) | NOT NULL | 시나리오명 |
| `description` | TEXT | NULLABLE | 설명 |
| `scenario_type` | TEXT(50) | NULLABLE | 유형 (email, sms 등) |
| `difficulty` | TEXT(20) | DEFAULT 'medium' | 난이도 |
| `subject` | TEXT(500) | NULLABLE | 이메일 제목 |
| `body_template` | TEXT | NULLABLE | 이메일 본문 템플릿 |
| `sender_name` | TEXT(100) | NULLABLE | 발신자명 |
| `dummy_page_url` | TEXT(500) | NULLABLE | 더미 페이지 URL |
| `dummy_page_html` | TEXT | NULLABLE | 더미 페이지 HTML |
| `source_url` | TEXT(500) | NULLABLE | 실제 피해 사례 URL |
| `is_llm_generated` | INTEGER | DEFAULT 0 | LLM 생성 여부 (0/1) |
| `is_active` | INTEGER | DEFAULT 1 | 활성화 여부 (0/1) |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 생성일시 |
| `updated_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 수정일시 |

### `simulation_results`
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | TEXT(36) | PK | UUID 문자열 |
| `user_id` | TEXT(36) | FK → users.id, NOT NULL | 사용자 ID |
| `scenario_id` | TEXT(36) | FK → phishing_scenarios.id | 시나리오 ID |
| `sent_at` | TEXT | NOT NULL | 발송일시 |
| `email_subject` | TEXT(500) | NULLABLE | 이메일 제목 |
| `email_opened` | INTEGER | DEFAULT 0 | 이메일 열람 여부 (0/1) |
| `email_opened_at` | TEXT | NULLABLE | 이메일 열람일시 |
| `link_clicked` | INTEGER | DEFAULT 0 | 링크 클릭 여부 (0/1) |
| `link_clicked_at` | TEXT | NULLABLE | 링크 클릭일시 |
| `time_spent_seconds` | INTEGER | DEFAULT 0 | 더미 페이지 체류 시간 (초) |
| `info_submitted` | INTEGER | DEFAULT 0 | 정보 입력 여부 (0/1) |
| `submitted_fields` | TEXT | DEFAULT '[]' | 입력된 필드 목록 (JSON 배열) |
| `is_defended` | INTEGER | DEFAULT 1 | 방어 성공 여부 (0/1) |

### `simulation_logs`
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | TEXT(36) | PK | UUID 문자열 |
| `user_id` | TEXT(36) | FK → users.id, NOT NULL | 사용자 ID |
| `threat_id` | TEXT(36) | FK → threat_cases.id | 위협 사례 ID |
| `event_type` | TEXT | NOT NULL | 이벤트 유형 (SENT, OPENED, CLICKED, SUBMITTED) |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 생성일시 |

### `training_schedules`
| 컬럼 | 타입 | 제약조건 | 설명 |
|------|------|----------|------|
| `id` | TEXT(36) | PK | UUID 문자열 |
| `user_id` | TEXT(36) | FK → users.id, NOT NULL | 사용자 ID |
| `scenario_id` | TEXT(36) | FK → phishing_scenarios.id | 시나리오 ID |
| `scheduled_date` | TEXT | NOT NULL | 예정일시 |
| `is_sent` | INTEGER | DEFAULT 0 | 발송 여부 (0/1) |
| `sent_at` | TEXT | NULLABLE | 발송일시 |
| `created_at` | TEXT | DEFAULT CURRENT_TIMESTAMP | 생성일시 |

---

## 3. Relationships

```
User (1) ──────< (N) UserProfile
User (1) ──────< (N) SimulationResults
User (1) ──────< (N) SimulationLogs
User (1) ──────< (N) TrainingSchedules

ThreatCases (1) ──────< (N) SimulationLogs

PhishingScenario (1) ──────< (N) SimulationResults
PhishingScenario (1) ──────< (N) TrainingSchedules
```

---

## 4. SQLite 주의사항

1. **Boolean 처리**: SQLite에는 Boolean 타입이 없으므로 `INTEGER` (0/1)로 처리
2. **JSON 처리**: `json.dumps()` / `json.loads()`로 직렬화/역직렬화
3. **UUID 생성**: `str(uuid.uuid4())`로 36자 문자열 생성
4. **DateTime 처리**: ISO 8601 형식 문자열 (`datetime.isoformat()`)
5. **외래 키**: SQLite에서 FK 제약조건을 활성화하려면 `PRAGMA foreign_keys = ON;` 필요