export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  username: string;
  email: string;
  role: string;
}
