import { atom } from 'jotai';
import { Member, Announcement, Activity } from '@/shared/types/global.types';
import { dummyMembers, dummyAnnouncements, dummyUserActivities } from '@/shared/utils/dummyData';

export const membersAtom = atom<Member[]>(dummyMembers);
export const announcementsAtom = atom<Announcement[]>(dummyAnnouncements);
export const recentActivitiesAtom = atom<Activity[]>(dummyUserActivities);
export const isLoadingAtom = atom(false);

export const pinnedAnnouncementsAtom = atom((get) => {
  const announcements = get(announcementsAtom);
  return announcements.filter(announcement => announcement.isPinned);
});

export const recentAnnouncementsAtom = atom((get) => {
  const announcements = get(announcementsAtom);
  return announcements
    .filter(announcement => !announcement.isPinned)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
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