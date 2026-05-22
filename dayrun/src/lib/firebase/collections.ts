export const COLLECTIONS = {
  users: "users",
  usernames: "usernames",
  events: (uid: string) => `users/${uid}/events` as const,
} as const;

export type UserDoc = {
  email: string;
  displayName: string | null;
  photoURL: string | null;
  username: string | null;
  publicProfile: boolean;
  createdAt: number;
  lastSyncedAt: number | null;
};

export type EventDoc = {
  googleEventId: string;
  summary: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  description: string | null;
  isPublic: boolean;
  syncedAt: number;
  source: "google";
};
