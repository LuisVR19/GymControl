export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string | null;
  status: 'activo' | 'inactivo' | 'moroso';
  joinDate: string;
  nextPayment: string;
  monthlyFee: number;
  attendanceThisMonth: number;
  assignedRoutine?: string;
  weight?: number;
  lastWorkout?: string;
  progress?: ProgressEntry[];
}

export interface ProgressEntry {
  date: string;
  weight: number;
  bodyFat?: number;
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  days: RoutineDay[];
  assignedTo?: string[];
  createdAt: string;
}

export interface RoutineDay {
  day: string;
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  rest: string;
  notes?: string;
}

export interface GymExercise {
  id: string;
  gymId: string;
  name: string;
  description: string | null;
  videoUrl: string | null;
  youtubeUrl: string | null;
  muscleGroup: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  date: string;
  method: 'Tarjeta' | 'Transferencia' | 'Efectivo';
  concept: 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual' | 'Personalizado';
  status: 'pagado' | 'pendiente' | 'vencido';
  periodFrom?: string;
  periodTo?: string;
  note?: string;
  daysLate?: number;
}

export interface GymPlan {
  id: string;
  gymId: string;
  name: string;
  description: string | null;
  price: number;
  durationDays: number;
  isActive: boolean;
  color: string;
  features: string[];
  accessType: string;
  maxVisits: number | null;
  subscriberCount: number;
}

export interface KpiCard {
  label: string;
  value: string;
  delta: string;
  deltaType: 'ok' | 'warn' | 'danger' | 'neutral';
  sparkData?: number[];
}

export interface ActivityItem {
  who: string;
  action: string;
  time: string;
  type: 'payment' | 'workout' | 'checkin' | 'overdue' | 'routine';
}

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'danger';
  time: string;
  read: boolean;
}

export interface AppNotification {
  id: number;
  gymId: string;
  userId: string;
  cat: 'critical' | 'warning' | 'info';
  from: string;
  title: string;
  desc: string;
  read: boolean;
  t: string;
}
