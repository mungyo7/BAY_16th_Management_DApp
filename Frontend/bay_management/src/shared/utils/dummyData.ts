import { Member, Announcement, Event, AttendanceRecord, PointTransaction, RankingData, Badge, Activity } from '@/shared/types/global.types';

export const dummyMembers: Member[] = [
  {
    id: '1',
    walletAddress: '7xKXtg2CW87d97TXJsDpkwVNUjQRcnZZD2YJJ5dvFgpT',
    name: '김민수',
    email: 'minsu@example.com',
    studentId: '2021001',
    department: '컴퓨터공학과',
    year: 3,
    role: 'admin',
    joinDate: new Date('2023-03-01'),
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    bio: 'BAY 16기 회장. 블록체인 기술에 관심이 많습니다.',
    isActive: true,
    attendanceRate: 95.2,
    totalPoints: 1850,
    rank: 1,
    badges: [
      {
        id: 'b1',
        name: '퍼펙트 출석',
        description: '한 달 동안 모든 세션에 출석',
        icon: '🏆',
        color: 'gold',
        earnedDate: new Date('2024-01-15'),
        isNFT: true
      },
      {
        id: 'b2',
        name: '리더십',
        description: '팀 프로젝트 리더 역할 수행',
        icon: '👑',
        color: 'purple',
        earnedDate: new Date('2024-02-20'),
        isNFT: false
      }
    ],
    activities: [
      {
        id: 'a1',
        type: 'attendance',
        description: '블록체인 기초 세미나 참석',
        points: 100,
        timestamp: new Date('2024-01-15T14:00:00Z')
      },
      {
        id: 'a2',
        type: 'point_earned',
        description: '프로젝트 발표 우수상',
        points: 200,
        timestamp: new Date('2024-01-10T16:00:00Z')
      }
    ]
  },
  {
    id: '2',
    name: '이서연',
    email: 'seoyeon@example.com',
    studentId: '2021002',
    department: '경영학과',
    year: 3,
    role: 'member',
    joinDate: new Date('2023-03-15'),
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b667b8d9?w=400&h=400&fit=crop',
    bio: 'DeFi와 NFT에 관심이 있는 경영학도입니다.',
    isActive: true,
    attendanceRate: 88.5,
    totalPoints: 1420,
    rank: 2,
    badges: [
      {
        id: 'b3',
        name: '블록체인 마스터',
        description: '블록체인 기초 과정 완료',
        icon: '🔗',
        color: 'blue',
        earnedDate: new Date('2024-01-20'),
        isNFT: true
      }
    ],
    activities: [
      {
        id: 'a3',
        type: 'attendance',
        description: 'DeFi 프로토콜 분석 워크샵 참석',
        points: 150,
        timestamp: new Date('2024-01-12T10:00:00Z')
      }
    ]
  },
  {
    id: '3',
    name: '박준호',
    email: 'junho@example.com',
    studentId: '2020003',
    department: '전자공학과',
    year: 4,
    role: 'member',
    joinDate: new Date('2023-04-01'),
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    bio: '스마트 컨트랙트 개발에 집중하고 있습니다.',
    isActive: true,
    attendanceRate: 92.1,
    totalPoints: 1680,
    rank: 3,
    badges: [
      {
        id: 'b4',
        name: '개발자',
        description: '스마트 컨트랙트 개발 완료',
        icon: '💻',
        color: 'green',
        earnedDate: new Date('2024-01-25'),
        isNFT: false
      }
    ],
    activities: [
      {
        id: 'a4',
        type: 'point_earned',
        description: 'dApp 개발 프로젝트 참여',
        points: 300,
        timestamp: new Date('2024-01-08T18:00:00Z')
      }
    ]
  },
  {
    id: '4',
    name: '최지원',
    email: 'jiwon@example.com',
    studentId: '2021004',
    department: '디자인학과',
    year: 2,
    role: 'member',
    joinDate: new Date('2023-09-01'),
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    bio: 'UX/UI 디자인으로 Web3 접근성 향상에 기여하고 싶습니다.',
    isActive: true,
    attendanceRate: 85.7,
    totalPoints: 980,
    rank: 4,
    badges: [
      {
        id: 'b5',
        name: '디자이너',
        description: 'UI/UX 디자인 프로젝트 완료',
        icon: '🎨',
        color: 'pink',
        earnedDate: new Date('2024-01-30'),
        isNFT: false
      }
    ],
    activities: [
      {
        id: 'a5',
        type: 'attendance',
        description: 'Web3 UX 디자인 세미나 참석',
        points: 100,
        timestamp: new Date('2024-01-05T15:00:00Z')
      }
    ]
  },
  {
    id: '5',
    name: '정태현',
    email: 'taehyun@example.com',
    studentId: '2022005',
    department: '컴퓨터공학과',
    year: 2,
    role: 'member',
    joinDate: new Date('2023-09-15'),
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    bio: '블록체인 보안에 관심이 있습니다.',
    isActive: true,
    attendanceRate: 91.3,
    totalPoints: 1250,
    rank: 5,
    badges: [
      {
        id: 'b6',
        name: '보안 전문가',
        description: '블록체인 보안 과정 완료',
        icon: '🔒',
        color: 'red',
        earnedDate: new Date('2024-02-05'),
        isNFT: true
      }
    ],
    activities: [
      {
        id: 'a6',
        type: 'point_earned',
        description: '보안 취약점 발견 및 보고',
        points: 250,
        timestamp: new Date('2024-01-03T11:00:00Z')
      }
    ]
  },
  {
    id: '6',
    name: '한소희',
    email: 'sohee@example.com',
    studentId: '2021006',
    department: '경제학과',
    year: 3,
    role: 'member',
    joinDate: new Date('2023-03-20'),
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    bio: '암호화폐 투자와 tokenomics에 관심이 많습니다.',
    isActive: true,
    attendanceRate: 87.9,
    totalPoints: 1150,
    rank: 6,
    badges: [
      {
        id: 'b7',
        name: '투자 분석가',
        description: '암호화폐 시장 분석 완료',
        icon: '📊',
        color: 'orange',
        earnedDate: new Date('2024-01-18'),
        isNFT: false
      }
    ],
    activities: [
      {
        id: 'a7',
        type: 'attendance',
        description: 'Tokenomics 분석 워크샵 참석',
        points: 120,
        timestamp: new Date('2024-01-07T13:00:00Z')
      }
    ]
  }
];

export const dummyAnnouncements: Announcement[] = [
  {
    id: '1',
    title: '2024년 1월 정기 세미나 안내',
    content: '안녕하세요! 1월 정기 세미나가 다음과 같이 진행됩니다.\n\n📅 일시: 2024년 1월 20일 (토) 14:00~17:00\n📍 장소: 공학관 301호\n📋 주제: "DeFi 프로토콜 심화 분석"\n\n참석 확인 부탁드립니다.',
    author: '김민수',
    createdAt: new Date('2024-01-15T09:00:00Z'),
    updatedAt: new Date('2024-01-15T09:00:00Z'),
    isPinned: true,
    tags: ['세미나', 'DeFi', '정기모임'],
    priority: 'high'
  },
  {
    id: '2',
    title: '블록체인 해커톤 참가 팀 모집',
    content: '2024 University Blockchain Hackathon에 참가할 팀을 모집합니다.\n\n🏆 상금: 1등 500만원, 2등 300만원, 3등 100만원\n📅 접수 마감: 1월 25일\n📋 팀 구성: 3~5명\n\n관심 있는 분들은 댓글로 의사 표현해주세요!',
    author: '이서연',
    createdAt: new Date('2024-01-10T16:30:00Z'),
    updatedAt: new Date('2024-01-12T10:00:00Z'),
    isPinned: false,
    tags: ['해커톤', '팀모집', '상금'],
    priority: 'medium'
  },
  {
    id: '3',
    title: '신입 회원 환영 파티',
    content: '새롭게 가입한 회원들을 환영하는 파티를 개최합니다.\n\n🎉 일시: 1월 27일 (토) 18:00~21:00\n🍕 장소: 홍대 모임 카페\n💰 회비: 2만원\n\n친목 도모와 네트워킹의 시간이 될 예정입니다.',
    author: '박준호',
    createdAt: new Date('2024-01-08T14:00:00Z'),
    updatedAt: new Date('2024-01-08T14:00:00Z'),
    isPinned: false,
    tags: ['파티', '신입회원', '네트워킹'],
    priority: 'low'
  }
];

export const dummyEvents: Event[] = [
  {
    id: '1',
    title: 'DeFi 프로토콜 심화 분석',
    description: 'Uniswap, Compound, Aave 등 주요 DeFi 프로토콜의 작동 원리와 수익 구조를 분석합니다.',
    date: new Date('2024-01-20T14:00:00Z'),
    location: '공학관 301호',
    type: 'seminar',
    requiredAttendance: true,
    points: 150,
    maxParticipants: 30,
    currentParticipants: 24,
    status: 'upcoming'
  },
  {
    id: '2',
    title: '스마트 컨트랙트 개발 워크샵',
    description: 'Solidity를 이용한 스마트 컨트랙트 개발 실습을 진행합니다.',
    date: new Date('2024-01-25T10:00:00Z'),
    location: '컴퓨터실 204호',
    type: 'workshop',
    requiredAttendance: false,
    points: 200,
    maxParticipants: 20,
    currentParticipants: 18,
    status: 'upcoming'
  },
  {
    id: '3',
    title: '블록체인 기초 세미나',
    description: '블록체인의 기본 개념과 작동 원리를 학습합니다.',
    date: new Date('2024-01-15T14:00:00Z'),
    location: '공학관 301호',
    type: 'seminar',
    requiredAttendance: true,
    points: 100,
    maxParticipants: 40,
    currentParticipants: 35,
    status: 'completed'
  }
];

export const dummyAttendanceRecords: AttendanceRecord[] = [
  {
    id: '1',
    userId: '1',
    eventId: '3',
    checkInTime: new Date('2024-01-15T14:05:00Z'),
    checkOutTime: new Date('2024-01-15T17:00:00Z'),
    status: 'present',
    points: 100,
    qrCode: 'QR_20240115_001'
  },
  {
    id: '2',
    userId: '2',
    eventId: '3',
    checkInTime: new Date('2024-01-15T14:15:00Z'),
    checkOutTime: new Date('2024-01-15T17:00:00Z'),
    status: 'late',
    points: 80,
    qrCode: 'QR_20240115_002'
  },
  {
    id: '3',
    userId: '3',
    eventId: '3',
    checkInTime: new Date('2024-01-15T14:00:00Z'),
    checkOutTime: new Date('2024-01-15T17:00:00Z'),
    status: 'present',
    points: 100,
    qrCode: 'QR_20240115_003'
  }
];

export const dummyPointTransactions: PointTransaction[] = [
  {
    id: '1',
    userId: '1',
    type: 'earned',
    amount: 100,
    reason: 'attendance',
    description: '블록체인 기초 세미나 참석',
    timestamp: new Date('2024-01-15T14:00:00Z'),
    relatedEventId: '3'
  },
  {
    id: '2',
    userId: '1',
    type: 'earned',
    amount: 200,
    reason: 'achievement',
    description: '프로젝트 발표 우수상',
    timestamp: new Date('2024-01-10T16:00:00Z')
  },
  {
    id: '3',
    userId: '1',
    type: 'spent',
    amount: 50,
    reason: 'reward',
    description: '스타벅스 기프트카드 교환',
    timestamp: new Date('2024-01-12T10:00:00Z')
  },
  {
    id: '4',
    userId: '2',
    type: 'earned',
    amount: 150,
    reason: 'workshop',
    description: 'DeFi 프로토콜 분석 워크샵 참석',
    timestamp: new Date('2024-01-12T10:00:00Z')
  }
];

export const dummyRankingData: RankingData[] = dummyMembers.map((member, index) => ({
  userId: member.id,
  user: member,
  totalPoints: member.totalPoints,
  rank: member.rank,
  attendanceRate: member.attendanceRate,
  badgeCount: member.badges.length,
  monthlyPoints: Math.floor(member.totalPoints * 0.3)
})).sort((a, b) => a.rank - b.rank);

export const dummyUserActivities: Activity[] = [
  {
    id: '1',
    type: 'attendance',
    description: 'DeFi 프로토콜 분석 워크샵 참석',
    points: 150,
    timestamp: new Date('2024-01-18T10:00:00Z')
  },
  {
    id: '2',
    type: 'point_earned',
    description: '스마트 컨트랙트 코드 리뷰 완료',
    points: 100,
    timestamp: new Date('2024-01-17T16:30:00Z')
  },
  {
    id: '3',
    type: 'badge_earned',
    description: '블록체인 마스터 배지 획득',
    timestamp: new Date('2024-01-16T14:00:00Z')
  },
  {
    id: '4',
    type: 'point_spent',
    description: '스타벅스 기프트카드 교환',
    points: 50,
    timestamp: new Date('2024-01-15T11:00:00Z')
  },
  {
    id: '5',
    type: 'attendance',
    description: '블록체인 기초 세미나 참석',
    points: 100,
    timestamp: new Date('2024-01-15T14:00:00Z')
  }
];

export const dummyBadges: Badge[] = [
  {
    id: 'b1',
    name: '퍼펙트 출석',
    description: '한 달 동안 모든 세션에 출석',
    icon: '🏆',
    color: 'gold',
    earnedDate: new Date('2024-01-15'),
    isNFT: true
  },
  {
    id: 'b2',
    name: '리더십',
    description: '팀 프로젝트 리더 역할 수행',
    icon: '👑',
    color: 'purple',
    earnedDate: new Date('2024-02-20'),
    isNFT: false
  },
  {
    id: 'b3',
    name: '블록체인 마스터',
    description: '블록체인 기초 과정 완료',
    icon: '🔗',
    color: 'blue',
    earnedDate: new Date('2024-01-20'),
    isNFT: true
  },
  {
    id: 'b4',
    name: '개발자',
    description: '스마트 컨트랙트 개발 완료',
    icon: '💻',
    color: 'green',
    earnedDate: new Date('2024-01-25'),
    isNFT: false
  }
];