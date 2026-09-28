import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page404',
  imports: [RouterLink],
  template: `
    <section class="px-4 py-32 text-center">
      <p class="text-gradient text-8xl font-semibold">404</p>
      <h1 class="mt-4 text-2xl font-semibold text-slate-900">Оваа страница не постои</h1>
      <p class="mt-3 text-slate-500">Можеби линкот е погрешен или страницата е преместена.</p>
      <a routerLink="/" class="btn btn-primary mt-8">Назад на почетна</a>
    </section>
  `,
})
export class Page404 {}
