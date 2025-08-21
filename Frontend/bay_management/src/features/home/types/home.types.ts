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

export interface ActivityPlan {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: 'seminar' | 'study' | 'networking' | 'workshop' | 'hackathon' | 'other';
  maxParticipants?: number;
  currentParticipants: number;
  isRequired: boolean;
  points: number;
  tags: string[];
  speaker?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface QuickStat {
  label: string;
  value: string | number;
  change?: number;
  icon?: string;
  color?: string;
}

export interface QuickLink {
  id: string;
  title: string;
  description?: string;
  url: string;
  icon?: string;
  isExternal: boolean;
  category: 'resource' | 'social' | 'tool' | 'document';
}