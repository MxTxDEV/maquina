// Leitura e conferência do CSV da folha (separador ';', decimais com vírgula).

export type Linha = Record<string, string> & { Nome: string }

export type Divergencia = { nome: string; motivo: string }

export type ResumoFolha = {
  funcionarios: number
  vale: number
  inss: number
  descontos: number
  liquido: number
  ifood: number
  naConta: number
  divergencias: Divergencia[]
  avisos: string[]
}

const GANHOS = [
  'Salário base',
  'Bonificação fixa',
  'Bonificação variada',
  'Bonif. dias trabalhados (R$)',
  'Bonif. 361/380 (R$)',
  'Gratificação',
  'Ajuda combinada',
  'HE semana (R$)',
  'HE SDF (R$)',
]

export const num = (s: string | undefined) =>
  s ? Number(s.replace(/\./g, '').replace(',', '.')) || 0 : 0

function dividir(linha: string): string[] {
  const out: string[] = []
  let atual = ''
  let aspas = false
  for (const ch of linha) {
    if (ch === '"') aspas = !aspas
    else if (ch === ';' && !aspas) {
      out.push(atual)
      atual = ''
    } else atual += ch
  }
  out.push(atual)
  return out
}

export function lerCsv(texto: string): Linha[] {
  const linhas = texto.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim())
  const [cab, ...resto] = linhas
  const cols = dividir(cab).map((c) => c.trim())
  if (!cols.includes('Nome') || !cols.includes('Valor na conta'))
    throw new Error('Arquivo fora do formato esperado (faltam as colunas Nome / Valor na conta).')
  return resto.map((l) => {
    const v = dividir(l)
    return Object.fromEntries(cols.map((c, i) => [c, (v[i] ?? '').trim()])) as Linha
  })
}

const r2 = (n: number) => Math.round(n * 100) / 100

export function conferir(linhas: Linha[]): ResumoFolha {
  const res: ResumoFolha = {
    funcionarios: linhas.length,
    vale: 0,
    inss: 0,
    descontos: 0,
    liquido: 0,
    ifood: 0,
    naConta: 0,
    divergencias: [],
    avisos: [],
  }
  for (const l of linhas) {
    const ganhos = GANHOS.reduce((s, k) => s + num(l[k]), 0)
    const liquido = ganhos - num(l['Adiantamento']) - num(l['INSS']) - num(l['Descontos'])
    if (Math.abs(liquido - num(l['Valor líquido'])) > 0.01)
      res.divergencias.push({
        nome: l.Nome,
        motivo: `Líquido calculado ${r2(liquido)} ≠ informado ${num(l['Valor líquido'])}`,
      })
    if (Math.abs(num(l['Valor líquido']) - num(l['iFood Benefícios']) - num(l['Valor na conta'])) > 0.01)
      res.divergencias.push({ nome: l.Nome, motivo: 'Valor na conta ≠ líquido − iFood' })
    if (num(l['Valor na conta']) === 0) res.avisos.push(`${l.Nome}: valor na conta zerado`)
    if (num(l['Valor na conta']) < 0) res.avisos.push(`${l.Nome}: valor na conta negativo`)
    res.vale += num(l['Adiantamento'])
    res.inss += num(l['INSS'])
    res.descontos += num(l['Descontos'])
    res.liquido += num(l['Valor líquido'])
    res.ifood += num(l['iFood Benefícios'])
    res.naConta += num(l['Valor na conta'])
  }
  for (const k of ['vale', 'inss', 'descontos', 'liquido', 'ifood', 'naConta'] as const) res[k] = r2(res[k])
  return res
}
