import { Layout } from '../../../../types/types';

const KEY = 'parktwin_layout';

export function saveLayout(layout: Layout): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(layout));
  } catch (e) {
    console.warn('Failed to save layout', e);
  }
}

export function loadLayout(): Layout | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Layout;
  } catch {
    return null;
  }
}

export function clearLayout(): void {
  localStorage.removeItem(KEY);
}
