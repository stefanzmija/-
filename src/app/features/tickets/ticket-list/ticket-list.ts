import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../../core/auth.service';
import { Category } from '../../../core/models/category.model';
import { ACTIVE_STATUSES, DONE_STATUSES, TicketPriority, TicketView } from '../../../core/models/ticket.model';
import { TicketsService, dbErrorMessage } from '../tickets.service';
import { Icon, IconName } from '../../../shared/icon/icon';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { PriorityIcon } from '../../../shared/priority-icon/priority-icon';
import { Avatar } from '../../../shared/avatar/avatar';
import { RelativeTimePipe } from '../../../shared/relative-time.pipe';

type Tab = 'all' | 'active' | 'waiting' | 'unassigned' | 'mine' | 'done';
type Sort = 'newest' | 'updated' | 'priority';

interface Stat {
  label: string;
  value: number;
  icon: IconName;
  tone: string;
  tab: Tab;
  urgent?: boolean;
}

const PRIORITY_RANK: Record<TicketPriority, number> = { high: 0, normal: 1, low: 2 };

@Component({
  selector: 'app-ticket-list',
  imports: [RouterLink, Icon, StatusBadge, PriorityIcon, Avatar, RelativeTimePipe],
  templateUrl: './ticket-list.html',
})
export class TicketList implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly service = inject(TicketsService);

  protected readonly tickets = signal<TicketView[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly query = signal('');
  protected readonly tab = signal<Tab>('all');
  protected readonly category = signal<number | null>(null);
  protected readonly priority = signal<TicketPriority | null>(null);
  protected readonly sort = signal<Sort>('newest');

  protected readonly tabs = computed<{ id: Tab; label: string }[]>(() =>
    this.auth.isStaff()
      ? [
          { id: 'all', label: 'Сите' },
          { id: 'active', label: 'Активни' },
          { id: 'unassigned', label: 'Недоделени' },
          { id: 'mine', label: 'Мои' },
          { id: 'done', label: 'Завршени' },
        ]
      : [
          { id: 'all', label: 'Сите' },
          { id: 'active', label: 'Активни' },
          { id: 'waiting', label: 'Чекаат мене' },
          { id: 'done', label: 'Завршени' },
        ],
  );

  protected readonly counts = computed(() => {
    const list = this.tickets();
    const me = this.auth.userId();
    const active = list.filter((t) => ACTIVE_STATUSES.includes(t.status));
    return {
      all: list.length,
      active: active.length,
      waiting: list.filter((t) => t.status === 'waiting_student').length,
      unassigned: active.filter((t) => !t.assigned_to).length,
      mine: active.filter((t) => t.assigned_to === me).length,
      done: list.filter((t) => DONE_STATUSES.includes(t.status)).length,
      urgent: active.filter((t) => t.priority === 'high').length,
    };
  });

  protected readonly stats = computed<Stat[]>(() => {
    const c = this.counts();
    if (this.auth.isStaff()) {
      return [
        { label: 'Активни барања', value: c.active, icon: 'inbox', tone: 'bg-brand-50 text-brand-600', tab: 'active' },
        { label: 'Недоделени', value: c.unassigned, icon: 'hand', tone: 'bg-amber-50 text-amber-600', tab: 'unassigned' },
        { label: 'Доделени на мене', value: c.mine, icon: 'user-check', tone: 'bg-violet-50 text-violet-600', tab: 'mine' },
        { label: 'Висок приоритет', value: c.urgent, icon: 'flag', tone: 'bg-rose-50 text-rose-600', tab: 'active', urgent: true },
      ];
    }
    return [
      { label: 'Вкупно барања', value: c.all, icon: 'ticket', tone: 'bg-slate-100 text-slate-600', tab: 'all' },
      { label: 'Во тек', value: c.active, icon: 'clock', tone: 'bg-brand-50 text-brand-600', tab: 'active' },
      { label: 'Чекаат твој одговор', value: c.waiting, icon: 'message', tone: 'bg-violet-50 text-violet-600', tab: 'waiting' },
      { label: 'Завршени', value: c.done, icon: 'check-circle', tone: 'bg-emerald-50 text-emerald-600', tab: 'done' },
    ];
  });

  protected readonly filtered = computed(() => {
    const me = this.auth.userId();
    const q = this.query().trim().toLowerCase().replace('#', '');
    const cat = this.category();
    const prio = this.priority();

    const list = this.tickets().filter((t) => {
      if (!this.matchesTab(t, me)) return false;
      if (cat !== null && t.category_id !== cat) return false;
      if (prio !== null && t.priority !== prio) return false;
      if (!q) return true;
      return (
        String(t.id) === q ||
        t.title.toLowerCase().includes(q) ||
        (t.requester?.full_name ?? '').toLowerCase().includes(q) ||
        (t.requester?.student_index ?? '').includes(q)
      );
    });

    return list.sort((a, b) => {
      if (this.sort() === 'priority' && a.priority !== b.priority) {
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      }
      if (this.sort() === 'updated') return b.updated_at.localeCompare(a.updated_at);
      return b.created_at.localeCompare(a.created_at);
    });
  });

  protected readonly hasFilters = computed(
    () => !!this.query() || this.category() !== null || this.priority() !== null || this.tab() !== 'all',
  );

  private channel: RealtimeChannel | null = null;

  async ngOnInit() {
    await this.load();
    this.categories.set(await this.service.getCategories());
    this.channel = this.service.watchAllTickets(() => this.load(true));
  }

  ngOnDestroy() {
    this.service.unwatch(this.channel);
  }

  protected async load(silent = false) {
    if (!silent) this.loading.set(true);
    this.error.set(null);
    try {
      this.tickets.set(await this.service.getTickets());
    } catch (e) {
      this.error.set(dbErrorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  private matchesTab(t: TicketView, me: string | null): boolean {
    const active = ACTIVE_STATUSES.includes(t.status);
    switch (this.tab()) {
      case 'active':
        return active;
      case 'waiting':
        return t.status === 'waiting_student';
      case 'unassigned':
        return active && !t.assigned_to;
      case 'mine':
        return active && t.assigned_to === me;
      case 'done':
        return DONE_STATUSES.includes(t.status);
      default:
        return true;
    }
  }

  protected isSelected(s: Stat): boolean {
    return this.tab() === s.tab && (s.urgent ? this.priority() === 'high' : this.priority() === null);
  }

  protected selectStat(s: Stat) {
    this.tab.set(s.tab);
    this.priority.set(s.urgent ? 'high' : null);
  }

  protected selectTab(tab: Tab) {
    this.tab.set(tab);
    this.priority.set(null);
  }

  protected clearFilters() {
    this.query.set('');
    this.tab.set('all');
    this.category.set(null);
    this.priority.set(null);
  }

  protected setCategory(value: string) {
    this.category.set(value ? Number(value) : null);
  }

  protected setPriority(value: string) {
    this.priority.set(value ? (value as TicketPriority) : null);
  }

  protected setSort(value: string) {
    this.sort.set(value as Sort);
  }
}
