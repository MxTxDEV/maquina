'use client'

import { useState } from 'react'
import { CONFIG_PADRAO, salvarConfig, useConfig, type Config } from '@/lib/config'
import { prazosDoMes } from '@/lib/prazos'

const campo = 'w-full rounded-md border bg-transparent px-3 py-2 text-sm'

export default function Configuracoes() {
  const salva = useConfig()
  const [rascunho, setRascunho] = useState<Config | null>(null)
  const c = rascunho ?? salva
  const set = <K extends keyof Config>(k: K, v: Config[K]) => setRascunho({ ...c, [k]: v })
  const num = (k: 'valeDia' | 'valeProntoAntes' | 'folhaPagamentoDiaUtil' | 'folhaProntoDiaUtil', min: number, max: number) => (
    <input
      type="number"
      min={min}
      max={max}
      className={campo}
      value={c[k]}
      onChange={(e) => set(k, Math.min(max, Math.max(min, Number(e.target.value) || min)))}
    />
  )
  const hoje = new Date()
  const previa = prazosDoMes(hoje.getFullYear(), hoje.getMonth(), c)
  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Máquina · Configurações</h1>
        <p className="text-sm text-zinc-500">Ficam salvas só neste navegador.</p>
      </header>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Vale adiantamento</h2>
        <label className="block text-sm">
          Dia do pagamento (cai em fim de semana ou feriado: paga antes)
          {num('valeDia', 1, 28)}
        </label>
        <label className="block text-sm">
          Pronto quantos dias antes do pagamento
          {num('valeProntoAntes', 0, 10)}
        </label>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Folha de pagamento</h2>
        <label className="block text-sm">
          Pagamento no N-ésimo dia útil
          {num('folhaPagamentoDiaUtil', 1, 15)}
        </label>
        <label className="block text-sm">
          Pronta até o N-ésimo dia útil
          {num('folhaProntoDiaUtil', 1, 15)}
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={c.sabadoUtil} onChange={(e) => set('sabadoUtil', e.target.checked)} />
          Sábado conta como dia útil
        </label>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Feriados locais</h2>
        <label className="block text-sm">
          Um por linha, no formato AAAA-MM-DD (ex.: 2026-06-04). Os feriados nacionais já estão incluídos.
          <textarea
            className={campo}
            rows={4}
            value={c.feriadosExtras.join('\n')}
            onChange={(e) =>
              set(
                'feriadosExtras',
                e.target.value.split('\n').map((l) => l.trim()).filter((l) => /^\d{4}-\d{2}-\d{2}$/.test(l))
              )
            }
          />
        </label>
      </section>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="font-medium">Avisos</h2>
        <label className="block text-sm">
          Lembrar quantos dias antes do prazo (separe por vírgula; 0 = no dia)
          <input
            className={campo}
            defaultValue={c.lembretes.join(', ')}
            onBlur={(e) =>
              set(
                'lembretes',
                e.target.value.split(',').map((v) => parseInt(v, 10)).filter((n) => Number.isInteger(n) && n >= 0)
              )
            }
          />
        </label>
        <label className="block text-sm">
          WhatsApp para os avisos (com DDD)
          <input className={campo} placeholder="(11) 90000-0000" value={c.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
        </label>
        <p className="text-xs text-zinc-500">O envio por WhatsApp ainda não está ligado; o número fica guardado para quando estiver.</p>
      </section>

      <section className="rounded-lg border p-4 text-sm">
        <h2 className="mb-2 font-medium">Prévia deste mês</h2>
        {previa.map((p) => (
          <p key={p.id}>
            {p.titulo}: pronto {fmt(p.pronto)} · paga {fmt(p.pagamento)}
          </p>
        ))}
      </section>

      <div className="flex gap-3">
        <button className="rounded-md bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900" onClick={() => { salvarConfig(c); setRascunho(null) }}>
          Salvar
        </button>
        <button className="rounded-md border px-4 py-2 text-sm" onClick={() => setRascunho(CONFIG_PADRAO)}>
          Restaurar padrão
        </button>
      </div>
    </main>
  )
}
