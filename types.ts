
export enum AppView {
  ONBOARDING = 'ONBOARDING',
  CHAT = 'CHAT',
  DASHBOARD = 'DASHBOARD',
  RESOURCES = 'RESOURCES',
  CRISIS = 'CRISIS'
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isCrisis?: boolean;
}

export interface MoodEntry {
  date: string;
  score: number; // 1-10
  emotion: string; // e.g., "Anxious", "Happy"
  notes: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: 'meditation' | 'article' | 'hotline';
  link?: string;
  icon?: string;
}

export enum EmotionalState {
  NEUTRAL = 'NEUTRAL',
  HAPPY = 'HAPPY',
  SAD = 'SAD',
  ANXIOUS = 'ANXIOUS',
  CRISIS = 'CRISIS'
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  messageCount: number;
  durationSeconds: number;
}

export interface UserSettings {
  reminderEnabled: boolean;
  reminderTime: string; // "HH:MM" format, e.g., "20:00"
  hasCompletedOnboarding: boolean;
}
