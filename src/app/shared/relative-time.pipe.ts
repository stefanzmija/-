import { Pipe, PipeTransform } from '@angular/core';

const MONTHS = ['јан', 'фев', 'мар', 'апр', 'мај', 'јун', 'јул', 'авг', 'сеп', 'окт', 'ное', 'дек'];

@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    const seconds = Math.round((Date.now() - date.getTime()) / 1000);

    if (seconds < 45) return 'сега';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `пред ${minutes} мин`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `пред ${hours} ч`;
    const days = Math.round(hours / 24);
    if (days === 1) return 'вчера';
    if (days < 7) return `пред ${days} дена`;

    const sameYear = date.getFullYear() === new Date().getFullYear();
    return `${date.getDate()} ${MONTHS[date.getMonth()]}${sameYear ? '' : ' ' + date.getFullYear()}`;
  }
}
