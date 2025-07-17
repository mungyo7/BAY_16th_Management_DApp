import { atom } from 'jotai';
import { User, Badge, Activity } from '@/shared/types/global.types';
import { dummyMembers, dummyBadges, dummyUserActivities } from '@/shared/utils/dummyData';

export const currentUserAtom = atom<User | null>(dummyMembers[0]);
export const walletAddressAtom = atom<string>('');
export const userBadgesAtom = atom<Badge[]>(dummyBadges);
export const userActivitiesAtom = atom<Activity[]>(dummyUserActivities);
export const isLoadingAtom = atom(false);
export const isEditingAtom = atom(false);

export const isWalletConnectedAtom = atom((get) => {
  const walletAddress = get(walletAddressAtom);
  const currentUser = get(currentUserAtom);
  return !!walletAddress || !!currentUser?.walletAddress;
});

export const walletConnectionAtom = atom((get) => {
  const walletAddress = get(walletAddressAtom);
  const currentUser = get(currentUserAtom);
  const isConnected = get(isWalletConnectedAtom);
  
  return {
    isConnected,
    publicKey: walletAddress || currentUser?.walletAddress || null,
    balance: 0, // TODO: 실제 지갑 잔액 연동
    network: 'devnet' as const
  };
});

export const userStatsAtom = atom((get) => {
  const currentUser = get(currentUserAtom);
  const badges = get(userBadgesAtom);
  const activities = get(userActivitiesAtom);
  
  if (!currentUser) return null;
  
  const pointsEarned = activities
    .filter(activity => activity.type === 'point_earned')
    .reduce((sum, activity) => sum + (activity.points || 0), 0);
  
  const pointsSpent = activities
    .filter(activity => activity.type === 'point_spent')
    .reduce((sum, activity) => sum + (activity.points || 0), 0);
  
  return {
    totalPoints: currentUser.totalPoints,
    pointsEarned,
    pointsSpent,
    badgeCount: badges.length,
    nftBadgeCount: badges.filter(badge => badge.isNFT).length,
    attendanceRate: currentUser.attendanceRate,
    rank: currentUser.rank,
    activeDays: Math.floor((Date.now() - new Date(currentUser.joinDate).getTime()) / (1000 * 60 * 60 * 24))
  };
});

export const recentUserActivitiesAtom = atom((get) => {
  const activities = get(userActivitiesAtom);
  return activities
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);
});