'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { Role } from '@/lib/types'

type NavItem = { href: string; label: string }

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: '/dashboard', label: 'Inicio' },
    { href: '/dashboard/campaigns', label: 'Campañas' },
    { href: '/dashboard/users', label: 'Usuarios' },
  ],
  SUPERVISOR: [
    { href: '/dashboard', label: 'Inicio' },
    { href: '/dashboard/campaigns', label: 'Campañas' },
  ],
  ASESOR: [
    { href: '/dashboard', label: 'Inicio' },
    { href: '/dashboard/leads', label: 'Mis leads' },
  ],
  BACK: [
    { href: '/dashboard', label: 'Inicio' },
    { href: '/dashboard/sales', label: 'Ventas' },
  ],
}

export function Sidebar({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const items = NAV_BY_ROLE[role] ?? []

  return (
    <aside className="flex w-60 flex-col border-r border-gray-200 bg-white p-4">
      <div className="mb-6 px-2">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <p className="text-xs text-gray-500">{role}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {items.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                active ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      <button
        type="button"
        onClick={logout}
        className="mt-4 rounded-lg px-3 py-2 text-left text-sm text-gray-600 transition hover:bg-gray-100"
      >
        Cerrar sesión
      </button>
    </aside>
  )
}
