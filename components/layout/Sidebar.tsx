'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { Role } from '@/lib/types'
import { Icons } from './icons'

type NavChild = { href: string; label: string }
type NavItem = { href?: string; label: string; icon: string; children?: NavChild[] }

const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  ADMIN: [
    { href: '/dashboard', label: 'Inicio', icon: 'home' },
    { href: '/dashboard/campaigns', label: 'Campañas', icon: 'campaigns' },
    { href: '/dashboard/leads', label: 'Leads', icon: 'leads' },
    { href: '/dashboard/ventas', label: 'Ventas', icon: 'ventas' },
    { href: '/dashboard/users', label: 'Usuarios', icon: 'users' },
    { href: '/dashboard/sedes', label: 'Sedes', icon: 'sedes' },
    { href: '/dashboard/grupos', label: 'Grupos', icon: 'grupos' },
    { href: '/dashboard/keys', label: 'Keys', icon: 'keys' },
    { href: '/dashboard/settings', label: 'Configuración', icon: 'settings' },
  ],
  SUPERVISOR: [
    { href: '/dashboard', label: 'Inicio', icon: 'home' },
    { href: '/dashboard/campaigns', label: 'Campañas', icon: 'campaigns' },
    { href: '/dashboard/leads', label: 'Leads', icon: 'leads' },
    { href: '/dashboard/ventas', label: 'Ventas', icon: 'ventas' },
    { href: '/dashboard/grupos', label: 'Mi grupo', icon: 'grupos' },
  ],
  ASESOR: [
    { href: '/dashboard/campaigns', label: 'Campañas', icon: 'campaigns' },
    { href: '/dashboard/mis-ventas', label: 'Mis ventas', icon: 'ventas' },
  ],
  BACK: [
    {
      label: 'Ventas',
      icon: 'ventas',
      children: [
        { href: '/dashboard/ventas', label: 'Ver ventas' },
        { href: '/dashboard/ventas/nueva', label: 'Nueva venta' },
      ],
    },
    { href: '/dashboard/campaigns', label: 'Campañas', icon: 'campaigns' },
  ],
}

const linkClass = (active: boolean) =>
  `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
    active
      ? 'border-l-[3px] border-brand-red bg-brand-red/10 pl-[calc(0.875rem-3px)] font-semibold text-brand-red'
      : 'text-text-muted hover:bg-black/[0.04] hover:text-text'
  }`

function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const childActive = item.children?.some((c) => pathname === c.href) ?? false
  const [open, setOpen] = useState(childActive)
  const Icon = Icons[item.icon]

  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} className={`w-full ${linkClass(false)}`}>
        {Icon && <Icon />}
        <span className="flex-1 text-left">{item.label}</span>
        <span className={`text-xs transition-transform ${open ? 'rotate-90' : ''}`}>▸</span>
      </button>
      {open && (
        <div className="mt-1 flex flex-col gap-1 pl-4">
          {item.children!.map((c) => {
            const active = pathname === c.href
            return (
              <Link
                key={c.href}
                href={c.href}
                className={`rounded-xl px-3.5 py-2 text-sm transition-all ${
                  active ? 'bg-brand-red/10 font-medium text-brand-red' : 'text-text-muted hover:bg-black/[0.04] hover:text-text'
                }`}
              >
                {c.label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname()
  const items = NAV_BY_ROLE[role] ?? []

  return (
    <aside className="sidebar-shell relative sticky top-3 m-3 flex h-[calc(100vh-1.5rem)] w-64 flex-col overflow-hidden rounded-[1.7rem] p-4 text-text">
      <div className="relative z-10 mb-8 flex items-center gap-3 px-2 pt-1">
        {/* El logo conserva sus colores de marca */}
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-red to-brand-red-dk text-sm font-bold text-white shadow-sm">
          CK2
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text">Grupo CK2</p>
          <p className="truncate text-xs text-text-muted">{name}</p>
        </div>
      </div>
      <nav className="relative z-10 flex flex-1 flex-col gap-1.5">
        {items.map((item) => {
          if (item.children) return <NavGroup key={item.label} item={item} pathname={pathname} />
          const active = pathname === item.href
          const Icon = Icons[item.icon]
          return (
            <Link key={item.href} href={item.href!} className={linkClass(active)}>
              {Icon && <Icon />}
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="relative z-10 mt-2 rounded-2xl border border-border bg-bg px-3.5 py-3 text-xs text-text-muted">
        <p className="font-semibold text-text">Sistema de Ventas</p>
        <p className="mt-0.5 text-text-muted">TikTok Leads · CK2</p>
      </div>
    </aside>
  )
}
