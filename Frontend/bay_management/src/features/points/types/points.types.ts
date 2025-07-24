export interface PointsStats {
  currentPoints: number;
  earnedThisMonth: number;
  spentThisMonth: number;
  totalEarned: number;
  totalSpent: number;
  transactionCount: number;
}

export interface PointsChartData {
  date: string;
  earned: number;
  spent: number;
  net: number;
}

export interface PointsData {
  stats: PointsStats;
  history: any[];
  ranking: any[];
  chartData: PointsChartData[];
}