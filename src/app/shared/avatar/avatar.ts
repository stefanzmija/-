import { Component, computed, input } from '@angular/core';

const COLORS = ['bg-brand-600', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500'];

@Component({
  selector: 'app-avatar',
  template: `
    <span class="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
          [class]="color()"
          [style.width.px]="size()"
          [style.height.px]="size()"
          [style.font-size.px]="size() * 0.38"
          [title]="name()">
      {{ initials() }}
    </span>
  `,
})
export class Avatar {
  readonly name = input<string | null | undefined>('');
  readonly size = input(32);

  protected readonly initials = computed(() => {
    const parts = (this.name() ?? '').trim().split(' ').filter((p) => p);
    if (parts.length === 0) return '?';
    const first = parts[0][0];
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase();
  });

  protected readonly color = computed(() => {
    const name = this.name() ?? '';
    return COLORS[name.length % COLORS.length];
  });
}
