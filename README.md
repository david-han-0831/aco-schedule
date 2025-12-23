# ACO 관리 시스템

안양시민오케스트라 구성원 및 연습일정을 관리하는 웹 애플리케이션입니다.

## 주요 기능

- 📊 **대시보드**: 전체 현황 및 통계 정보 확인
- 👥 **회원 관리**: 구성원 정보 관리 (Admin, SuperAdmin 권한)
- 📅 **연습일정 관리**: 개인별 출석 가능 날짜 등록 및 확인
- 🔐 **역할 기반 접근 제어**: SuperAdmin, Admin, User 역할 관리

## 기술 스택

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Firebase Firestore, Firebase Authentication
- **Deployment**: Vercel

## 시작하기

### 1. 저장소 클론

```bash
git clone https://github.com/david-han-0831/aco-schedule.git
cd aco-schedule
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env.local.example` 파일을 `.env.local`로 복사하고 Firebase 설정 값을 입력하세요:

```bash
cp .env.local.example .env.local
```

`.env.local` 파일에 다음 Firebase 설정을 입력하세요:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

Firebase 설정 값은 [Firebase Console](https://console.firebase.google.com/) > 프로젝트 설정 > 일반 > 내 앱에서 확인할 수 있습니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 배포

### Vercel 배포

1. [Vercel](https://vercel.com)에 프로젝트를 연결합니다.
2. 환경 변수를 Vercel 대시보드에서 설정합니다:
   - Settings > Environment Variables에서 위의 모든 `NEXT_PUBLIC_FIREBASE_*` 변수를 추가합니다.
3. 배포가 자동으로 진행됩니다.

### Firebase 설정

Firebase 프로젝트가 설정되어 있어야 합니다:
- Firestore Database 생성
- Authentication 활성화 (Google 로그인, 이메일/비밀번호)
- Firestore Security Rules 설정 (`firestore.rules` 참고)

## 프로젝트 구조

```
aco/
├── app/                    # Next.js App Router 페이지
│   ├── api/               # API 라우트
│   ├── members/           # 회원 관리 페이지
│   ├── schedules/         # 연습일정 페이지
│   └── ...
├── components/            # React 컴포넌트
│   ├── ui/               # UI 컴포넌트 (shadcn/ui)
│   └── ...
├── contexts/              # React Context
├── lib/                   # 유틸리티 및 Firebase 설정
├── docs/                  # 문서
└── data/                  # 초기 데이터 (JSON)
```

## 역할 및 권한

- **SuperAdmin**: 모든 기능 접근 가능, 사용자 역할 관리
- **Admin**: 대시보드, 회원 관리, 연습일정 접근 가능
- **User**: 대시보드, 연습일정 접근 가능 (본인 일정만)

## 라이선스

이 프로젝트는 비공개 프로젝트입니다.
