import { useEffect, useRef, useState } from 'react';
import { callsApi } from '../../api/calls.api';
import { ticketsApi } from '../../api/tickets.api';
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
  const [report, setReport] = useState('');
  const [showTicket, setShowTicket] = useState(false);
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
    setReport('');
    setShowTicket(false);
    setPhase('ringing');
    startRef.current = new Date();
    setActive(c);
  };

  const save = async () => {
    if (!active || !dispId) return;
    setSaving(true);
    try {
      const dur = Math.max(seconds, 1);
      const call = await callsApi.create({
        agentId,
        direction: 'OUTBOUND',
        phoneNumber: active.phone,
        durationSec: dur,
        openedAt: startRef.current.toISOString(),
      });
      await callsApi.changeStatus(call.id, 'IN_PROGRESS');
      await callsApi.changeStatus(call.id, 'RESOLVED');
      await callsApi.tipify(call.id, dispId); // tipificación elegida en el wrap-up
      let extra = '';
      if (showTicket && report.trim()) {
        // Solo si el agente abrió el reporte y escribió algo: crea un ticket ligado a la llamada.
        await ticketsApi.create({
          agentId,
          subject: `Reporte de llamada — ${active.name}`,
          description: report.trim(),
          priority: 'MEDIUM',
          callId: call.id,
        });
        extra = ' + ticket creado';
      }
      setMsg(`Llamada con ${active.name} registrada (${mmss(dur)})${extra}.`);
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
                <div className="mt-3 text-left">
                  {!showTicket ? (
                    <button
                      type="button"
                      onClick={() => setShowTicket(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-indigo-300 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      <span className="text-base leading-none">＋</span> Crear ticket de esta llamada
                    </button>
                  ) : (
                    <>
                      <div className="mb-1 flex items-center justify-between">
                        <label className="block text-sm font-medium text-slate-600">Descripción de la incidencia</label>
                        <button
                          type="button"
                          onClick={() => { setShowTicket(false); setReport(''); }}
                          className="text-xs font-medium text-slate-400 hover:text-slate-600"
                        >
                          Quitar ticket
                        </button>
                      </div>
                      <textarea
                        value={report}
                        onChange={(e) => setReport(e.target.value)}
                        rows={2}
                        autoFocus
                        placeholder="Queja u observación del usuario durante la llamada…"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500"
                      />
                    </>
                  )}
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
                    {saving
                      ? 'Guardando…'
                      : showTicket && report.trim()
                        ? 'Guardar llamada + ticket'
                        : 'Guardar llamada'}
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
