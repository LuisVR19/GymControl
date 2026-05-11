export type UserRole = 'OWNER' | 'CLIENT';
export type PaymentMethod = 'tarjeta' | 'transferencia' | 'efectivo' | 'outro';
export type MembershipPaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded';
export type MembershipStatus = 'active' | 'pending' | 'expired';
export type ClientStatus = 'activo' | 'inactivo' | 'moroso';

export interface GymRow {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  created_at: string;
}

export interface ProfileRow {
  id: string;
  gym_id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole | null;
  created_at: string;
}

export interface GymPlanRow {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_days: number;
  is_active: boolean;
  color: string;
  features: string[];
  access_type: string;
  max_visits: number | null;
  created_at: string;
}

export interface UserMembershipRow {
  id: string;
  user_id: string;
  gym_id: string;
  plan_id: string;
  start_date: string;
  expiration_date: string;
  next_payment_date: string;
  payment_status: MembershipStatus;
  is_current: boolean;
  scheduled_plan_id: string | null;
  created_at: string;
}

export interface MembershipPaymentRow {
  id: string;
  membership_id: string;
  amount: number;
  payment_date: string;
  method: PaymentMethod;
  period_from: string | null;
  period_to: string | null;
  status: MembershipPaymentStatus;
  notes: string | null;
  created_at: string;
}

export interface RoutineRow {
  id: string;
  gym_id: string;
  name: string | null;
  description: string | null;
  created_at: string;
}

export interface ExerciseRow {
  id: string;
  gym_id: string;
  name: string;
  description: string | null;
  video_url: string | null;
  youtube_url: string | null;
  image_url: string | null;
  muscle_group: string | null;
  created_at: string;
}

export interface RoutineExerciseRow {
  id: string;
  routine_id: string;
  exercise_id: string;
  sets: number | null;
  reps: number | null;
  rest_seconds: number | null;
  day_number: number | null;
  order_number: number | null;
  day_label: string | null;
}

export interface NotificationRow {
  id: number;
  gym_id: string;
  user_id: string;
  cat: 'critical' | 'warning' | 'info';
  sender: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export interface AttendanceRow {
  id: string;
  gym_id: string;
  user_id: string;
  checked_in_at: string;
  checked_out_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface ClientProgressRow {
  id: string;
  user_id: string;
  date: string;
  weight: number | null;
  body_fat: number | null;
  notes: string | null;
  created_at: string;
}

export interface VClientRow {
  id: string;
  gym_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  join_date: string;
  membership_id: string | null;
  payment_status: MembershipStatus | null;
  next_payment_date: string | null;
  expiration_date: string | null;
  plan_id: string | null;
  plan_name: string | null;
  monthly_fee: number | null;
  assigned_routine_id: string | null;
  assigned_routine_name: string | null;
  attendance_this_month: number;
  last_workout: string | null;
  current_weight: number | null;
  status: ClientStatus;
}

export interface VPaymentRow {
  id: string;
  membership_id: string;
  client_id: string;
  client_name: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  period_from: string | null;
  period_to: string | null;
  status: MembershipPaymentStatus;
  notes: string | null;
  created_at: string;
  gym_id: string;
  concept: string;
  days_late: number;
}

export interface Database {
  public: {
    Tables: {
      gyms: { Row: GymRow; Insert: Partial<GymRow>; Update: Partial<GymRow> };
      profiles: { Row: ProfileRow; Insert: Partial<ProfileRow>; Update: Partial<ProfileRow> };
      gym_plans: { Row: GymPlanRow; Insert: Partial<GymPlanRow>; Update: Partial<GymPlanRow> };
      user_memberships: { Row: UserMembershipRow; Insert: Partial<UserMembershipRow>; Update: Partial<UserMembershipRow> };
      membership_payments: { Row: MembershipPaymentRow; Insert: Partial<MembershipPaymentRow>; Update: Partial<MembershipPaymentRow> };
      routines: { Row: RoutineRow; Insert: Partial<RoutineRow>; Update: Partial<RoutineRow> };
      exercises: { Row: ExerciseRow; Insert: Partial<ExerciseRow>; Update: Partial<ExerciseRow> };
      routine_exercises: { Row: RoutineExerciseRow; Insert: Partial<RoutineExerciseRow>; Update: Partial<RoutineExerciseRow> };
      attendance: { Row: AttendanceRow; Insert: Partial<AttendanceRow>; Update: Partial<AttendanceRow> };
      client_progress: { Row: ClientProgressRow; Insert: Partial<ClientProgressRow>; Update: Partial<ClientProgressRow> };
    };
    Views: {
      v_clients: { Row: VClientRow };
      v_payments: { Row: VPaymentRow };
    };
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      payment_method: PaymentMethod;
    };
  };
}
