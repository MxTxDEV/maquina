// Regras de prazo do Financeiro.
// - Dia útil: segunda a sábado, exceto feriados (sábado conta; domingo não).
// - Vale (adiantamento): pago dia 20. Se cair em domingo, sábado ou feriado, paga ANTES (último dia útil
//   anterior que não seja sábado). Pronto 2 dias antes do pagamento.
// - Folha: paga no 5º dia útil do mês. Pronta até o 1º dia útil do mês.

export type Prazo = {
  id: 'vale' | 'folha'
  titulo: string
  pagamento: Date
  pronto: Date
}

const dia = (y: number, m: number, d: number) => new Date(y, m, d)
const chave = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

function pascoa(ano: number): Date {
  const a = ano % 19
  const b = Math.floor(ano / 100)
  const c = ano % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1
  const diaMes = ((h + l - 7 * m + 114) % 31) + 1
  return dia(ano, mes, diaMes)
}

/** Feriados nacionais. `extras` aceita feriados locais no formato 'AAAA-MM-DD'. */
export function feriados(ano: number, extras: string[] = []): Set<string> {
  const p = pascoa(ano)
  const sextaSanta = dia(ano, p.getMonth(), p.getDate() - 2)
  const lista = [
    dia(ano, 0, 1),
    sextaSanta,
    dia(ano, 3, 21),
    dia(ano, 4, 1),
    dia(ano, 8, 7),
    dia(ano, 9, 12),
    dia(ano, 10, 2),
    dia(ano, 10, 15),
    dia(ano, 10, 20),
    dia(ano, 11, 25),
  ]
  for (const e of extras) {
    const [y, m, d] = e.split('-').map(Number)
    if (y === ano) lista.push(dia(y, m - 1, d))
  }
  return new Set(lista.map(chave))
}

const ehFeriado = (d: Date, extras?: string[]) => feriados(d.getFullYear(), extras).has(chave(d))
export const ehDiaUtil = (d: Date, extras?: string[]) => d.getDay() !== 0 && !ehFeriado(d, extras)

function anterior(d: Date, aceita: (x: Date) => boolean): Date {
  const x = new Date(d)
  while (!aceita(x)) x.setDate(x.getDate() - 1)
  return x
}

/** N-ésimo dia útil do mês (sábado conta). */
export function nDiaUtil(ano: number, mes: number, n: number, extras?: string[]): Date {
  const d = dia(ano, mes, 1)
  let c = 0
  while (true) {
    if (ehDiaUtil(d, extras)) c++
    if (c === n) return new Date(d)
    d.setDate(d.getDate() + 1)
  }
}

export function prazosDoMes(ano: number, mes: number, extras?: string[]): Prazo[] {
  // Vale: dia 20; fim de semana ou feriado paga antes (último dia de semana útil anterior).
  const valePag = anterior(dia(ano, mes, 20), (x) => x.getDay() !== 0 && x.getDay() !== 6 && !ehFeriado(x, extras))
  const valePronto = anterior(dia(ano, mes, valePag.getDate() - 2), (x) => ehDiaUtil(x, extras))
  const folhaPag = nDiaUtil(ano, mes, 5, extras)
  const folhaPronto = nDiaUtil(ano, mes, 1, extras)
  return [
    { id: 'vale', titulo: 'Vale adiantamento', pagamento: valePag, pronto: valePronto },
    { id: 'folha', titulo: 'Folha de pagamento', pagamento: folhaPag, pronto: folhaPronto },
  ]
}

/** Dias corridos até a data (0 = hoje, negativo = atrasado). */
export function diasAte(alvo: Date, hoje = new Date()): number {
  const a = dia(alvo.getFullYear(), alvo.getMonth(), alvo.getDate()).getTime()
  const b = dia(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()).getTime()
  return Math.round((a - b) / 86400000)
}
