export interface User {
  id: string;
  walletAddress?: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  year: number;
  role: 'admin' | 'member';
  joinDate: Date;
  avatar?: string;
  bio?: string;
  isActive: boolean;
}

export interface Member extends User {
  attendanceRate: number;
  totalPoints: number;
  rank: number;
  badges: Badge[];
  activities: Activity[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedDate: Date;
  isNFT: boolean;
}

export interface Activity {
  id: string;
  type: 'attendance' | 'point_earned' | 'point_spent' | 'badge_earned' | 'profile_update';
  description: string;
  points?: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  type: 'meeting' | 'seminar' | 'workshop' | 'social';
  requiredAttendance: boolean;
  points: number;
  maxParticipants?: number;
  currentParticipants: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  eventId: string;
  checkInTime: Date;
  checkOutTime?: Date;
  status: 'present' | 'late' | 'absent';
  points: number;
  qrCode?: string;
}

export interface PointTransaction {
  id: string;
  userId: string;
  type: 'earned' | 'spent';
  amount: number;
  reason: string;
  description?: string;
  timestamp: Date;
  relatedEventId?: string;
}

export interface RankingData {
  userId: string;
  user: User;
  totalPoints: number;
  rank: number;
  attendanceRate: number;
  badgeCount: number;
  monthlyPoints: number;
}

export interface WalletConnection {
  isConnected: boolean;
  publicKey: string | null;
  balance: number;
  network: 'mainnet-beta' | 'testnet' | 'devnet';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export type Theme = 'dark' | 'light' | 'system';

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  current?: boolean;
}