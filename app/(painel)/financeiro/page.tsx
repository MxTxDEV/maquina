'use client'

import { useState, useSyncExternalStore } from 'react'
import { diasAte, prazosDoMes, type Prazo } from '@/lib/prazos'
import { useConfig } from '@/lib/config'
import { conferir, lerCsv, type ResumoFolha } from '@/lib/folha'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const data = (d: Date) =>
  d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })

const hojeCliente = new Date()

function situacao(prazo: Prazo, hoje: Date) {
  const faltam = diasAte(prazo.pronto, hoje)
  if (faltam < 0) return { texto: `Atrasado há ${-faltam} dia(s)`, cor: 'text-red-600' }
  if (faltam === 0) return { texto: 'Precisa estar pronto hoje', cor: 'text-red-600' }
  if (faltam <= 3) return { texto: `Pronto em ${faltam} dia(s)`, cor: 'text-amber-600' }
  return { texto: `Faltam ${faltam} dias para ficar pronto`, cor: 'text-emerald-600' }
}

export default function Financeiro() {
  // null no servidor; a data real só existe no navegador.
  const hoje = useSyncExternalStore(
    () => () => {},
    () => hojeCliente,
    () => null
  )
  const config = useConfig()
  const [resumo, setResumo] = useState<ResumoFolha | null>(null)
  const [erro, setErro] = useState('')

  async function importar(arquivo: File | undefined) {
    if (!arquivo) return
    try {
      setResumo(conferir(lerCsv(await arquivo.text())))
      setErro('')
    } catch (e) {
      setResumo(null)
      setErro(e instanceof Error ? e.message : 'Não consegui ler o arquivo.')
    }
  }

  // Mostra os prazos do mês atual e do próximo, só os que ainda não passaram do pagamento.
  const prazos: Prazo[] = hoje
    ? [0, 1]
        .flatMap((i) => prazosDoMes(hoje.getFullYear(), hoje.getMonth() + i, config))
        .filter((p) => diasAte(p.pagamento, hoje) >= 0)
        .sort((a, b) => a.pagamento.getTime() - b.pagamento.getTime())
    : []

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Máquina · Financeiro</h1>
        <p className="text-sm text-zinc-500">Prazos de pagamento e conferência da folha.</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Próximos prazos</h2>
        {prazos.map((p) => {
          const s = situacao(p, hoje!)
          return (
            <div key={p.id + p.pagamento.toISOString()} className="rounded-lg border p-4">
              <div className="flex items-baseline justify-between">
                <strong>{p.titulo}</strong>
                <span className={`text-sm font-medium ${s.cor}`}>{s.texto}</span>
              </div>
              <p className="mt-1 text-sm text-zinc-600">
                Pronto até <b>{data(p.pronto)}</b> · pagamento <b>{data(p.pagamento)}</b>
              </p>
            </div>
          )
        })}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Importar folha</h2>
        <p className="text-sm text-zinc-500">
          Escolha o CSV exportado da folha. O arquivo é lido só no seu navegador e não é enviado a lugar nenhum.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => importar(e.target.files?.[0])}
          className="block text-sm"
        />
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        {resumo && (
          <div className="space-y-3 rounded-lg border p-4 text-sm">
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Item rotulo="Funcionários" valor={String(resumo.funcionarios)} />
              <Item rotulo="Vale (adiantamento)" valor={brl(resumo.vale)} />
              <Item rotulo="Total na conta" valor={brl(resumo.naConta)} />
              <Item rotulo="Líquido" valor={brl(resumo.liquido)} />
              <Item rotulo="iFood Benefícios" valor={brl(resumo.ifood)} />
              <Item rotulo="INSS" valor={brl(resumo.inss)} />
              <Item rotulo="Descontos" valor={brl(resumo.descontos)} />
            </dl>
            {resumo.divergencias.length === 0 ? (
              <p className="font-medium text-emerald-600">Conferência ok: todas as linhas fecham.</p>
            ) : (
              <ul className="list-disc pl-5 text-red-600">
                {resumo.divergencias.map((d, i) => (
                  <li key={i}>
                    <b>{d.nome}</b>: {d.motivo}
                  </li>
                ))}
              </ul>
            )}
            {resumo.avisos.length > 0 && (
              <ul className="list-disc pl-5 text-amber-600">
                {resumo.avisos.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </main>
  )
}

function Item({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-zinc-500">{rotulo}</dt>
      <dd className="font-medium">{valor}</dd>
    </div>
  )
}
