import { Component, computed, input } from '@angular/core';
import { STATUS_META, TicketStatus } from '../../core/models/ticket.model';

@Component({
  selector: 'app-status-badge',
  template: `
    <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap" [class]="meta().badge">
      <span class="size-1.5 rounded-full" [class]="meta().dot"></span>
      {{ meta().label }}
    </span>
  `,
})
export class StatusBadge {
  readonly status = input.required<TicketStatus>();
  protected readonly meta = computed(() => STATUS_META[this.status()]);
}
