import { IconName } from '../../shared/icon/icon';

export interface Category {
  id: number;
  name: string;
}

const CATEGORY_ICONS: Record<number, IconName> = {
  1: 'file',
  2: 'calendar',
  3: 'cap',
  4: 'award',
  5: 'user',
  6: 'pause',
  7: 'card',
  8: 'message',
};

export function categoryIcon(id: number): IconName {
  return CATEGORY_ICONS[id] ?? 'layers';
}
