import { useState, type FormEvent } from 'react';
import type { NpcDraft } from '../../state/encounter';

const EMPTY = { name: '', count: '1', hp: '', uc: '', oc: '', iniciativa: '0' };

/** One line under the combat table: type a monster's numbers, pick how many, add. */
export function NpcForm({ onAdd }: { onAdd: (draft: NpcDraft, count: number) => void }) {
  const [form, setForm] = useState(EMPTY);
  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit(e: FormEvent) {
    e.preventDefault();
    onAdd(
      {
        name: form.name,
        hp: Math.max(1, Number(form.hp) || 1),
        uc: form.uc.trim(),
        oc: Number(form.oc) || 0,
        iniciativa: Number(form.iniciativa) || 0,
      },
      Math.max(1, Math.min(20, Number(form.count) || 1)),
    );
    // Keep the numbers - the next monster is usually another of the same kind.
    setForm((f) => ({ ...f, name: '', count: '1' }));
  }

  return (
    <form className="npc-form" onSubmit={submit}>
      <label className="field npc-form__name">
        <span>Nestvůra / CP</span>
        <input value={form.name} onChange={set('name')} placeholder="Skřet" required />
      </label>
      <label className="field">
        <span>Počet</span>
        <input type="number" inputMode="numeric" min={1} max={20} value={form.count} onChange={set('count')} />
      </label>
      <label className="field">
        <span>Životy</span>
        <input type="number" inputMode="numeric" min={1} value={form.hp} onChange={set('hp')} required />
      </label>
      <label className="field">
        <span>ÚČ</span>
        <input value={form.uc} onChange={set('uc')} placeholder="5 / 3+2" />
      </label>
      <label className="field">
        <span>OČ</span>
        <input type="number" inputMode="numeric" value={form.oc} onChange={set('oc')} />
      </label>
      <label className="field">
        <span>Ini ±</span>
        <input type="number" inputMode="numeric" value={form.iniciativa} onChange={set('iniciativa')} />
      </label>
      <button type="submit" className="primary">
        Přidat
      </button>
    </form>
  );
}
