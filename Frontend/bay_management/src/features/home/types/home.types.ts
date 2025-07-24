export interface MemberStats {
  totalMembers: number;
  activeMembers: number;
  averageAttendance: number;
  totalPoints: number;
}

export interface HomeData {
  stats: MemberStats;
  recentActivities: any[];
  announcements: any[];
  members: any[];
}