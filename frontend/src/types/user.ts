export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
  avatar_url?: string | null;
}

export interface UserUpdate {
  full_name?: string;
  avatar_url?: string | null;
}
