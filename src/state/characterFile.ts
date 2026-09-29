// Turning a character into a JSON file and getting that file off the phone:
// download for backups, Web Share for sending it to the PJ over chat.

import type { Character } from '../types/character';

export const CHARACTER_FILE_TYPE = 'application/json';

/** File name safe for every OS; falls back to "postava" for the nameless. */
export function characterFileName(character: Character): string {
  const base = character.identity.name.trim().replace(/[\\/:*?"<>|]+/g, '') || 'postava';
  return `${base}.json`;
}

export function characterToFile(character: Character): File {
  return new File([JSON.stringify(character, null, 2)], characterFileName(character), {
    type: CHARACTER_FILE_TYPE,
  });
}

export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
}

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled';

/**
 * Hand the file to the OS share sheet (Messenger, WhatsApp, mail…) where the
 * browser supports sharing files; otherwise fall back to a plain download.
 * A share sheet the user dismisses is not an error and triggers no download.
 */
export async function shareFile(file: File, title: string): Promise<ShareOutcome> {
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  const data: ShareData = { files: [file], title };
  if (typeof nav.share === 'function' && nav.canShare?.(data)) {
    try {
      await nav.share(data);
      return 'shared';
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return 'cancelled';
      // Some browsers claim canShare and then refuse; a download still gets the file out.
    }
  }
  downloadFile(file);
  return 'downloaded';
}
