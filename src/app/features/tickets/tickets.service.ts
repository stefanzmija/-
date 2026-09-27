import { Injectable } from '@angular/core';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../core/supabase.client';
import { Category } from '../../core/models/category.model';
import { NewTicket, Ticket, TicketPatch, TicketView } from '../../core/models/ticket.model';
import { CommentView } from '../../core/models/comment.model';

/**
 * Two foreign keys point from tickets to profiles, so each join names the
 * column it follows (profiles!created_by / profiles!assigned_to).
 */
const TICKET_SELECT = `
  *,
  category:categories(id, name),
  requester:profiles!created_by(id, full_name, student_index),
  assignee:profiles!assigned_to(id, full_name),
  comments:ticket_comments(count)
`;

@Injectable({ providedIn: 'root' })
export class TicketsService {
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*').order('id');
    if (error) throw error;
    return data as Category[];
  }

  /** No user filter here: RLS returns a student's own tickets, or all of them for staff. */
  async getTickets(): Promise<TicketView[]> {
    const { data, error } = await supabase
      .from('tickets')
      .select(TICKET_SELECT)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as TicketView[];
  }

  /** Returns null when the ticket does not exist or RLS hides it. */
  async getById(id: number): Promise<TicketView | null> {
    const { data, error } = await supabase
      .from('tickets')
      .select(TICKET_SELECT)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as TicketView | null;
  }

  async create(input: NewTicket): Promise<Ticket> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('Не си најавен.');

    const { data, error } = await supabase
      .from('tickets')
      .insert({ ...input, created_by: auth.user.id })
      .select()
      .single();

    if (error) throw error;
    return data as Ticket;
  }

  async update(id: number, patch: TicketPatch): Promise<void> {
    const { data, error } = await supabase.from('tickets').update(patch).eq('id', id).select('id');
    if (error) throw error;
    if (!data?.length) throw new Error('Немаш дозвола за оваа промена.');
  }

  async getComments(ticketId: number): Promise<CommentView[]> {
    const { data, error } = await supabase
      .from('ticket_comments')
      .select('*, author:profiles!author_id(id, full_name, role)')
      .eq('ticket_id', ticketId)
      .order('created_at');

    if (error) throw error;
    return data as CommentView[];
  }

  async addComment(ticketId: number, body: string): Promise<void> {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw new Error('Не си најавен.');

    const { error } = await supabase
      .from('ticket_comments')
      .insert({ ticket_id: ticketId, body, author_id: auth.user.id });

    if (error) throw error;
  }

  /**
   * Live updates via Supabase Realtime. Needs the tables added to the
   * `supabase_realtime` publication (see supabase/02_rules_and_realtime.sql);
   * without it the app still works, it just won't auto-refresh.
   */
  watchTicket(ticketId: number, onChange: () => void): RealtimeChannel {
    return supabase
      .channel(`ticket-${ticketId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ticket_comments', filter: `ticket_id=eq.${ticketId}` },
        onChange,
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${ticketId}` },
        onChange,
      )
      .subscribe();
  }

  watchAllTickets(onChange: () => void): RealtimeChannel {
    return supabase
      .channel('tickets-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, onChange)
      .subscribe();
  }

  unwatch(channel: RealtimeChannel | null) {
    if (channel) supabase.removeChannel(channel);
  }
}

/** Supabase/Postgres errors → Macedonian text for toasts. */
export function dbErrorMessage(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? '';
  // messages raised by our own triggers are already in Macedonian
  if (/[а-шА-Ш]/.test(msg)) return msg;
  if (msg.toLowerCase().includes('failed to fetch')) return 'Нема врска со серверот.';
  if (msg.toLowerCase().includes('row-level security')) return 'Немаш дозвола за оваа акција.';
  return 'Нешто тргна наопаку. Обиди се повторно.';
}
