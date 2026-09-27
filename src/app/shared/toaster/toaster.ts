import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-toaster',
  imports: [Icon],
  host: {
    class: 'pointer-events-none fixed inset-x-4 bottom-4 z-[100] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end',
    'aria-live': 'polite',
  },
  template: `
    @for (t of toasts.toasts(); track t.id) {
      <div class="motion-preset-slide-up motion-duration-300 pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl shadow-slate-900/30 ring-1 ring-white/10">
        @switch (t.kind) {
          @case ('success') { <app-icon name="check-circle" class="mt-0.5 size-4 text-emerald-400" /> }
          @case ('error') { <app-icon name="alert" class="mt-0.5 size-4 text-rose-400" /> }
          @default { <app-icon name="info" class="mt-0.5 size-4 text-sky-400" /> }
        }
        <p class="flex-1 leading-snug">{{ t.message }}</p>
        <button type="button" (click)="toasts.dismiss(t.id)" class="-mr-1 rounded-md p-0.5 text-white/50 transition hover:text-white" aria-label="Затвори">
          <app-icon name="x" class="size-4" />
        </button>
      </div>
    }
  `,
})
export class Toaster {
  protected readonly toasts = inject(ToastService);
}
