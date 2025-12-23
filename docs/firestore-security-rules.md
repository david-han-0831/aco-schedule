# 🔐 Firestore 보안 규칙 가이드

## 📋 개요

이 문서는 ACO 프로젝트의 Firestore 보안 규칙 설정 방법을 설명합니다.

## 📁 파일 구조

- `firestore.rules`: 모든 접근 허용 (간단한 규칙)

## 🚀 설정 방법

### 1. Firebase Console에서 설정

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. 프로젝트 선택: `aco-project-8e5cf`
3. 왼쪽 메뉴에서 **Firestore Database** 선택
4. **규칙** 탭 클릭
5. `firestore.rules` 파일의 내용을 복사하여 붙여넣기
6. **게시** 버튼 클릭

### 2. Firebase CLI로 배포 (권장)

```bash
# Firebase CLI 설치 (아직 설치하지 않은 경우)
npm install -g firebase-tools

# Firebase 로그인
firebase login

# 프로젝트 초기화 (아직 하지 않은 경우)
firebase init firestore

# 규칙 배포
firebase deploy --only firestore:rules
```

## 📝 규칙 설명

### 현재 규칙 (`firestore.rules`)

```javascript
match /{document=**} {
  allow read, write: if true; // 모든 접근 허용
}
```

- **특징**: 모든 컬렉션에 대해 읽기/쓰기 모두 허용
- **용도**: 간단한 프로젝트에 적합
- **주의**: 모든 사용자가 데이터를 읽고 쓸 수 있습니다

## 🔒 보안 고려사항

### 현재 상태
- ✅ 빠른 개발 및 테스트 가능
- ✅ 간단한 설정
- ⚠️ 모든 사용자가 데이터를 읽고 쓸 수 있음

### 향후 보안 강화가 필요한 경우
1. **인증 시스템 추가**
   - Firebase Authentication 사용
   - 이메일/비밀번호 또는 소셜 로그인

2. **역할 기반 접근 제어 (RBAC)**
   - 관리자/일반 사용자 구분
   - 관리자만 삭제 권한 부여

3. **데이터 검증 강화**
   - 필수 필드 검증
   - 데이터 타입 검증
   - 값 범위 검증

## 📊 컬렉션별 규칙

현재 모든 컬렉션(Members, Instruments, Schedules)에 대해:
- **읽기**: 모든 사용자 허용
- **생성**: 모든 사용자 허용
- **수정**: 모든 사용자 허용
- **삭제**: 모든 사용자 허용

## 🛠️ 고급 설정 예시

### 관리자만 삭제 가능하도록 설정

```javascript
function isAdmin() {
  return isAuthenticated() && 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}

match /members/{memberId} {
  allow read: if isAuthenticated();
  allow create, update: if isAuthenticated();
  allow delete: if isAdmin(); // 관리자만 삭제 가능
}
```

### 특정 사용자만 자신의 데이터 수정

```javascript
match /schedules/{scheduleId} {
  allow read: if isAuthenticated();
  allow create: if isAuthenticated();
  allow update: if isAuthenticated() 
                && resource.data.memberId == request.auth.uid;
  allow delete: if isAuthenticated() 
                && resource.data.memberId == request.auth.uid;
}
```

## ⚠️ 주의사항

1. **현재 규칙은 모든 접근을 허용합니다**
2. **규칙 변경 후 반드시 테스트하세요**
3. **Firebase Console에서 규칙 시뮬레이션 기능 활용**
4. **향후 보안이 필요하면 인증 시스템을 추가하세요**

## 📚 참고 자료

- [Firestore 보안 규칙 문서](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase CLI 문서](https://firebase.google.com/docs/cli)
- [보안 규칙 테스트](https://firebase.google.com/docs/firestore/security/test-rules)

