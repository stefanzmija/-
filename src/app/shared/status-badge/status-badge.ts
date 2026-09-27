import { Component, computed, input } from '@angular/core';
import { STATUS_META, TicketStatus } from '../../core/models/ticket.model';

@Component({
  selector: 'app-status-badge',
  host: { class: 'inline-flex' },
  template: `
    <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap"
          [class]="meta().badge">
      <span class="size-1.5 rounded-full" [class]="meta().dot"></span>
      {{ meta().label }}
    </span>
  `,
})
export class StatusBadge {
  readonly status = input.required<TicketStatus>();
  protected readonly meta = computed(() => STATUS_META[this.status()]);
}
