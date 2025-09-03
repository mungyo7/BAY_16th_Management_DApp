import { atom } from 'jotai';
import { Member, Announcement, Activity } from '@/shared/types/global.types';
import { ActivityPlan, QuickStat, QuickLink } from '../types/home.types';
import { dummyMembers, dummyAnnouncements, dummyUserActivities } from '@/shared/utils/dummyData';

export const membersAtom = atom<Member[]>(dummyMembers);
export const announcementsAtom = atom<Announcement[]>(dummyAnnouncements);
export const recentActivitiesAtom = atom<Activity[]>(dummyUserActivities);
export const isLoadingAtom = atom(false);

export const sortedAnnouncementsAtom = atom((get) => {
  const announcements = get(announcementsAtom);
  
  // 고정 공지사항과 일반 공지사항 분리
  const pinnedAnnouncements = announcements.filter(announcement => announcement.isPinned);
  const regularAnnouncements = announcements.filter(announcement => !announcement.isPinned);
  
  // 각각 최신순으로 정렬
  pinnedAnnouncements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  regularAnnouncements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // 고정 공지사항을 먼저, 그 다음 일반 공지사항 (최대 10개)
  return [...pinnedAnnouncements, ...regularAnnouncements].slice(0, 10);
});

export const activeMembersAtom = atom((get) => {
  const members = get(membersAtom);
  return members.filter(member => member.isActive);
});

export const memberStatsAtom = atom((get) => {
  const members = get(membersAtom);
  const activeMembers = members.filter(member => member.isActive);
  
  return {
    totalMembers: members.length,
    activeMembers: activeMembers.length,
    averageAttendance: activeMembers.reduce((sum, member) => sum + member.attendanceRate, 0) / activeMembers.length,
    totalPoints: activeMembers.reduce((sum, member) => sum + member.totalPoints, 0)
  };
});

// 활동계획 관련 atoms
export const activityPlansAtom = atom<ActivityPlan[]>([
  {
    id: '1',
    title: 'Solana 스마트 컨트랙트 심화 세미나',
    description: 'Anchor 프레임워크를 활용한 DeFi 프로토콜 개발 실습',
    date: '2024-01-15',
    time: '19:00',
    location: '공학관 401호',
    category: 'seminar',
    maxParticipants: 30,
    currentParticipants: 18,
    isRequired: true,
    points: 50,
    tags: ['Solana', 'Smart Contract', 'DeFi'],
    speaker: '김블록',
    status: 'upcoming'
  },
  {
    id: '2',
    title: 'Web3 해커톤 준비 스터디',
    description: '2월 해커톤 대비 팀 빌딩 및 아이디어 브레인스토밍',
    date: '2024-01-20',
    time: '14:00',
    location: '스터디룸 B-201',
    category: 'study',
    maxParticipants: 15,
    currentParticipants: 12,
    isRequired: false,
    points: 30,
    tags: ['Hackathon', 'Team Building'],
    status: 'upcoming'
  },
  {
    id: '3',
    title: 'BAY 네트워킹 데이',
    description: '선후배 교류 및 블록체인 업계 진로 상담',
    date: '2024-01-25',
    time: '18:00',
    location: '학생회관 세미나실',
    category: 'networking',
    maxParticipants: 50,
    currentParticipants: 35,
    isRequired: false,
    points: 20,
    tags: ['Networking', 'Career'],
    status: 'upcoming'
  }
]);

export const upcomingActivitiesAtom = atom((get) => {
  const activities = get(activityPlansAtom);
  return activities
    .filter(activity => activity.status === 'upcoming')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
});

// Quick Stats 관련 atoms
export const quickStatsAtom = atom<QuickStat[]>((get) => {
  const memberStats = get(memberStatsAtom);
  const activities = get(activityPlansAtom);
  const upcomingCount = activities.filter(a => a.status === 'upcoming').length;
  
  return [
    {
      label: '총 회원수',
      value: memberStats.totalMembers,
      change: 5,
      color: 'blue'
    },
    {
      label: '이번 달 활동',
      value: upcomingCount,
      color: 'green'
    },
    {
      label: '평균 출석률',
      value: `${Math.round(memberStats.averageAttendance)}%`,
      change: 2.5,
      color: 'purple'
    },
    {
      label: '누적 포인트',
      value: memberStats.totalPoints.toLocaleString(),
      change: 150,
      color: 'orange'
    }
  ];
});

// Quick Links 관련 atoms
export const quickLinksAtom = atom<QuickLink[]>([
  {
    id: '1',
    title: 'GitHub',
    url: 'https://github.com/bay-blockchain',
    isExternal: true,
    category: 'resource'
  },
  {
    id: '2',
    title: 'Discord',
    url: 'https://discord.gg/bay-blockchain',
    isExternal: true,
    category: 'social'
  },
  {
    id: '3',
    title: 'Notion',
    url: 'https://notion.so/bay-blockchain',
    isExternal: true,
    category: 'document'
  },
  {
    id: '4',
    title: 'Solana Docs',
    url: 'https://docs.solana.com',
    isExternal: true,
    category: 'resource'
  }
]);

// 포인트 랭킹 관련 atoms
export const top5RankingAtom = atom((get) => {
  const members = get(membersAtom);
  
  // 포인트 기준으로 정렬하고 상위 5명만 선택
  const sortedMembers = [...members]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 5)
    .map((member, index) => ({
      ...member,
      rank: index + 1,
      change: Math.floor(Math.random() * 5) - 2 // 더미 변동값 (-2 ~ +2)
    }));
  
  return sortedMembers;
});