export function haptic(ms: number | number[] = 15) {
  if (typeof navigator === "undefined") return;
  try {
    if ("vibrate" in navigator) navigator.vibrate(ms);
  } catch {
    /* ignore */
  }
}
