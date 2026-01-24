/**
 * 공통 타입 정의
 */

import type { Database } from './database';

// ================================================
// Database Types (편의 타입)
// ================================================

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// ================================================
// Entity Types
// ================================================

// Profile
export type Profile = Tables<'profiles'>;
export type ProfileInsert = TablesInsert<'profiles'>;
export type ProfileUpdate = TablesUpdate<'profiles'>;

// Contract
export type Contract = Tables<'contracts'>;
export type ContractInsert = TablesInsert<'contracts'>;
export type ContractUpdate = TablesUpdate<'contracts'>;

// Signature
export type Signature = Tables<'signatures'>;
export type SignatureInsert = TablesInsert<'signatures'>;

// Credit
export type Credit = Tables<'credits'>;
export type CreditTransaction = Tables<'credit_transactions'>;

// Payment
export type Payment = Tables<'payments'>;

// Notification
export type Notification = Tables<'notifications'>;

// Chat
export type ChatMessage = Tables<'chat_messages'>;

// AI Review
export type AIReview = Tables<'ai_reviews'>;

// ================================================
// Enum Types
// ================================================

export type UserRole = Enums<'user_role'>;
export type ContractStatus = Enums<'contract_status'>;
export type SignerRole = Enums<'signer_role'>;
export type CreditType = Enums<'credit_type'>;
export type NotificationType = Enums<'notification_type'>;
export type BusinessSize = Enums<'business_size'>;

// ================================================
// Extended Types (with relations)
// ================================================

export interface ContractWithSignatures extends Contract {
  signatures: Pick<Signature, 'signer_role' | 'signed_at'>[];
}

export interface ContractWithDetails extends Contract {
  signatures: Signature[];
  employer?: Pick<Profile, 'id' | 'name' | 'phone' | 'avatar_url'>;
  worker?: Pick<Profile, 'id' | 'name' | 'phone' | 'avatar_url'> | null;
}

// ================================================
// Form Types
// ================================================

export interface ContractFormData {
  businessSize: BusinessSize;
  workerName: string;
  hourlyWage: number;
  includesWeeklyAllowance: boolean;
  startDate: string;
  endDate: string | null;
  workDays: string[] | null;
  workDaysPerWeek: number | null;
  workStartTime: string;
  workEndTime: string;
  breakMinutes: number;
  workLocation: string;
  jobDescription: string;
  payDay: number;
}

export interface WorkerOnboardingData {
  ssn: string;
  bankName: string;
  accountNumber: string;
}

// ================================================
// AI Review Types
// ================================================

export interface AIReviewResult {
  overall_status: 'pass' | 'warning' | 'fail';
  items: AIReviewItem[];
}

export interface AIReviewItem {
  category: 'minimum_wage' | 'break_time' | 'required_fields' | 'weekly_allowance';
  status: 'pass' | 'warning' | 'fail';
  title: string;
  description: string;
  suggestion: string | null;
}

// ================================================
// API Response Types
// ================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ================================================
// Action Result Types
// ================================================

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ================================================
// Component Props Types
// ================================================

export interface ContractCardProps {
  contract: ContractWithSignatures;
  onClick?: () => void;
}

export interface BadgeVariant {
  variant: 'waiting' | 'complete' | 'expired';
}
