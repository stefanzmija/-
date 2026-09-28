import { Component, input } from '@angular/core';

@Component({
  selector: 'app-brand-mark',
  template: `
    <span class="flex items-center gap-2.5">
      <span class="flex items-center gap-1">
        <span class="h-7 w-2 rounded-sm" [class]="dark() ? 'bg-white' : 'bg-brand-700'"></span>
        <span class="size-7 rounded-full border-6 border-accent"></span>
      </span>
      <span class="leading-tight">
        <span class="block text-sm font-semibold" [class]="dark() ? 'text-white' : 'text-slate-900'">Студентска служба</span>
        <span class="block text-xs tracking-widest uppercase" [class]="dark() ? 'text-white/50' : 'text-slate-400'">ФИНКИ · УКИМ</span>
      </span>
    </span>
  `,
})
export class BrandMark {
  readonly dark = input(false);
}
