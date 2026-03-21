// src/utils.ts

export interface SystemInfo {
  name: string;
  description: string;
  journalPassword?: string;
}

export interface Member {
  id: string;
  name: string;
  pronouns: string;
  role: string;
  color: string;
  description: string;
}

// changeType distinguishes what triggered this history entry
// 'front' = new front set, 'mood' | 'location' | 'note' = in-session update
export type HistoryChangeType = 'front' | 'mood' | 'location' | 'note';

export interface HistoryEntry {
  memberIds: string[];
  startTime: number;
  endTime: number | null;
  note: string;
  mood?: string;
  location?: string;
  changeType?: HistoryChangeType;
  changeTime?: number; // when this specific change happened (for non-front entries)
}

export interface FrontState {
  memberIds: string[];
  startTime: number;
  note: string;
  mood?: string;
  location?: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  authorIds: string[];
  hashtags: string[];
  password?: string;
  timestamp: number;
}

export interface ShareSettings {
  showFront: boolean;
  showMembers: boolean;
  showDescriptions: boolean;
}

export interface AppSettings {
  locations: string[];
  customMoods: string[];
  lightMode: boolean;
  gpsEnabled: boolean;
}

export interface ExportPayload {
  _meta: {version: string; app: string; exportedAt: string;};
  system: SystemInfo;
  members: Member[];
  frontHistory: HistoryEntry[];
  journal: JournalEntry[];
}

export const DEFAULT_MOODS = [
  'Calm', 'Happy', 'Anxious', 'Tired', 'Energetic',
  'Dissociated', 'Grounded', 'Irritable', 'Sad', 'Focused',
];

export const uid = (): string =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

export const fmtTime = (ts: number): string =>
  new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  });

export const fmtDate = (ts: number): string =>
  new Date(ts).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

export const fmtDur = (start: number, end?: number | null): string => {
  const ms = (end ?? Date.now()) - start;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return m > 0 ? `${m}m` : '<1m';
};

export const getInitials = (name: string): string =>
  name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

export const isValidHex = (hex: string): boolean =>
  /^#[0-9A-Fa-f]{6}$/.test(hex);

export const normalizeHex = (input: string): string =>
  (input.startsWith('#') ? input : `#${input}`).toUpperCase();
