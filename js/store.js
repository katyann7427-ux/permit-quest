// Local persistence. Everything stays on this device (localStorage).
import { migrate, freshState } from './engine.js';

const KEY = 'jpq.save.v1';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return migrate(raw ? JSON.parse(raw) : null);
  } catch (e) {
    console.warn('Could not load save, starting fresh', e);
    return freshState();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn('Could not save progress', e);
    return false;
  }
}

export function wipe() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    /* ignore */
  }
}

/** Ask the browser not to evict our storage (helps on iOS home-screen apps). */
export function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist();
  } catch (e) {
    /* ignore */
  }
}
