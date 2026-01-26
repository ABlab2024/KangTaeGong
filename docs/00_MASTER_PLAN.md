# Project: Phishing Prevention & Threat Intel Platform (MVP)

## 1. Vision
사용자 맞춤형 피싱 모의 훈련을 제공하고, AI Agent를 통해 최신 위협 정보를 수집하는 웹 서비스입니다.
비용 0원(Zero-Cost)으로 MVP를 검증하는 것이 최우선 목표입니다.

## 2. Core Features
1. **Threat Collector**: `GPT-4.1.-nano`를 활용하여 웹상의 피싱 사례를 수집 및 분석.
2. **Web Dashboard**: 사용자 가입, 취향 분석(설문), 보안 점수 리포트 (React/Vue).
3. **Simulation Engine**: 수집된 사례 + 사용자 취향 = 이메일 피싱 시나리오 생성 및 발송 (Gmail SMTP).
4. **Behavior Tracking**: 훈련용 가짜 페이지 내 클릭, 체류 시간 등 사용자 반응 로깅.

## 3. Key Strategy
- **Modular Build**: DB -> Collector -> Web -> Simulation 순으로 개발.
- **Data-Driven**: Supabase를 활용한 RDB + Vector Store 통합.