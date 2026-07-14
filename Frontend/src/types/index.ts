// src/types/index.ts

export interface Board {
  id: string;
  title: string;
  description?: string;
  // Lists will be populated when fetching a single board
  lists?: List[];
}

export interface List {
  id: string;
  board_id: string;
  title: string;
  position?: number;
  // Cards will be populated when fetching a board with its lists
  cards?: Card[];
}

export interface Card {
  id: string;
  list_id: string;
  title: string;
  description?: string;
  position?: number;
  due_date?: string;
  assigned_to?: string; // user ID
  is_completed?: boolean;
  // optional nested data
  comments?: Comment[];
  labels?: Label[];
}

export interface Comment {
  id: string;
  card_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface Label {
  id: string;
  board_id: string;
  name: string;
  color: string;
}

export interface Member {
  id: string;
  board_id: string;
  user_id: string;
  role: string; // e.g., 'owner', 'member'
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  bio?: string;
  avatarUrl?: string;
  proTier?: boolean;
}
