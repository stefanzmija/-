export type TicketStatus =
  | 'open'
  | 'in_progress'
  | 'waiting_student'
  | 'resolved'
  | 'closed'
  | 'rejected';

export type TicketPriority = 'low' | 'normal' | 'high';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  category_id: number;
  status: TicketStatus;
  priority: TicketPriority;
  created_by: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketView extends Ticket {
  category: { id: number; name: string } | null;
  requester: { id: string; full_name: string; student_index: string | null } | null;
  assignee: { id: string; full_name: string } | null;
  comments?: { count: number }[];
}

export interface NewTicket {
  title: string;
  description: string;
  category_id: number;
  priority: TicketPriority;
}

export type TicketPatch = Partial<Pick<Ticket, 'status' | 'priority' | 'assigned_to'>>;

export const STATUS_ORDER: TicketStatus[] = [
  'open',
  'in_progress',
  'waiting_student',
  'resolved',
  'closed',
  'rejected',
];

export const STATUS_META: Record<
  TicketStatus,
  { label: string; badge: string; dot: string; hint: string }
> = {
  open: {
    label: 'Отворено',
    badge: 'bg-sky-50 text-sky-700',
    dot: 'bg-sky-500',
    hint: 'Чека референт да го преземе',
  },
  in_progress: {
    label: 'Во обработка',
    badge: 'bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
    hint: 'Референт работи на барањето',
  },
  waiting_student: {
    label: 'Чека студент',
    badge: 'bg-violet-50 text-violet-700',
    dot: 'bg-violet-500',
    hint: 'Потребен е твој одговор или документ',
  },
  resolved: {
    label: 'Решено',
    badge: 'bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    hint: 'Службата го означи како решено',
  },
  closed: {
    label: 'Затворено',
    badge: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
    hint: 'Барањето е завршено',
  },
  rejected: {
    label: 'Одбиено',
    badge: 'bg-rose-50 text-rose-700',
    dot: 'bg-rose-500',
    hint: 'Барањето не може да се исполни',
  },
};

export const PRIORITY_META: Record<TicketPriority, { label: string; bars: number; color: string; hint: string }> = {
  low: { label: 'Низок', bars: 1, color: 'bg-slate-400', hint: 'Нема рок' },
  normal: { label: 'Нормален', bars: 2, color: 'bg-brand-500', hint: 'Стандардно барање' },
  high: { label: 'Висок', bars: 3, color: 'bg-rose-500', hint: 'Рокот истекува наскоро' },
};

export const ACTIVE_STATUSES: TicketStatus[] = ['open', 'in_progress', 'waiting_student'];
export const DONE_STATUSES: TicketStatus[] = ['resolved', 'closed', 'rejected'];

export function isActive(status: TicketStatus): boolean {
  return ACTIVE_STATUSES.includes(status);
}
