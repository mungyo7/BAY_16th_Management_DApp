import { atom } from 'jotai';

export interface Session {
  id: string;
  date: string;
  startTime: number;
  lateTime: number;
  title: string;
  location: string;
  isActive: boolean;
  totalAttendees: number;
  totalLate: number;
  createdBy: string;
  createdAt: string;
}

export interface CheckInState {
  status: 'idle' | 'checking' | 'success' | 'late' | 'failed';
  sessionId: string | null;
  pointsEarned: number;
  message: string;
}

// 세션 관련 atoms
export const sessionsAtom = atom<Session[]>([]);
export const activeSessionAtom = atom<Session | null>(null);
export const isCreatingSessionAtom = atom(false);

// 체크인 관련 atoms
export const checkInStateAtom = atom<CheckInState>({
  status: 'idle',
  sessionId: null,
  pointsEarned: 0,
  message: ''
});

export const currentCheckInSessionAtom = atom<{
  date: string;
  startTime: number;
  lateTime: number;
  title: string;
  location: string;
} | null>(null);

// Derived atoms
export const activeSesssionsAtom = atom((get) => {
  const sessions = get(sessionsAtom);
  return sessions.filter(session => session.isActive);
});

export const upcomingSessionsAtom = atom((get) => {
  const sessions = get(sessionsAtom);
  const now = Date.now();
  return sessions.filter(session => session.startTime > now && session.isActive);
});

export const pastSessionsAtom = atom((get) => {
  const sessions = get(sessionsAtom);
  const now = Date.now();
  return sessions.filter(session => session.lateTime < now);
});

// Actions
export const createSessionAtom = atom(
  null,
  (get, set, newSession: Omit<Session, 'id' | 'totalAttendees' | 'totalLate' | 'createdAt'>) => {
    const sessions = get(sessionsAtom);
    const session: Session = {
      ...newSession,
      id: `session-${Date.now()}`,
      totalAttendees: 0,
      totalLate: 0,
      createdAt: new Date().toISOString()
    };
    
    set(sessionsAtom, [...sessions, session]);
    set(activeSessionAtom, session);
    
    // LocalStorage에 저장
    localStorage.setItem('sessions', JSON.stringify([...sessions, session]));
    
    return session;
  }
);

export const updateSessionStatsAtom = atom(
  null,
  (get, set, { sessionId, isLate }: { sessionId: string; isLate: boolean }) => {
    const sessions = get(sessionsAtom);
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          totalAttendees: session.totalAttendees + 1,
          totalLate: isLate ? session.totalLate + 1 : session.totalLate
        };
      }
      return session;
    });
    
    set(sessionsAtom, updatedSessions);
    localStorage.setItem('sessions', JSON.stringify(updatedSessions));
  }
);

export const toggleSessionActiveAtom = atom(
  null,
  (get, set, sessionId: string) => {
    const sessions = get(sessionsAtom);
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          isActive: !session.isActive
        };
      }
      return session;
    });
    
    set(sessionsAtom, updatedSessions);
    localStorage.setItem('sessions', JSON.stringify(updatedSessions));
  }
);

// LocalStorage 초기화
export const initializeSessionsAtom = atom(
  null,
  (get, set) => {
    const savedSessions = localStorage.getItem('sessions');
    if (savedSessions) {
      set(sessionsAtom, JSON.parse(savedSessions));
    }
  }
);