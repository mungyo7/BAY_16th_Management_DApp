# 블록체인 학회 통합 관리 시스템 - 개발 가이드

## 프로젝트 개요
솔라나 기반 블록체인 학회 통합 관리 시스템의 프론트엔드 개발 프로젝트입니다.

## 프로젝트 구조 (Feature-based)
```
Frontend/
├── src/
│   ├── features/
│   │   ├── attendance/
│   │   │   ├── components/
│   │   │   │   ├── QRScanner.tsx
│   │   │   │   ├── AttendanceList.tsx
│   │   │   │   └── AttendanceStats.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAttendance.ts
│   │   │   ├── store/
│   │   │   │   └── attendanceStore.ts
│   │   │   ├── types/
│   │   │   │   └── attendance.types.ts
│   │   │   └── index.ts
│   │   ├── profile/
│   │   │   ├── components/
│   │   │   │   ├── ProfileForm.tsx
│   │   │   │   └── ProfileView.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useProfile.ts
│   │   │   ├── store/
│   │   │   │   └── profileStore.ts
│   │   │   ├── types/
│   │   │   │   └── profile.types.ts
│   │   │   └── index.ts
│   │   ├── points/
│   │   │   ├── components/
│   │   │   │   ├── PointsDashboard.tsx
│   │   │   │   ├── PointsHistory.tsx
│   │   │   │   └── PointsRanking.tsx
│   │   │   ├── hooks/
│   │   │   │   └── usePoints.ts
│   │   │   ├── store/
│   │   │   │   └── pointsStore.ts
│   │   │   ├── types/
│   │   │   │   └── points.types.ts
│   │   │   └── index.ts
│   │   └── home/
│   │       ├── components/
│   │       │   ├── MemberDirectory.tsx
│   │       │   ├── MemberCard.tsx
│   │       │   └── Announcements.tsx
│   │       ├── hooks/
│   │       │   └── useHome.ts
│   │       ├── store/
│   │       │   └── homeStore.ts
│   │       ├── types/
│   │       │   └── home.types.ts
│   │       └── index.ts
│   ├── shared/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Header.tsx
│   │   │   │   └── Layout.tsx
│   │   │   └── ui/
│   │   │       └── [ShadCN components]
│   │   ├── hooks/
│   │   │   ├── useWallet.ts
│   │   │   └── useSolana.ts
│   │   ├── utils/
│   │   │   ├── solana.ts
│   │   │   └── constants.ts
│   │   └── types/
│   │       └── global.types.ts
│   ├── pages/
│   │   ├── HomePage.tsx
│   │   ├── AttendancePage.tsx
│   │   ├── ProfilePage.tsx
│   │   └── PointsPage.tsx
│   ├── store/
│   │   └── index.ts              # Zustand store 통합
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

## 기술 스택
- **프레임워크**: React.js with TypeScript
- **빌드 도구**: Vite
- **블록체인**: Solana (@solana/web3.js, @solana/wallet-adapter)
- **스타일링**: Tailwind CSS v4, ShadCN UI
- **상태관리**: Jotai (Zustand에서 변경)
- **라우팅**: React Router v7
- **데이터 페칭**: TanStack Query (React Query) v5
- **테마**: next-themes
- **알림**: Sonner
- **아이콘**: Lucide React

## Jotai Store 구조

### 1. Attendance Atoms
```typescript
// features/attendance/store/attendanceAtoms.ts
import { atom } from 'jotai';

export const attendanceRecordsAtom = atom<AttendanceRecord[]>([]);
export const isLoadingAtom = atom(false);

// Derived atoms
export const attendanceStatsAtom = atom((get) => {
  const records = get(attendanceRecordsAtom);
  // 출석 통계 계산 로직
});
```

### 2. Profile Atoms
```typescript
// features/profile/store/profileAtoms.ts
import { atom } from 'jotai';

export const profileAtom = atom<UserProfile | null>(null);
export const walletAddressAtom = atom<string>('');
export const isConnectedAtom = atom((get) => !!get(walletAddressAtom));
```

### 3. Points Atoms
```typescript
// features/points/store/pointsAtoms.ts
import { atom } from 'jotai';

export const currentPointsAtom = atom(0);
export const pointsHistoryAtom = atom<PointTransaction[]>([]);
export const rankingDataAtom = atom<RankingData[]>([]);
```

### 4. Home Atoms
```typescript
// features/home/store/homeAtoms.ts
import { atom } from 'jotai';

export const membersAtom = atom<Member[]>([]);
export const announcementsAtom = atom<Announcement[]>([]);
export const recentActivitiesAtom = atom<Activity[]>([]);
```

## 핵심 기능 구현 가이드

### 1. 지갑 연동 (Jotai + Solana Wallet Adapter)
```typescript
// shared/hooks/useWallet.ts
import { useWallet } from '@solana/wallet-adapter-react';
import { useAtom } from 'jotai';
import { walletAddressAtom } from '@/features/profile/store/profileAtoms';

export const useWalletConnection = () => {
  const { publicKey, connect, disconnect } = useWallet();
  const [, setWalletAddress] = useAtom(walletAddressAtom);
  
  // 지갑 연동 로직
};
```

### 2. Feature 모듈 export 패턴
```typescript
// features/attendance/index.ts
export { QRScanner, AttendanceList, AttendanceStats } from './components';
export * from './store/attendanceAtoms';
export { useAttendance } from './hooks/useAttendance';
export type { AttendanceRecord, AttendanceStats } from './types/attendance.types';
```

### 3. 페이지 컴포넌트 구조
```typescript
// pages/AttendancePage.tsx
import { QRScanner, AttendanceList, attendanceRecordsAtom } from '@/features/attendance';
import { useAtomValue } from 'jotai';
import { useMutation } from '@tanstack/react-query';

export const AttendancePage = () => {
  const attendanceRecords = useAtomValue(attendanceRecordsAtom);
  const checkInMutation = useMutation({
    mutationFn: async (eventId: string) => {
      // 체크인 API 호출
    }
  });
  
  return (
    <div>
      <QRScanner onScan={checkInMutation.mutate} />
      <AttendanceList records={attendanceRecords} />
    </div>
  );
};
```

## 개발 순서 (Phase 1 - MVP)

1. **프로젝트 초기 설정**
   ```bash
   npx create-solana-dapp
   npm install jotai @tanstack/react-query
   npm install -D @types/node vite-tsconfig-paths
   ```

2. **Feature 구조 설정**
   - 각 feature 폴더 구조 생성
   - Jotai atoms 초기 설정
   - TanStack Query 설정

3. **공통 컴포넌트 개발**
   - Layout, Header 컴포넌트
   - ShadCN UI 설정

4. **Feature별 개발**
   - Home: 회원 목록, 공지사항 (더미 데이터)
   - Attendance: 출석 리스트, 통계
   - Profile: 프로필 폼, 조회
   - Points: 대시보드, 랭킹

5. **통합 및 라우팅**
   - 페이지 컴포넌트 연결
   - React Router v7 설정
   - 다크모드 테마 설정 (next-themes)

## 주요 페이지별 구성

### 홈 페이지
- 학회 소개
- 회원 디렉토리 (그리드 뷰)
- 공지사항
- 최근 활동 피드

### 출석체크 페이지
- QR 코드 스캐너/생성기
- 출석 이력 테이블
- 출석률 차트

### 프로필 페이지
- 개인 정보 폼
- 활동 이력
- 지갑 연동 상태

### 포인트 대시보드
- 현재 포인트
- 포인트 획득/사용 내역
- 전체 랭킹
- 포인트 추이 차트

## 코딩 컨벤션

### 파일 네이밍
- 컴포넌트: PascalCase (예: `MemberCard.tsx`)
- 유틸리티: camelCase (예: `formatDate.ts`)
- Atoms: camelCase + Atom 접미사 (예: `attendanceAtoms.ts`)

### 컴포넌트 구조
```typescript
interface ComponentProps {
  // props 정의
}

export const ComponentName: React.FC<ComponentProps> = ({ props }) => {
  // Jotai atoms 사용
  const [state, setState] = useAtom(someAtom);
  const value = useAtomValue(readOnlyAtom);
  
  return (
    // JSX
  );
};
```

### Import 경로
```typescript
// 절대 경로 사용 (tsconfig.json paths 설정)
import { attendanceRecordsAtom } from '@/features/attendance';
import { Button } from '@/shared/components/ui';
```

## 환경 변수
```env
VITE_SOLANA_RPC_URL=
VITE_SOLANA_NETWORK=
```

## 빌드 및 배포
```bash
npm run build
npm run lint
npm run format:check
npm run ci
```

## 주의사항
- 다크모드 지원 (next-themes)
- 모바일 우선 반응형 디자인
- 솔라나 mainnet-beta 또는 devnet 사용
- WCAG 2.1 접근성 준수
- Feature 간 의존성 최소화
- Jotai atoms는 feature별로 분리
- TanStack Query로 서버 상태 관리

## Phase별 개발 목표

### Phase 1 (현재)
- 더미데이터 기반 전체 UI 구현
- Feature-based 구조 확립
- Jotai 상태관리 구현
- TanStack Query 데이터 페칭 구현

### Phase 2
- 솔라나 블록체인 통합
- 실제 포인트 시스템 구현

### Phase 3
- NFT 배지 시스템
- 고급 분석 기능

### Phase 4
- 타 학회 연동 기능