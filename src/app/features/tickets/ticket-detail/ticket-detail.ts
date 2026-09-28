import { Component, OnDestroy, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';
import { CommentView } from '../../../core/models/comment.model';
import {
  PRIORITY_META,
  STATUS_META,
  STATUS_ORDER,
  TicketPatch,
  TicketPriority,
  TicketStatus,
  TicketView,
  isActive,
} from '../../../core/models/ticket.model';
import { TicketsService, dbErrorMessage } from '../tickets.service';
import { Icon } from '../../../shared/icon/icon';
import { Avatar } from '../../../shared/avatar/avatar';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { PriorityIcon } from '../../../shared/priority-icon/priority-icon';
import { RelativeTimePipe } from '../../../shared/relative-time.pipe';

@Component({
  selector: 'app-ticket-detail',
  imports: [RouterLink, DatePipe, Icon, Avatar, StatusBadge, PriorityIcon, RelativeTimePipe],
  templateUrl: './ticket-detail.html',
})
export class TicketDetail implements OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly service = inject(TicketsService);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();

  protected readonly ticket = signal<TicketView | null>(null);
  protected readonly comments = signal<CommentView[]>([]);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly reply = signal('');
  protected readonly sending = signal(false);
  protected readonly busy = signal(false);

  protected readonly statuses = STATUS_ORDER;
  protected readonly statusMeta = STATUS_META;
  protected readonly priorityMeta = PRIORITY_META;
  protected readonly priorities: TicketPriority[] = ['low', 'normal', 'high'];
  protected readonly isActive = isActive;

  protected readonly isOwner = computed(() => this.ticket()?.created_by === this.auth.userId());
  protected readonly assignedToMe = computed(() => this.ticket()?.assigned_to === this.auth.userId());
  protected readonly canReply = computed(() => {
    const t = this.ticket();
    if (!t) return false;
    return this.auth.isStaff() || isActive(t.status) || t.status === 'resolved';
  });

  private channel: RealtimeChannel | null = null;

  constructor() {
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.open(id));
    });
  }

  ngOnDestroy() {
    this.service.unwatch(this.channel);
  }

  private async open(id: number) {
    this.service.unwatch(this.channel);
    this.loading.set(true);
    this.notFound.set(false);

    try {
      await this.refresh(id);
      if (!this.ticket()) this.notFound.set(true);
    } catch {
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }

    this.channel = this.service.watchTicket(id, () => this.refresh(id));
  }

  private async refresh(id: number) {
    const [ticket, comments] = await Promise.all([this.service.getById(id), this.service.getComments(id)]);
    this.ticket.set(ticket);
    this.comments.set(comments);
  }

  protected isStaffComment(c: CommentView): boolean {
    return c.author?.role === 'staff' || c.author?.role === 'admin';
  }

  protected async sendReply() {
    const t = this.ticket();
    const body = this.reply().trim();
    if (!t || !body) return;

    this.sending.set(true);
    try {
      await this.service.addComment(t.id, body);
      this.reply.set('');
      await this.refresh(t.id);
    } catch (e) {
      this.toast.error(dbErrorMessage(e));
    } finally {
      this.sending.set(false);
    }
  }

  private async update(patch: TicketPatch, message: string): Promise<boolean> {
    const t = this.ticket();
    if (!t) return false;

    this.busy.set(true);
    try {
      await this.service.update(t.id, patch);
      await this.refresh(t.id);
      this.toast.success(message);
      return true;
    } catch (e) {
      this.toast.error(dbErrorMessage(e));
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  protected async onStatusSelect(select: HTMLSelectElement) {
    const status = select.value as TicketStatus;
    const ok = await this.update({ status }, `Статусот е сменет во „${STATUS_META[status].label}“.`);
    if (!ok) select.value = this.ticket()?.status ?? '';
  }

  protected async onPrioritySelect(select: HTMLSelectElement) {
    const priority = select.value as TicketPriority;
    const ok = await this.update({ priority }, `Приоритетот е „${PRIORITY_META[priority].label}“.`);
    if (!ok) select.value = this.ticket()?.priority ?? '';
  }

  protected assignToMe() {
    const patch: TicketPatch = { assigned_to: this.auth.userId() };
    if (this.ticket()?.status === 'open') patch.status = 'in_progress';
    this.update(patch, 'Барањето е доделено на тебе.');
  }

  protected unassign() {
    this.update({ assigned_to: null }, 'Барањето е ослободено.');
  }

  protected closeAsOwner() {
    if (!confirm('Да го затворам барањето?')) return;
    this.update({ status: 'closed' }, 'Барањето е затворено.');
  }
}
