import { UserRole } from './profile.model';

export interface TicketComment {
  id: number;
  ticket_id: number;
  author_id: string;
  body: string;
  created_at: string;
}

export interface CommentView extends TicketComment {
  author: { id: string; full_name: string; role: UserRole } | null;
}
