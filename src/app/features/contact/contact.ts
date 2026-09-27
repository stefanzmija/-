import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Icon, IconName } from '../../shared/icon/icon';

interface ContactCard {
  icon: IconName;
  title: string;
  lines: string[];
  href?: string;
  action?: string;
}

@Component({
  selector: 'app-contact',
  imports: [RouterLink, Icon],
  templateUrl: './contact.html',
  host: { class: 'block' },
})
export class Contact {
  protected readonly auth = inject(AuthService);

  /** Source: finki.ukim.mk → Студии → Студентска служба. */
  protected readonly cards: ContactCard[] = [
    {
      icon: 'pin',
      title: 'Каде сме',
      lines: ['ул. Руѓер Бошковиќ 16, 1000 Скопје', 'Спроти кабинет 117'],
      href: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('ФИНКИ, Руѓер Бошковиќ 16, Скопје'),
      action: 'Отвори во мапи',
    },
    {
      icon: 'clock',
      title: 'Работно време',
      lines: ['Секој работен ден', '09:00 – 12:00 часот'],
    },
    {
      icon: 'mail',
      title: 'Е-пошта',
      lines: ['studentski@finki.ukim.mk'],
      href: 'mailto:studentski@finki.ukim.mk',
      action: 'Испрати е-пошта',
    },
    {
      icon: 'phone',
      title: 'Телефон',
      lines: ['070/302-440', 'од 13:00 до 15:00 часот'],
      href: 'tel:+38970302440',
      action: 'Јави се',
    },
  ];

  protected readonly faq: { q: string; a: string }[] = [
    {
      q: 'Колку брзо ќе добијам одговор?',
      a: 'Барањата се обработуваат по редослед на поднесување, а тие со висок приоритет први. Статусот го гледаш во живо во „Мои барања“.',
    },
    {
      q: 'Што значи статусот „Чека студент“?',
      a: 'Референтот ти поставил прашање или му треба документ. Одговори во самото барање и тоа автоматски се враќа во обработка.',
    },
    {
      q: 'Дали некој друг може да ги види моите барања?',
      a: 'Не. Правилата за пристап се во базата: студентот ги гледа само своите барања, а целосен пристап има само Студентската служба.',
    },
    {
      q: 'Како да го подигнам документот што го побарав?',
      a: 'Кога барањето е „Решено“, во одговорот ќе пишува кога и каде да го подигнеш — обично во просториите на службата во работното време.',
    },
    {
      q: 'Можам ли да повлечам барање?',
      a: 'Да. Во деталите на барањето кликни „Повлечи барање“ — тоа се затвора и службата повеќе не работи на него.',
    },
  ];
}
