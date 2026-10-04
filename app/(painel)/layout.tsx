import Link from 'next/link'
import type { ReactNode } from 'react'

const MENU = [
  { href: '/financeiro', rotulo: 'Financeiro' },
  { href: '/rh', rotulo: 'RH' },
  { href: '/operacoes', rotulo: 'Operações' },
  { href: '/configuracoes', rotulo: 'Configurações' },
]

export default function PainelLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <nav className="flex gap-1 border-b p-3 md:w-56 md:flex-col md:border-r md:border-b-0 md:p-4">
        <Link href="/" className="mb-2 hidden px-3 py-2 text-lg font-semibold md:block">
          Máquina
        </Link>
        {MENU.map((m) => (
          <Link key={m.href} href={m.href} className="rounded-md px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800">
            {m.rotulo}
          </Link>
        ))}
        <Link href="/" className="rounded-md px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 md:mt-auto dark:hover:bg-zinc-800">
          Máquina 3D
        </Link>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  )
}
