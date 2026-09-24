import { Routes } from '@angular/router';
import { Home } from './features/home/home';
import { Contact } from './features/contact/contact';
import { MyTickets } from './features/my-tickets/my-tickets';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { TicketCreate } from './features/tickets/ticket-create/ticket-create';
import { authGuard } from './core/guards/auth.guard';
import {Page404} from './features/page404/page404';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'contact', component: Contact },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'my-tickets', component: MyTickets, canActivate: [authGuard] },
  { path: 'tickets/new', component: TicketCreate, canActivate: [authGuard] },
  { path: '**', redirectTo: '' },
];
