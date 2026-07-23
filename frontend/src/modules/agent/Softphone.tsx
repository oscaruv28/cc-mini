import { useEffect, useRef, useState } from 'react';
import { interactionsApi } from '../../api/interactions.api';
import { apiError } from '../../api/client';
import { Card, Select } from '../../components/ui';
import type { Disposition } from '../../types';

interface Contact {
  name: string;
  phone: string;
}

const CONTACTS: Contact[] = [
  { name: 'María López', phone: '+573001112233' },
  { name: 'Carlos Pérez', phone: '+573012223344' },
  { name: 'Ana Torres', phone: '+573023334455' },
  { name: 'Jorge Ramírez', phone: '+573034445566' },
  { name: 'Lucía Fernández', phone: '+573045556677' },
  { name: 'Diego Morales', phone: '+573056667788' },
];

const initials = (n: string) =>
  n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const mmss = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

type Phase = 'ringing' | 'in' | 'wrap';

/** Softphone: agenda + llamada animada. Al colgar, wrap-up: tipificar y guardar. */
export default function Softphone({
  agentId,
  dispositions,
  onRegistered,
}: {
  agentId: string;
  dispositions: Disposition[];
  onRegistered: () => void;
}) {
  const [active, setActive] = useState<Contact | null>(null);
  const [phase, setPhase] = useState<Phase>('ringing');
  const [seconds, setSeconds] = useState(0);
  const [dispId, setDispId] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const startRef = useRef<Date>(new Date());

  useEffect(() => {
    if (!active) return;
    if (phase === 'ringing') {
      const t = setTimeout(() => setPhase('in'), 1600);
      return () => clearTimeout(t);
    }
    if (phase === 'in') {
      const iv = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(iv);
    }
    // 'wrap': el cronómetro se detiene.
  }, [active, phase]);

  const startCall = (c: Contact) => {
    setMsg(null);
    setSeconds(0);
    setDispId('');
    setPhase('ringing');
    startRef.current = new Date();
    setActive(c);
  };

  const save = async () => {
    if (!active || !dispId) return;
    setSaving(true);
    try {
      const dur = Math.max(seconds, 1);
      const call = await interactionsApi.createCall({
        agentId,
        direction: 'OUTBOUND',
        phoneNumber: active.phone,
        durationSec: dur,
        openedAt: startRef.current.toISOString(),
      });
      await interactionsApi.changeStatus('CALL', call.id, 'IN_PROGRESS');
      await interactionsApi.changeStatus('CALL', call.id, 'RESOLVED');
      await interactionsApi.tipify('CALL', call.id, dispId); // tipificación elegida en el wrap-up
      setMsg(`Llamada con ${active.name} registrada (${mmss(dur)}).`);
      setActive(null);
      onRegistered();
    } catch (e) {
      setMsg(apiError(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="Softphone — llama a un contacto">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CONTACTS.map((c) => (
          <button
            key={c.phone}
            onClick={() => startCall(c)}
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-2 text-left transition hover:bg-slate-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700">
              {initials(c.name)}
            </span>
            <span className="flex-1">
              <span className="block font-medium text-slate-700">{c.name}</span>
              <span className="block text-xs text-slate-400">{c.phone}</span>
            </span>
            <span className="text-lg">📞</span>
          </button>
        ))}
      </div>
      {msg && <p className="mt-3 text-sm text-slate-500">{msg}</p>}

      {active && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
            <div className="mx-auto mb-4 flex h-28 w-28 items-center justify-center">
              <span className="relative flex h-24 w-24">
                {phase === 'ringing' && (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-60" />
                )}
                <span className="relative inline-flex h-24 w-24 items-center justify-center rounded-full bg-indigo-600 text-2xl font-bold text-white">
                  {initials(active.name)}
                </span>
              </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800">{active.name}</h3>
            <p className="text-sm text-slate-400">{active.phone}</p>

            {phase === 'ringing' && (
              <>
                <p className="mt-2 text-sm font-medium text-slate-600">Llamando…</p>
                <div className="mt-6 flex justify-center">
                  <button onClick={() => setActive(null)} className="rounded-full bg-slate-200 px-6 py-2 font-medium text-slate-700 hover:bg-slate-300">
                    Cancelar
                  </button>
                </div>
              </>
            )}

            {phase === 'in' && (
              <>
                <p className="mt-2 text-sm font-medium text-slate-600">En llamada · {mmss(seconds)}</p>
                <div className="mt-6 flex justify-center">
                  <button onClick={() => setPhase('wrap')} className="rounded-full bg-red-600 px-8 py-2 font-medium text-white hover:bg-red-700">
                    ⛔ Colgar
                  </button>
                </div>
              </>
            )}

            {phase === 'wrap' && (
              <>
                <p className="mt-2 text-sm text-slate-500">Llamada finalizada · duración {mmss(seconds)}</p>
                <div className="mt-4 text-left">
                  <label className="mb-1 block text-sm font-medium text-slate-600">Tipificación (obligatoria)</label>
                  <Select value={dispId} onChange={(e) => setDispId(e.target.value)}>
                    <option value="" disabled>Selecciona cómo concluyó…</option>
                    {dispositions.map((d) => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </Select>
                </div>
                <div className="mt-6 flex justify-center gap-3">
                  <button onClick={() => setActive(null)} className="rounded-full bg-slate-100 px-5 py-2 font-medium text-slate-600 hover:bg-slate-200">
                    Descartar
                  </button>
                  <button
                    onClick={save}
                    disabled={!dispId || saving}
                    className="rounded-full bg-indigo-600 px-6 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {saving ? 'Guardando…' : 'Guardar llamada'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
