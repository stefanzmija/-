export type UserRole = 'student' | 'staff' | 'admin';

export interface Profile {
  id: string;
  full_name: string;
  student_index: string | null;
  role: UserRole;
  created_at: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Студент',
  staff: 'Референт',
  admin: 'Администратор',
};

export const ROLE_CLASSES: Record<UserRole, string> = {
  student: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  staff: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  admin: 'bg-violet-50 text-violet-700 ring-violet-600/20',
};
