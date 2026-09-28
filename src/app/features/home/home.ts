import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { categoryIcon } from '../../core/models/category.model';
import { Icon, IconName } from '../../shared/icon/icon';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Icon],
  templateUrl: './home.html',
})
export class Home {
  protected readonly auth = inject(AuthService);
  protected readonly categoryIcon = categoryIcon;

  protected readonly steps: { icon: IconName; title: string; text: string }[] = [
    { icon: 'file', title: 'Поднеси барање', text: 'Избери категорија, опиши што ти треба и испрати.' },
    { icon: 'user-check', title: 'Референт го презема', text: 'Барањето стигнува директно до службата.' },
    { icon: 'check-circle', title: 'Следи до крај', text: 'Одговарај во барањето и гледај го статусот.' },
  ];

  protected readonly categories = [
    { id: 1, name: 'Потврда за редовен студент' },
    { id: 2, name: 'Запишување / заверка на семестар' },
    { id: 3, name: 'Пријава на испит' },
    { id: 4, name: 'Уверение за положени испити' },
    { id: 5, name: 'Промена на лични податоци' },
    { id: 6, name: 'Исписување / мирување' },
    { id: 7, name: 'Финансии' },
    { id: 8, name: 'Друго' },
  ];
}
