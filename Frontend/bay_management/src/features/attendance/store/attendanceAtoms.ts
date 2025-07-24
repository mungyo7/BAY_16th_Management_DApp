import { atom } from 'jotai';
import { AttendanceRecord, Event } from '@/shared/types/global.types';
import { dummyAttendanceRecords, dummyEvents } from '@/shared/utils/dummyData';

export const attendanceRecordsAtom = atom<AttendanceRecord[]>(dummyAttendanceRecords);
export const eventsAtom = atom<Event[]>(dummyEvents);
export const isLoadingAtom = atom(false);
export const selectedEventAtom = atom<Event | null>(null);

export const upcomingEventsAtom = atom((get) => {
  const events = get(eventsAtom);
  return events.filter(event => event.status === 'upcoming');
});

export const completedEventsAtom = atom((get) => {
  const events = get(eventsAtom);
  return events.filter(event => event.status === 'completed');
});

export const attendanceStatsAtom = atom((get) => {
  const records = get(attendanceRecordsAtom);
  const events = get(eventsAtom);
  
  const totalEvents = events.filter(event => event.status === 'completed').length;
  const attendedEvents = records.filter(record => record.status === 'present').length;
  const lateEvents = records.filter(record => record.status === 'late').length;
  const absentEvents = totalEvents - attendedEvents - lateEvents;
  
  return {
    totalEvents,
    attendedEvents,
    lateEvents,
    absentEvents,
    attendanceRate: totalEvents > 0 ? ((attendedEvents + lateEvents) / totalEvents) * 100 : 0,
    totalPoints: records.reduce((sum, record) => sum + record.points, 0)
  };
});

export const recentAttendanceAtom = atom((get) => {
  const records = get(attendanceRecordsAtom);
  return records
    .sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime())
    .slice(0, 10);
});