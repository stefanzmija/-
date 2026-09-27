import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'Студентска служба · ФИНКИ',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'contact',
    title: 'Контакт · Студентска служба',
    loadComponent: () => import('./features/contact/contact').then((m) => m.Contact),
  },
  {
    path: 'login',
    title: 'Најава · Студентска служба',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'register',
    title: 'Регистрација · Студентска служба',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register').then((m) => m.Register),
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        title: 'Барања · Студентска служба',
        loadComponent: () =>
          import('./features/tickets/ticket-list/ticket-list').then((m) => m.TicketList),
      },
      {
        path: 'new',
        title: 'Ново барање · Студентска служба',
        loadComponent: () =>
          import('./features/tickets/ticket-create/ticket-create').then((m) => m.TicketCreate),
      },
      {
        path: ':id',
        title: 'Барање · Студентска служба',
        loadComponent: () =>
          import('./features/tickets/ticket-detail/ticket-detail').then((m) => m.TicketDetail),
      },
    ],
  },
  { path: 'my-tickets', redirectTo: 'tickets' },
  {
    path: 'admin/users',
    title: 'Корисници · Администрација',
    canActivate: [roleGuard('admin')],
    loadComponent: () => import('./features/admin/users/users').then((m) => m.Users),
  },
  {
    path: '**',
    title: 'Страницата не постои',
    loadComponent: () => import('./features/page404/page404').then((m) => m.Page404),
  },
];
