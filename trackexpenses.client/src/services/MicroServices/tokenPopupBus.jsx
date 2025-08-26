// tokenPopupBus.js — singleton simples
const BUS_KEY = "__tokenPopupBus__";
const bus = typeof window !== "undefined"
  ? (window[BUS_KEY] ||= { pending: false, listeners: new Set() })
  : { pending: false, listeners: new Set() };

export function requestTokenPopup() {
  bus.pending = true;
  bus.listeners.forEach((l) => { try { l(); } catch {} });
}
export function subscribeTokenPopup(listener) {
  bus.listeners.add(listener);
  if (bus.pending) { try { listener(); } catch {} }
  return () => bus.listeners.delete(listener);
}
export function clearTokenPopupPending() { bus.pending = false; }
