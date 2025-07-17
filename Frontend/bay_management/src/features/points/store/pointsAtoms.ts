import { atom } from 'jotai';
import { PointTransaction, RankingData } from '@/shared/types/global.types';
import { dummyPointTransactions, dummyRankingData } from '@/shared/utils/dummyData';

export const pointTransactionsAtom = atom<PointTransaction[]>(dummyPointTransactions);
export const rankingDataAtom = atom<RankingData[]>(dummyRankingData);
export const isLoadingAtom = atom(false);
export const selectedPeriodAtom = atom<'week' | 'month' | 'year'>('month');

export const currentPointsAtom = atom((get) => {
  const transactions = get(pointTransactionsAtom);
  const earnedPoints = transactions
    .filter(tx => tx.type === 'earned')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const spentPoints = transactions
    .filter(tx => tx.type === 'spent')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  return earnedPoints - spentPoints;
});

export const pointsHistoryAtom = atom((get) => {
  const transactions = get(pointTransactionsAtom);
  return transactions
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 20);
});

export const topRankersAtom = atom((get) => {
  const ranking = get(rankingDataAtom);
  return ranking.slice(0, 10);
});

export const pointsStatsAtom = atom((get) => {
  const transactions = get(pointTransactionsAtom);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const thisMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.timestamp);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });
  
  const earnedThisMonth = thisMonthTransactions
    .filter(tx => tx.type === 'earned')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const spentThisMonth = thisMonthTransactions
    .filter(tx => tx.type === 'spent')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalEarned = transactions
    .filter(tx => tx.type === 'earned')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  const totalSpent = transactions
    .filter(tx => tx.type === 'spent')
    .reduce((sum, tx) => sum + tx.amount, 0);
  
  return {
    currentPoints: totalEarned - totalSpent,
    earnedThisMonth,
    spentThisMonth,
    totalEarned,
    totalSpent,
    transactionCount: transactions.length
  };
});

export const pointsChartDataAtom = atom((get) => {
  const transactions = get(pointTransactionsAtom);
  const period = get(selectedPeriodAtom);
  
  const now = new Date();
  const periodDays = period === 'week' ? 7 : period === 'month' ? 30 : 365;
  const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);
  
  const periodTransactions = transactions.filter(tx => 
    new Date(tx.timestamp) >= startDate
  );
  
  const chartData = [];
  for (let i = 0; i < periodDays; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dayTransactions = periodTransactions.filter(tx => {
      const txDate = new Date(tx.timestamp);
      return txDate.toDateString() === date.toDateString();
    });
    
    const earned = dayTransactions
      .filter(tx => tx.type === 'earned')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const spent = dayTransactions
      .filter(tx => tx.type === 'spent')
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    chartData.push({
      date: date.toISOString().split('T')[0],
      earned,
      spent,
      net: earned - spent
    });
  }
  
  return chartData;
});