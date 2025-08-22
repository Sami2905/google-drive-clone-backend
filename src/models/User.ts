export interface User {
  id: string;
  email: string;
  name: string;
  plan: 'free' | 'premium' | 'enterprise';
  google_id?: string;
  password_hash?: string;
  password_reset_token?: string;
  password_reset_expires?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  plan?: 'free' | 'premium' | 'enterprise';
  google_id?: string;
}

export interface UpdateUserRequest {
  name?: string;
  plan?: 'free' | 'premium' | 'enterprise';
}
