'use client'

import { useSyncExternalStore } from 'react'
import { REGRAS_PADRAO, type Regras } from './prazos'

export type Config = Regras & {
  /** Dias de antecedência dos lembretes antes do prazo "pronto". */
  lembretes: number[]
  /** Número de WhatsApp (com DDD) para os avisos. Ainda não há envio configurado. */
  whatsapp: string
}

export const CONFIG_PADRAO: Config = { ...REGRAS_PADRAO, lembretes: [3, 1, 0], whatsapp: '' }

const CHAVE = 'maquina:config'
const ouvintes = new Set<() => void>()
let bruto: string | null | undefined
let cache: Config = CONFIG_PADRAO

function ler(): Config {
  let s: string | null = null
  try {
    s = localStorage.getItem(CHAVE)
  } catch {}
  if (s !== bruto) {
    bruto = s
    try {
      cache = s ? { ...CONFIG_PADRAO, ...JSON.parse(s) } : CONFIG_PADRAO
    } catch {
      cache = CONFIG_PADRAO
    }
  }
  return cache
}

export function salvarConfig(c: Config) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(c))
  } catch {}
  ouvintes.forEach((f) => f())
}

export function useConfig(): Config {
  return useSyncExternalStore(
    (f) => {
      ouvintes.add(f)
      window.addEventListener('storage', f)
      return () => {
        ouvintes.delete(f)
        window.removeEventListener('storage', f)
      }
    },
    ler,
    () => CONFIG_PADRAO
  )
}
