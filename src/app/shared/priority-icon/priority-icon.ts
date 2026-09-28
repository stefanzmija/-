import { Component, computed, input } from '@angular/core';
import { PRIORITY_META, TicketPriority } from '../../core/models/ticket.model';

@Component({
  selector: 'app-priority-icon',
  template: `
    <span class="inline-flex items-end gap-0.5" [title]="meta().label">
      <span class="h-1.5 w-1 rounded-full" [class]="meta().bars >= 1 ? meta().color : 'bg-slate-200'"></span>
      <span class="h-2.5 w-1 rounded-full" [class]="meta().bars >= 2 ? meta().color : 'bg-slate-200'"></span>
      <span class="h-3.5 w-1 rounded-full" [class]="meta().bars >= 3 ? meta().color : 'bg-slate-200'"></span>
    </span>
  `,
})
export class PriorityIcon {
  readonly priority = input.required<TicketPriority>();
  protected readonly meta = computed(() => PRIORITY_META[this.priority()]);
}
