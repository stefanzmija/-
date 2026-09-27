import { Component, input } from '@angular/core';

/** The FINKI "IO" mark drawn in CSS: a deep-blue bar and a sky-blue ring. */
@Component({
  selector: 'app-brand-mark',
  host: { class: 'inline-flex items-center gap-2.5' },
  template: `
    <span class="relative flex h-8 w-9 shrink-0 items-center gap-[3px]">
      <span class="h-7 w-[7px] rounded-[2px]" [class]="dark() ? 'bg-white' : 'bg-brand-700'"></span>
      <span class="size-7 rounded-full border-[6px] border-accent"></span>
    </span>
    @if (withText()) {
      <span class="flex flex-col leading-none">
        <span class="text-[15px] font-semibold tracking-tight" [class]="dark() ? 'text-white' : 'text-slate-900'">
          Студентска служба
        </span>
        <span class="mt-1 text-[10px] font-medium tracking-[0.18em] uppercase"
              [class]="dark() ? 'text-white/50' : 'text-slate-400'">
          ФИНКИ · УКИМ
        </span>
      </span>
    }
  `,
})
export class BrandMark {
  readonly withText = input(true);
  readonly dark = input(false);
}
