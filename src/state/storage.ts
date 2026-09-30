// Keeping localStorage alive. Safari deletes a site's storage after 7 days
// without a visit (unless the app is on the home screen) and every browser
// may evict it under disk pressure. Persistent storage takes it out of the
// eviction pool; the browser may still say no, in which case the sheet keeps
// working exactly as before - the JSON backup remains the real safety net.

/** Ask the browser to keep this origin's storage; resolves to what it decided. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
