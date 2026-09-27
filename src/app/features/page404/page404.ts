import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-page404',
  imports: [RouterLink, Icon],
  host: { class: 'flex flex-1' },
  template: `
    <section class="relative isolate flex flex-1 items-center justify-center overflow-hidden px-4 py-24">
      <div class="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"></div>
      <div class="absolute top-1/2 left-1/2 -z-10 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-brand-300/30 to-accent/25 blur-3xl"></div>

      <div class="text-center">
        <p class="motion-preset-blur-up motion-duration-700 text-gradient text-[8rem] leading-none font-semibold tracking-tighter sm:text-[11rem]">404</p>
        <h1 class="mt-4 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">Оваа страница не постои</h1>
        <p class="mx-auto mt-3 max-w-md text-slate-500">Можеби линкот е погрешен или страницата е преместена. Ајде да те вратиме на вистинското место.</p>
        <div class="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a routerLink="/" class="btn btn-primary"><app-icon name="home" class="size-4" /> Почетна</a>
          @if (auth.isLoggedIn()) {
            <a routerLink="/tickets" class="btn btn-secondary">Мои барања <app-icon name="arrow-right" class="size-4" /></a>
          } @else {
            <a routerLink="/contact" class="btn btn-secondary">Контакт <app-icon name="arrow-right" class="size-4" /></a>
          }
        </div>
      </div>
    </section>
  `,
})
export class Page404 {
  protected readonly auth = inject(AuthService);
}
