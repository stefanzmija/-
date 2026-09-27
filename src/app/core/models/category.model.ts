import { IconName } from '../../shared/icon/icon';

export interface Category {
  id: number;
  name: string;
}

/** Icons and helper text for the seeded categories, keyed by id. */
export const CATEGORY_META: Record<number, { icon: IconName; hint: string }> = {
  1: { icon: 'file', hint: 'За стипендија, вработување, банка…' },
  2: { icon: 'calendar', hint: 'Упис, заверка, семестрални листови' },
  3: { icon: 'cap', hint: 'Проблеми со пријава преку iKnow' },
  4: { icon: 'award', hint: 'Преглед на положени предмети' },
  5: { icon: 'user', hint: 'Име, адреса, контакт, документи' },
  6: { icon: 'pause', hint: 'Мирување или испишување од студии' },
  7: { icon: 'card', hint: 'Уплатници, школарина, надоместоци' },
  8: { icon: 'message', hint: 'Сè што не е во другите категории' },
};

export function categoryIcon(id: number | null | undefined): IconName {
  return (id != null && CATEGORY_META[id]?.icon) || 'layers';
}
