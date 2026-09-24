import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { TicketsService } from '../tickets/tickets.service';
import {
  TicketWithCategory,
  STATUS_LABELS,
  STATUS_CLASSES,
  PRIORITY_LABELS,
} from '../../core/models/ticket.model';

@Component({
  imports: [RouterLink, DatePipe],
  selector: 'app-my-tickets',
  styleUrl: './my-tickets.css',
  templateUrl: './my-tickets.html',
})
export class MyTickets implements OnInit {
  private ticketsService = inject(TicketsService);

  tickets = signal<TicketWithCategory[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  statusLabels = STATUS_LABELS;
  statusClasses = STATUS_CLASSES;
  priorityLabels = PRIORITY_LABELS;

  async ngOnInit() {
    try {
      this.tickets.set(await this.ticketsService.getTickets());
    } catch (e: any) {
      this.error.set(e.message ?? 'Не може да се вчитаат тикетите.');
    } finally {
      this.loading.set(false);
    }
  }
}
