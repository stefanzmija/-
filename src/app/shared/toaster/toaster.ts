import { Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast.service';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-toaster',
  imports: [Icon],
  template: `
    <div class="fixed right-4 bottom-4 z-50 flex w-80 flex-col gap-2">
      @for (t of toasts.toasts(); track t.id) {
        <div class="motion-preset-slide-up flex items-start gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          @if (t.kind === 'success') {
            <app-icon name="check-circle" class="mt-0.5 size-4 text-emerald-400" />
          } @else if (t.kind === 'error') {
            <app-icon name="alert" class="mt-0.5 size-4 text-rose-400" />
          } @else {
            <app-icon name="info" class="mt-0.5 size-4 text-sky-400" />
          }
          <p class="flex-1">{{ t.message }}</p>
          <button type="button" (click)="toasts.dismiss(t.id)" class="text-white/50 hover:text-white">
            <app-icon name="x" class="size-4" />
          </button>
        </div>
      }
    </div>
  `,
})
export class Toaster {
  protected readonly toasts = inject(ToastService);
}
