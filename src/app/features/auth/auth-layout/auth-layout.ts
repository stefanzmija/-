import { Component, input } from '@angular/core';
import { BrandMark } from '../../../shared/brand-mark/brand-mark';
import { Icon, IconName } from '../../../shared/icon/icon';
import { StatusBadge } from '../../../shared/status-badge/status-badge';

/** Split screen: brand panel on the left, the page's form (projected) on the right. */
@Component({
  selector: 'app-auth-layout',
  imports: [BrandMark, Icon, StatusBadge],
  host: { class: 'flex flex-1' },
  template: `
    <div class="grid w-full lg:grid-cols-2">
      <aside class="relative isolate hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col">
        <div class="bg-grid-dark absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]"></div>
        <div class="absolute -top-32 -left-32 -z-10 size-[28rem] rounded-full bg-brand-600/40 blur-3xl"></div>
        <div class="absolute -right-24 bottom-0 -z-10 size-80 rounded-full bg-accent/20 blur-3xl"></div>

        <app-brand-mark [dark]="true" />

        <div class="my-auto max-w-md py-12">
          <h2 class="text-4xl leading-tight font-semibold tracking-tight text-balance">{{ headline() }}</h2>
          <ul class="mt-10 space-y-5">
            @for (point of points; track point.text) {
              <li class="flex items-start gap-4">
                <span class="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent ring-1 ring-white/15">
                  <app-icon [name]="point.icon" class="size-4" />
                </span>
                <span class="pt-1.5 text-sm leading-relaxed text-white/70">{{ point.text }}</span>
              </li>
            }
          </ul>

          <div class="mt-12 rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur">
            <div class="flex items-center justify-between gap-3">
              <p class="truncate text-sm font-medium">Потврда за редовен студент</p>
              <app-status-badge status="resolved" />
            </div>
            <div class="mt-3 flex items-center gap-2 text-xs text-white/40">
              <span class="font-mono">#128</span> · Решено за 2 часа
            </div>
          </div>
        </div>

        <p class="text-xs text-white/40">ФИНКИ · Универзитет „Св. Кирил и Методиј“ во Скопје</p>
      </aside>

      <div class="flex items-center justify-center px-4 py-12 sm:px-8">
        <div class="motion-preset-fade motion-translate-y-in-25 motion-duration-500 w-full max-w-sm">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class AuthLayout {
  readonly headline = input('Сите барања до студентската служба — на едно место.');

  protected readonly points: { icon: IconName; text: string }[] = [
    { icon: 'zap', text: 'Поднеси барање за помалку од минута, од каде било.' },
    { icon: 'bell', text: 'Следи го статусот и одговорите на референтот во живо.' },
    { icon: 'shield-check', text: 'Твоите барања ги гледаш само ти и службата.' },
  ];
}
