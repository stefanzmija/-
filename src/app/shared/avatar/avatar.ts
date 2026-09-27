import { Component, computed, input } from '@angular/core';

const GRADIENTS = [
  'from-brand-500 to-accent',
  'from-violet-500 to-fuchsia-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
  'from-rose-500 to-pink-400',
  'from-sky-500 to-cyan-400',
];

/** Initials on a gradient that stays the same for the same name. */
@Component({
  selector: 'app-avatar',
  host: {
    class:
      'inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-white select-none',
    '[class]': 'gradient()',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'size() * 0.38',
    '[attr.title]': 'name()',
  },
  template: `{{ initials() }}`,
})
export class Avatar {
  readonly name = input<string | null | undefined>('');
  readonly size = input(32);

  protected readonly initials = computed(() => {
    const parts = (this.name() ?? '').trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
  });

  protected readonly gradient = computed(() => {
    const name = this.name() ?? '';
    let hash = 0;
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
    return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
  });
}
