export interface AttendanceStats {
  totalEvents: number;
  attendedEvents: number;
  lateEvents: number;
  absentEvents: number;
  attendanceRate: number;
  totalPoints: number;
}

export interface AttendanceData {
  stats: AttendanceStats;
  recentRecords: any[];
  upcomingEvents: any[];
}