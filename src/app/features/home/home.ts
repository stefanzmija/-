import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { CATEGORY_META } from '../../core/models/category.model';
import { TicketPriority, TicketStatus } from '../../core/models/ticket.model';
import { Icon, IconName } from '../../shared/icon/icon';
import { StatusBadge } from '../../shared/status-badge/status-badge';
import { PriorityIcon } from '../../shared/priority-icon/priority-icon';
import { Avatar } from '../../shared/avatar/avatar';

interface PreviewRow {
  id: number;
  title: string;
  category: string;
  status: TicketStatus;
  priority: TicketPriority;
  time: string;
  comments: number;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, Icon, StatusBadge, PriorityIcon, Avatar],
  templateUrl: './home.html',
  host: { class: 'block' },
})
export class Home {
  protected readonly auth = inject(AuthService);

  /** Example rows for the product preview in the hero (not real data). */
  protected readonly preview: PreviewRow[] = [
    { id: 128, title: 'Потврда за редовен студент за стипендија', category: 'Потврда', status: 'resolved', priority: 'normal', time: 'пред 2 мин', comments: 3 },
    { id: 127, title: 'Не можам да се пријавам за испит по Веб програмирање', category: 'Пријава на испит', status: 'in_progress', priority: 'high', time: 'пред 1 ч', comments: 2 },
    { id: 124, title: 'Уверение за положени испити — прва година', category: 'Уверение', status: 'waiting_student', priority: 'normal', time: 'вчера', comments: 4 },
    { id: 119, title: 'Промена на адреса на живеење', category: 'Лични податоци', status: 'open', priority: 'low', time: 'пред 3 дена', comments: 0 },
  ];

  protected readonly categories: { id: number; name: string }[] = [
    { id: 1, name: 'Потврда за редовен студент' },
    { id: 2, name: 'Запишување / заверка на семестар' },
    { id: 3, name: 'Пријава на испит' },
    { id: 4, name: 'Уверение за положени испити' },
    { id: 5, name: 'Промена на лични податоци' },
    { id: 6, name: 'Исписување / мирување' },
    { id: 7, name: 'Финансии' },
    { id: 8, name: 'Друго' },
  ];
  protected readonly categoryMeta = CATEGORY_META;

  protected readonly steps: { icon: IconName; title: string; text: string }[] = [
    { icon: 'file', title: 'Поднеси барање', text: 'Избери категорија, опиши што ти треба и испрати. Трае помалку од минута.' },
    { icon: 'user-check', title: 'Референт го презема', text: 'Барањето стигнува директно до службата и добива референт кој е задолжен за него.' },
    { icon: 'check-circle', title: 'Следи до крај', text: 'Одговори, доставувај документи и гледај го статусот сè додека не е решено.' },
  ];

  protected readonly timeline: { status: TicketStatus; time: string }[] = [
    { status: 'open', time: '09:12' },
    { status: 'in_progress', time: '09:40' },
    { status: 'resolved', time: '11:05' },
  ];
}
