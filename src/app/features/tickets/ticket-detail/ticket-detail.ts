import {
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';
import { categoryIcon } from '../../../core/models/category.model';
import { CommentView } from '../../../core/models/comment.model';
import { ROLE_LABELS } from '../../../core/models/profile.model';
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
import { Icon, IconName } from '../../../shared/icon/icon';
import { Avatar } from '../../../shared/avatar/avatar';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { PriorityIcon } from '../../../shared/priority-icon/priority-icon';
import { RelativeTimePipe } from '../../../shared/relative-time.pipe';

type Busy = 'status' | 'priority' | 'assign' | null;

@Component({
  selector: 'app-ticket-detail',
  imports: [RouterLink, DatePipe, Icon, Avatar, StatusBadge, PriorityIcon, RelativeTimePipe],
  templateUrl: './ticket-detail.html',
  host: { class: 'block' },
})
export class TicketDetail implements OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly service = inject(TicketsService);
  private readonly toast = inject(ToastService);

  /** Route param :id (bound via withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly composer = viewChild<ElementRef<HTMLTextAreaElement>>('composer');

  protected readonly ticket = signal<TicketView | null>(null);
  protected readonly comments = signal<CommentView[]>([]);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);
  protected readonly reply = signal('');
  protected readonly sending = signal(false);
  protected readonly busy = signal<Busy>(null);

  protected readonly statuses = STATUS_ORDER;
  protected readonly statusMeta = STATUS_META;
  protected readonly priorityMeta = PRIORITY_META;
  protected readonly priorities: TicketPriority[] = ['low', 'normal', 'high'];
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly categoryIcon = categoryIcon;

  protected readonly isOwner = computed(() => this.ticket()?.created_by === this.auth.userId());
  protected readonly isFinal = computed(() => {
    const s = this.ticket()?.status;
    return s === 'closed' || s === 'rejected';
  });
  protected readonly canReply = computed(() => !!this.ticket() && (this.auth.isStaff() || !this.isFinal()));
  protected readonly assignedToMe = computed(() => this.ticket()?.assigned_to === this.auth.userId());

  /** Student-facing progress: Поднесено → Во обработка → Решено → Затворено. */
  protected readonly progress = computed(() => {
    const s = this.ticket()?.status ?? 'open';
    const reached = { open: 0, in_progress: 1, waiting_student: 1, resolved: 2, closed: 3, rejected: 3 }[s];
    const steps: { label: string; icon: IconName }[] = [
      { label: 'Поднесено', icon: 'send' },
      { label: s === 'waiting_student' ? 'Чека твој одговор' : 'Во обработка', icon: 'clock' },
      { label: 'Решено', icon: 'check-circle' },
      { label: s === 'rejected' ? 'Одбиено' : 'Затворено', icon: s === 'rejected' ? 'x' : 'lock' },
    ];
    return steps.map((step, i) => ({ ...step, done: i < reached, current: i === reached }));
  });

  /** One-click status changes for staff, depending on where the ticket is. */
  protected readonly quickActions = computed(() => {
    const s = this.ticket()?.status;
    const all: { status: TicketStatus; label: string; icon: IconName; tone: string }[] = [
      { status: 'waiting_student', label: 'Побарај од студентот', icon: 'message', tone: 'hover:bg-violet-50 hover:text-violet-700' },
      { status: 'resolved', label: 'Означи решено', icon: 'check-circle', tone: 'hover:bg-emerald-50 hover:text-emerald-700' },
      { status: 'rejected', label: 'Одбиј', icon: 'x', tone: 'hover:bg-rose-50 hover:text-rose-700' },
      { status: 'in_progress', label: 'Врати во обработка', icon: 'refresh', tone: 'hover:bg-amber-50 hover:text-amber-700' },
    ];
    return all.filter((a) =>
      a.status === 'in_progress' ? s === 'resolved' || s === 'waiting_student' || s === 'rejected' : a.status !== s && s !== 'closed',
    );
  });

  private channel: RealtimeChannel | null = null;
  private refreshTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // reload whenever the :id in the URL changes
    effect(() => {
      const id = Number(this.id());
      untracked(() => this.open(id));
    });
  }

  ngOnDestroy() {
    clearTimeout(this.refreshTimer);
    this.service.unwatch(this.channel);
  }

  private async open(id: number) {
    this.service.unwatch(this.channel);
    this.loading.set(true);
    this.notFound.set(false);

    if (!Number.isInteger(id) || id <= 0) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }

    try {
      await this.refresh(id);
      if (!this.ticket()) this.notFound.set(true);
    } catch (e) {
      this.toast.error(dbErrorMessage(e));
      this.notFound.set(true);
    } finally {
      this.loading.set(false);
    }

    this.channel = this.service.watchTicket(id, () => {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = setTimeout(() => this.refresh(id).catch(() => {}), 250);
    });
  }

  private async refresh(id: number) {
    const [ticket, comments] = await Promise.all([this.service.getById(id), this.service.getComments(id)]);
    this.ticket.set(ticket);
    this.comments.set(comments);
  }

  // ---------- conversation ----------

  protected onComposerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.sendReply();
    }
  }

  protected async sendReply() {
    const t = this.ticket();
    const body = this.reply().trim();
    if (!t || !body || this.sending()) return;

    this.sending.set(true);
    try {
      await this.service.addComment(t.id, body);
      this.reply.set('');
      await this.refresh(t.id);
      if (t.status === 'waiting_student' && this.isOwner()) {
        this.toast.success('Одговорот е испратен — барањето е вратено кај референтот.');
      }
    } catch (e) {
      this.toast.error(dbErrorMessage(e));
    } finally {
      this.sending.set(false);
    }
  }

  protected focusComposer() {
    this.composer()?.nativeElement.focus();
  }

  // ---------- staff / owner actions ----------

  private async patch(patch: TicketPatch, busy: Busy, success: string): Promise<boolean> {
    const t = this.ticket();
    if (!t) return false;
    this.busy.set(busy);
    try {
      await this.service.update(t.id, patch);
      await this.refresh(t.id);
      this.toast.success(success);
      return true;
    } catch (e) {
      this.toast.error(dbErrorMessage(e));
      await this.refresh(t.id).catch(() => {});
      return false;
    } finally {
      this.busy.set(null);
    }
  }

  protected async onStatusSelect(select: HTMLSelectElement) {
    const ok = await this.setStatus(select.value as TicketStatus);
    if (!ok) select.value = this.ticket()?.status ?? select.value;
  }

  protected async setStatus(status: TicketStatus): Promise<boolean> {
    if (status === this.ticket()?.status) return true;
    return this.patch({ status }, 'status', `Статусот е сменет во „${STATUS_META[status].label}“.`);
  }

  protected setPriority(priority: TicketPriority) {
    if (priority === this.ticket()?.priority) return;
    this.patch({ priority }, 'priority', `Приоритетот е „${PRIORITY_META[priority].label}“.`);
  }

  protected assignToMe() {
    const t = this.ticket();
    const patch: TicketPatch = { assigned_to: this.auth.userId() };
    if (t?.status === 'open') patch.status = 'in_progress';
    this.patch(patch, 'assign', 'Барањето е доделено на тебе.');
  }

  protected unassign() {
    this.patch({ assigned_to: null }, 'assign', 'Барањето е ослободено.');
  }

  protected closeAsOwner() {
    if (!confirm('Да го затворам барањето? Нема да можеш повеќе да одговараш.')) return;
    this.patch({ status: 'closed' }, 'status', 'Барањето е затворено. Ти благодариме!');
  }

  protected isActive = isActive;
}
