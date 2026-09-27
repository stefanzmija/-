import { Component, computed, input } from '@angular/core';
import { PRIORITY_META, TicketPriority } from '../../core/models/ticket.model';

/** Three signal bars, filled by priority (Linear-style). */
@Component({
  selector: 'app-priority-icon',
  host: { class: 'inline-flex items-end gap-0.5 h-3.5', '[attr.title]': 'meta().label' },
  template: `
    @for (bar of [1, 2, 3]; track bar) {
      <span class="w-[3px] rounded-full"
            [style.height.%]="bar * 33.4"
            [class]="bar <= meta().bars ? meta().color : 'bg-slate-200'"></span>
    }
  `,
})
export class PriorityIcon {
  readonly priority = input.required<TicketPriority>();
  protected readonly meta = computed(() => PRIORITY_META[this.priority()]);
}
