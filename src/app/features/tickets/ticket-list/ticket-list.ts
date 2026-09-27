import { Component, ElementRef, OnDestroy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { RealtimeChannel } from '@supabase/supabase-js';
import { AuthService } from '../../../core/auth.service';
import { Category, categoryIcon } from '../../../core/models/category.model';
import {
  ACTIVE_STATUSES,
  DONE_STATUSES,
  PRIORITY_META,
  TicketPriority,
  TicketView,
} from '../../../core/models/ticket.model';
import { TicketsService, dbErrorMessage } from '../tickets.service';
import { Icon, IconName } from '../../../shared/icon/icon';
import { StatusBadge } from '../../../shared/status-badge/status-badge';
import { PriorityIcon } from '../../../shared/priority-icon/priority-icon';
import { Avatar } from '../../../shared/avatar/avatar';
import { RelativeTimePipe } from '../../../shared/relative-time.pipe';

type Tab = 'all' | 'active' | 'waiting' | 'unassigned' | 'mine' | 'done';
type Sort = 'newest' | 'updated' | 'priority';

const PRIORITY_RANK: Record<TicketPriority, number> = { high: 0, normal: 1, low: 2 };

@Component({
  selector: 'app-ticket-list',
  imports: [RouterLink, Icon, StatusBadge, PriorityIcon, Avatar, RelativeTimePipe],
  templateUrl: './ticket-list.html',
  host: {
    class: 'block',
    '(document:keydown)': 'onKey($event)',
  },
})
export class TicketList implements OnInit, OnDestroy {
  protected readonly auth = inject(AuthService);
  private readonly service = inject(TicketsService);
  private readonly router = inject(Router);

  private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('search');

  protected readonly tickets = signal<TicketView[]>([]);
  protected readonly categories = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  protected readonly query = signal('');
  protected readonly tab = signal<Tab>('all');
  protected readonly category = signal<number | null>(null);
  protected readonly priority = signal<TicketPriority | null>(null);
  protected readonly sort = signal<Sort>('newest');

  protected readonly priorityMeta = PRIORITY_META;
  protected readonly categoryIcon = categoryIcon;

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
    } satisfies Record<Tab | 'urgent', number>;
  });

  protected readonly stats = computed<
    { label: string; value: number; icon: IconName; tone: string; tab: Tab; urgent?: boolean }[]
  >(() => {
    const c = this.counts();
    return this.auth.isStaff()
      ? [
          { label: 'Активни барања', value: c.active, icon: 'inbox', tone: 'bg-brand-50 text-brand-600', tab: 'active' },
          { label: 'Недоделени', value: c.unassigned, icon: 'hand', tone: 'bg-amber-50 text-amber-600', tab: 'unassigned' },
          { label: 'Доделени на мене', value: c.mine, icon: 'user-check', tone: 'bg-violet-50 text-violet-600', tab: 'mine' },
          { label: 'Висок приоритет', value: c.urgent, icon: 'flag', tone: 'bg-rose-50 text-rose-600', tab: 'active', urgent: true },
        ]
      : [
          { label: 'Вкупно барања', value: c.all, icon: 'ticket', tone: 'bg-slate-100 text-slate-600', tab: 'all' },
          { label: 'Во тек', value: c.active, icon: 'clock', tone: 'bg-brand-50 text-brand-600', tab: 'active' },
          { label: 'Чекаат твој одговор', value: c.waiting, icon: 'message', tone: 'bg-violet-50 text-violet-600', tab: 'waiting' },
          { label: 'Завршени', value: c.done, icon: 'check-circle', tone: 'bg-emerald-50 text-emerald-600', tab: 'done' },
        ];
  });

  protected readonly filtered = computed(() => {
    const me = this.auth.userId();
    const q = this.query().trim().toLowerCase().replace(/^#/, '');
    const tab = this.tab();
    const cat = this.category();
    const prio = this.priority();

    const list = this.tickets().filter((t) => {
      switch (tab) {
        case 'active': if (!ACTIVE_STATUSES.includes(t.status)) return false; break;
        case 'waiting': if (t.status !== 'waiting_student') return false; break;
        case 'unassigned': if (t.assigned_to || !ACTIVE_STATUSES.includes(t.status)) return false; break;
        case 'mine': if (t.assigned_to !== me || !ACTIVE_STATUSES.includes(t.status)) return false; break;
        case 'done': if (!DONE_STATUSES.includes(t.status)) return false; break;
      }
      if (cat !== null && t.category_id !== cat) return false;
      if (prio !== null && t.priority !== prio) return false;
      if (!q) return true;
      return (
        String(t.id) === q ||
        t.title.toLowerCase().includes(q) ||
        (t.requester?.full_name.toLowerCase().includes(q) ?? false) ||
        (t.requester?.student_index?.includes(q) ?? false)
      );
    });

    const sort = this.sort();
    return [...list].sort((a, b) => {
      if (sort === 'priority') {
        const diff = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (diff) return diff;
      }
      const key = sort === 'updated' ? 'updated_at' : 'created_at';
      return b[key].localeCompare(a[key]);
    });
  });

  protected readonly hasFilters = computed(
    () => !!this.query() || this.category() !== null || this.priority() !== null || this.tab() !== 'all',
  );

  private channel: RealtimeChannel | null = null;
  private refreshTimer?: ReturnType<typeof setTimeout>;

  async ngOnInit() {
    await this.load();
    this.service.getCategories().then((c) => this.categories.set(c)).catch(() => {});
    this.channel = this.service.watchAllTickets(() => {
      // several rows can change at once (e.g. a comment bumps updated_at) — batch them
      clearTimeout(this.refreshTimer);
      this.refreshTimer = setTimeout(() => this.load(true), 400);
    });
  }

  ngOnDestroy() {
    clearTimeout(this.refreshTimer);
    this.service.unwatch(this.channel);
  }

  protected async load(silent = false) {
    if (!silent) this.loading.set(true);
    this.error.set(null);
    try {
      this.tickets.set(await this.service.getTickets());
    } catch (e) {
      if (!silent) this.error.set(dbErrorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected selectStat(stat: { tab: Tab; urgent?: boolean }) {
    this.tab.set(stat.tab);
    this.priority.set(stat.urgent ? 'high' : null);
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
    this.priority.set((value || null) as TicketPriority | null);
  }

  protected setSort(value: string) {
    this.sort.set(value as Sort);
  }

  /** "/" focuses search, "n" opens a new ticket (Linear-style shortcuts). */
  protected onKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement;
    if (target.closest('input, textarea, select, [contenteditable]') || event.metaKey || event.ctrlKey || event.altKey) return;

    if (event.key === '/') {
      event.preventDefault();
      this.searchInput()?.nativeElement.focus();
    } else if (event.key === 'n' && !this.auth.isStaff()) {
      event.preventDefault();
      this.router.navigate(['/tickets/new']);
    }
  }

  protected commentCount(t: TicketView): number {
    return t.comments?.[0]?.count ?? 0;
  }
}
