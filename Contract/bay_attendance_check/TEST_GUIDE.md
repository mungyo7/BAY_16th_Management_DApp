# BAY 출석체크 시스템 Devnet 테스트 가이드

이 가이드는 BAY 출석체크 솔라나 컨트랙트를 Devnet에서 테스트하는 방법을 설명합니다.

## 목차

1. [환경 설정](#환경-설정)
2. [프로젝트 빌드 및 배포](#프로젝트-빌드-및-배포)
3. [운영진 설정](#운영진-설정)
4. [세션 관리](#세션-관리)
5. [학회원 등록 및 출석 체크](#학회원-등록-및-출석-체크)
6. [통계 조회](#통계-조회)
7. [트러블슈팅](#트러블슈팅)

## 환경 설정

### 1. Solana CLI 설치 확인
```bash
solana --version
# 설치되어 있지 않다면: https://docs.solana.com/cli/install-solana-cli-tools
```

### 2. Anchor 설치 확인
```bash
anchor --version
# 설치되어 있지 않다면: https://www.anchor-lang.com/docs/installation
```

### 3. Devnet으로 네트워크 설정
```bash
solana config set --url devnet
solana config get
```

### 4. 지갑 생성 (이미 있다면 건너뛰기)
```bash
solana-keygen new --outfile ~/.config/solana/id.json
# 또는 기존 지갑 사용
solana config set --keypair ~/.config/solana/id.json
```

### 5. Devnet SOL 받기
```bash
solana airdrop 2
solana balance
```

## 프로젝트 빌드 및 배포

### 1. 프로젝트 디렉토리로 이동
```bash
cd /Users/mungyo7/Desktop/BAY\ Solana/BAY_16th_Management_DApp/Contract/bay_attendance_check
```

### 2. 의존성 설치
```bash
npm install
# 또는
yarn install
```

### 3. 프로그램 빌드
```bash
anchor build
```

### 4. 프로그램 ID 업데이트
빌드 후 생성된 프로그램 ID를 복사하여 업데이트:
```bash
# 프로그램 ID 확인
solana address -k target/deploy/bay_attendance_check-keypair.json

# lib.rs 파일의 declare_id! 매크로 업데이트
# Anchor.toml의 [programs.devnet] 섹션 업데이트
```

### 5. 다시 빌드
```bash
anchor build
```

### 6. Devnet에 배포
```bash
anchor deploy
```

배포 성공 시 출력 예시:
```
Program Id: YourProgramIdHere...
Deploy success
```

## 운영진 설정

### 1. 운영진 지갑 생성
```bash
# 운영진용 지갑 생성
solana-keygen new --outfile ./admin-wallet.json
solana airdrop 2 $(solana address -k ./admin-wallet.json)
```

### 2. 운영진 등록
```bash
# TypeScript 환경 설정 (매 터미널 세션마다 설정 필요)
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=./admin_bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u.json

# 운영진 등록
ts-node scripts/admin.ts init-admin ./admin_bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u.json
```

**중요**: 모든 admin 명령어 실행 시 위의 환경 변수가 설정되어 있어야 합니다.

## 세션 관리

### 환경 변수 간편 설정
```bash
# 방법 1: source 명령어로 환경 변수 설정
source ./set-admin-env.sh

# 방법 2: 직접 설정
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com
export ANCHOR_WALLET=./admin_bay1aCfaEwELREDGtadKov2S9CbkSHwLiBmtTo7Mp4u.json
```

### 1. 새 세션 생성
```bash
# 2024년 7월 30일 19:30 시작, 20:00까지 지각 허용
ts-node scripts/admin.ts init-session 2025-07-30 17:10 17:15
```

### 2. 세션 상태 확인
```bash
ts-node scripts/admin.ts session-stats 2025-07-30
```

### 3. 세션 종료
```bash
ts-node scripts/admin.ts close-session 2025-07-30
```

### 4. 세션 재활성화
```bash
# 종료된 세션을 새로운 시간으로 재활성화
ts-node scripts/admin.ts reactivate-session 2025-07-30 17:10 17:15
```

## 학회원 등록 및 출석 체크

### 1. 학회원 지갑 생성
```bash
# 학회원용 지갑 생성
solana-keygen new --outfile ./member1-wallet.json
solana airdrop 2 $(solana address -k ./member1-wallet.json)
```

### 2. 학회원 등록
```bash
export ANCHOR_WALLET=./member3-wallet.json
ts-node scripts/member.ts register ./member3-wallet.json
```

### 3. 출석 체크
```bash
# 세션이 활성화된 상태에서 실행
ts-node scripts/member.ts check-in ./member3-wallet.json 2025-07-30
```

### 4. 출석 상태 확인
```bash
ts-node scripts/member.ts attendance ./member1-wallet.json 2025-07-31
```

### 5. 개인 통계 조회
```bash
ts-node scripts/member.ts my-stats ./member1-wallet.json
```

## 통계 조회

### 1. 세션 요약 정보
```bash
ts-node scripts/stats.ts session-summary 2025-07-30
```

### 2. 학회원 랭킹 조회
```bash
ts-node scripts/stats.ts member-ranking
```

## 테스트 시나리오

### 시나리오 1: 정시 출석
1. 운영진이 세션 생성 (시작 시간: 현재 시간 + 1시간)
2. 학회원이 시작 시간 전에 출석 체크
3. 10 포인트 획득 확인

### 시나리오 2: 지각
1. 운영진이 세션 생성
2. 학회원이 시작 시간 후, 지각 허용 시간 내에 출석 체크
3. 5 포인트 획득 확인

### 시나리오 3: 중복 출석 방지
1. 학회원이 출석 체크
2. 같은 학회원이 다시 출석 체크 시도
3. 에러 발생 확인

### 시나리오 4: 세션 종료 후 출석 불가
1. 운영진이 세션 종료
2. 학회원이 출석 체크 시도
3. 에러 발생 확인

### 시나리오 5: 세션 재활성화
1. 운영진이 종료된 세션을 재활성화
2. 새로운 시작/지각 시간 설정
3. 통계가 초기화되고 다시 출석 가능

## 유닛 테스트 실행

```bash
# 모든 테스트 실행
anchor test

# 특정 테스트만 실행
anchor test -- --grep "Initialize admin member"
```

## 트러블슈팅

### 1. "Insufficient SOL" 에러
```bash
solana airdrop 2
```

### 2. "Program not found" 에러
- 프로그램이 제대로 배포되었는지 확인
- Anchor.toml의 프로그램 ID가 올바른지 확인

### 3. "Account does not exist" 에러
- 해당 계정이 초기화되었는지 확인
- PDA 주소가 올바르게 계산되었는지 확인

### 4. 시간 관련 테스트 이슈
- Solana의 Clock은 실제 시간과 약간의 차이가 있을 수 있음
- 테스트 시 충분한 시간 여유를 두고 설정

### 5. Transaction 실패 시 로그 확인
```bash
# 트랜잭션 시그니처로 상세 로그 확인
solana confirm -v <transaction-signature>
```

## 프로그램 로그 확인

```bash
# 실시간 로그 확인
solana logs

# 특정 프로그램 로그만 확인
solana logs <program-id>
```

## 주의사항

1. **Devnet SOL 한도**: Devnet에서는 하루에 받을 수 있는 SOL 양에 제한이 있습니다.
2. **시간 동기화**: 출석 체크는 블록체인의 시간을 기준으로 하므로, 로컬 시간과 차이가 있을 수 있습니다.
3. **PDA 주소**: 모든 계정은 PDA(Program Derived Address)를 사용하므로, 동일한 입력값에 대해 항상 같은 주소가 생성됩니다.
4. **트랜잭션 크기**: Solana 트랜잭션은 크기 제한이 있으므로, 대량의 데이터를 한 번에 처리할 수 없습니다.

## 추가 개발 아이디어

1. **포인트 토큰 연동**: SPL 토큰을 생성하여 실제 토큰으로 포인트 지급
2. **NFT 발행**: 특별 출석 기록에 대한 NFT 발행
3. **웹 인터페이스**: React 기반 프론트엔드 연동
4. **QR 코드 인증**: 모바일 지갑과 QR 코드를 활용한 출석 체크
5. **이벤트 로깅**: 모든 출석 기록을 이벤트로 발행하여 조회 가능하도록 개선