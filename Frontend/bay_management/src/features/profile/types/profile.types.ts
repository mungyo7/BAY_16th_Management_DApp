export interface UserStats {
  totalPoints: number;
  pointsEarned: number;
  pointsSpent: number;
  badgeCount: number;
  nftBadgeCount: number;
  attendanceRate: number;
  rank: number;
  activeDays: number;
}

export interface WalletConnection {
  isConnected: boolean;
  publicKey: string | null;
  balance: number;
  network: 'mainnet-beta' | 'testnet' | 'devnet';
}

export interface ProfileData {
  user: any;
  stats: UserStats;
  badges: any[];
  activities: any[];
  wallet: WalletConnection;
}