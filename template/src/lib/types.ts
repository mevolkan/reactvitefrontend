// Mirrors app/dtos/*.py in the backend.
export interface User {
  id: string
  name: string
  email: string
  phone_number: string | null
  is_email_verified: boolean
  created_at: string
  updated_at: string
}

export interface RegisterRequest {
  name: string
  email: string
  password: string
  phone_number?: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ResetPasswordRequest {
  email: string
  code: string
  new_password: string
}

export interface MessageResponse {
  message: string
}

export interface HealthResponse {
  status: string
  message: string | null
}
