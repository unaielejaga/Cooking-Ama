import { User } from '@supabase/supabase-js';

export type NotificationType = 'replication' | 'comment' | 'rating' | 'group_invite' | 'group_share';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string | null;
  data: Record<string, any> | null;
  read: boolean;
  created_at: string;
}

export type PushPlatform = 'android' | 'ios' | 'web';

export interface PushToken {
  user_id: string;
  token: string;
  platform: PushPlatform;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (data: SignUpData) => Promise<{ error?: string }>;
  signIn: (data: SignInData) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Ingredient {
  id: string;
  quantity: string;
  unit: string;
  name: string;
}

export interface Step {
  id: string;
  step_number: number;
  description: string;
}

export interface Recipe {
  id: string;
  author_id: string;
  title: string;
  description: string | null;
  ingredients: Ingredient[];
  steps: Step[];
  image_url: string | null;
  is_public: boolean;
  difficulty: Difficulty | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  author?: Profile;
  avg_rating?: number;
  replication_count?: number;
  favorite_count?: number;
}

export interface RecipeInput {
  title: string;
  description?: string;
  ingredients: Ingredient[];
  steps: Step[];
  image_url?: string;
  is_public: boolean;
  difficulty?: Difficulty;
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  tags: string[];
  shared_with?: {
    users?: string[];
    groups?: string[];
  };
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile?: Profile;
}

export interface GroupWithDetails extends Group {
  member_count: number;
  recipe_count: number;
  is_admin: boolean;
}

export interface RecipeShare {
  id: string;
  recipe_id: string;
  group_id: string;
  shared_at: string;
  recipe?: Recipe;
}

export interface Replication {
  id: string;
  recipe_id: string;
  user_id: string;
  image_url: string | null;
  comment: string | null;
  rating: number | null;
  created_at: string;
  user?: Profile;
}

export interface ReplicationInput {
  image_url?: string | null;
  comment?: string;
  rating?: number;
}

export interface ReplicationReaction {
  id: string;
  replication_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}
