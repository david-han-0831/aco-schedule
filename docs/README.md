# 📚 ACO 시스템 개발 문서

안양시민오케스트라(ACO) 구성원 및 연습일정 관리 시스템 개발 문서입니다.

## 📂 문서 구조

### 요구사항 정의서
- `requirements/001-aco-system-requirements.md` - 전체 시스템 요구사항 및 기능 정의

### 기능별 설계 문서
- `features/001-member-management-design.md` - 회원 관리 시스템 설계
- `features/002-schedule-management-design.md` - 연습일정 관리 시스템 설계
- `features/003-dashboard-design.md` - 대시보드 설계

## 🎯 주요 기능

1. **대시보드** - 전체 현황 및 통계 정보 표시
2. **회원 관리** - 구성원 정보 CRUD 및 악기/파트 관리
3. **연습일정 관리** - 요일별 연습일정 및 출석 현황 관리

## 🛠️ 기술 스택

- **프레임워크:** Next.js (App Router)
- **언어:** TypeScript
- **데이터 저장:** JSON 파일 (초기), 향후 데이터베이스 연동 예정
- **스타일링:** Tailwind CSS (권장)

## 📝 개발 순서

1. Phase 1: 회원 관리 시스템
2. Phase 2: 연습일정 관리 시스템
3. Phase 3: 대시보드

## 📌 참고

각 기능별 상세 설계는 `features/` 폴더 내 문서를 참고하세요.

