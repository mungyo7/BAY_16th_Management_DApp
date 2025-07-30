# 세션 재활성화 기능 구현 완료

## 개요
기존에는 한번 종료된 세션의 날짜를 재사용할 수 없었으나, 이제 `reactivate_session` 기능을 통해 종료된 세션을 새로운 시간으로 재활성화할 수 있습니다.

## 구현 내용

### 1. Rust 컨트랙트 업데이트
- `programs/bay_attendance_check/src/instructions/reactivate_session.rs` 생성
- 관리자만 실행 가능한 권한 검증
- 새로운 시작/지각 시간 설정 가능
- 세션 통계 초기화 (선택사항)

### 2. TypeScript 클라이언트 업데이트
- `scripts/admin.ts`에 `reactivate-session` 명령어 추가
- 사용법: `ts-node scripts/admin.ts reactivate-session <date> <start-time> <late-time>`

### 3. 배포 정보
- Program ID: HW4UmSnJfLd8yn8afM3WGz2w52ea7i1oTGqCSAXJmwv5
- Network: Devnet
- 배포 시간: 2024-07-28

## 사용 예시

```bash
# 1. 세션 생성
ts-node scripts/admin.ts init-session 2024-07-28 19:30 20:00

# 2. 세션 종료
ts-node scripts/admin.ts close-session 2024-07-28

# 3. 세션 재활성화 (새로운 시간으로)
ts-node scripts/admin.ts reactivate-session 2024-07-28 21:00 22:00

# 4. 상태 확인
ts-node scripts/admin.ts session-stats 2024-07-28
```

## 주요 특징
1. **날짜 재사용**: 이미 사용된 날짜의 세션을 재활성화 가능
2. **시간 변경**: 시작 시간과 지각 허용 시간을 새롭게 설정
3. **통계 초기화**: 재활성화 시 출석 통계가 0으로 초기화
4. **권한 제어**: 관리자만 재활성화 가능

## 문제 해결
이 기능은 "7월 28일에 새로운 세션만들어서 테스트해보려는데 어떻게해? 이미 종료했는데도 새로 안만들어지네" 문제를 해결합니다. 

Solana 블록체인의 특성상 한번 생성된 계정은 삭제할 수 없으므로, 동일한 날짜로 새 세션을 생성하는 대신 기존 세션을 재활성화하는 방식으로 구현했습니다.