'use client'

import { useEffect, useState } from 'react'
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
    { href: '/dashboard/reportes', label: 'Leads procesados', icon: 'reportes' },
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
    { href: '/dashboard/reportes', label: 'Leads procesados', icon: 'reportes' },
    { href: '/dashboard/grupos', label: 'Mis grupos', icon: 'grupos' },
    { href: '/dashboard/settings', label: 'Configuración', icon: 'settings' },
  ],
  ASESOR: [
    { href: '/dashboard/campaigns', label: 'Campañas', icon: 'campaigns' },
    { href: '/dashboard/mis-ventas', label: 'Mis ventas', icon: 'ventas' },
    { href: '/dashboard/settings', label: 'Configuración', icon: 'settings' },
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
    { href: '/dashboard/settings', label: 'Configuración', icon: 'settings' },
  ],
}

const STORAGE_KEY = 'sidebar-collapsed'

// ── Estilos de un ítem según estado y modo (expandido / colapsado) ──
function itemClass(active: boolean, collapsed: boolean): string {
  if (collapsed) {
    return `flex items-center justify-center rounded-xl p-2.5 transition-all duration-150 ${
      active ? 'bg-white/25 text-white' : 'text-white/80 hover:bg-white/12 hover:text-white'
    }`
  }
  return `flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
    active
      ? 'border-l-[3px] border-brand-red bg-brand-red/10 pl-[calc(0.875rem-3px)] font-semibold text-brand-red'
      : 'text-text-muted hover:bg-black/[0.04] hover:text-text'
  }`
}

function NavGroup({ item, pathname }: { item: NavItem; pathname: string }) {
  const childActive = item.children?.some((c) => pathname === c.href) ?? false
  const [open, setOpen] = useState(childActive)
  const Icon = Icons[item.icon]

  return (
    <div>
      <button type="button" onClick={() => setOpen((v) => !v)} className={`w-full ${itemClass(false, false)}`}>
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
  const [collapsed, setCollapsed] = useState(false)

  // Persistencia de la preferencia (se lee tras montar para no romper la hidratación).
  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === '1')
  }, [])
  function toggle() {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      return next
    })
  }

  const asideBase =
    'relative sticky top-3 m-3 flex h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[1.7rem] transition-all duration-200'
  const asideMode = collapsed
    ? 'w-[4.75rem] items-stretch bg-gradient-to-b from-brand-red to-brand-red-dk p-2.5 text-white shadow-brand'
    : 'sidebar-shell w-64 p-4 text-text'

  return (
    <aside className={`${asideBase} ${asideMode}`}>
      {/* Cabecera: logo + toggle */}
      <div className={`relative z-10 mb-6 flex items-center gap-3 ${collapsed ? 'flex-col' : 'px-2 pt-1'}`}>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-red to-brand-red-dk text-sm font-bold text-white shadow-sm ring-1 ring-white/20">
          CK2
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text">Grupo CK2</p>
            <p className="truncate text-xs text-text-muted">{name}</p>
          </div>
        )}
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? 'Expandir menú' : 'Encoger menú'}
          title={collapsed ? 'Expandir' : 'Encoger'}
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
            collapsed ? 'text-white/80 hover:bg-white/15 hover:text-white' : 'text-text-muted hover:bg-black/[0.05] hover:text-text'
          }`}
        >
          {collapsed ? '»' : '«'}
        </button>
      </div>

      <nav className="relative z-10 flex flex-1 flex-col gap-1.5">
        {items.map((item) => {
          const Icon = Icons[item.icon]
          // Grupos con hijos: en modo colapsado se muestran como un icono que
          // enlaza a la primera vista (el desplegable solo tiene sentido expandido).
          if (item.children) {
            if (collapsed) {
              const active = item.children.some((c) => pathname === c.href)
              return (
                <Link key={item.label} href={item.children[0].href} title={item.label} className={itemClass(active, true)}>
                  {Icon && <Icon />}
                </Link>
              )
            }
            return <NavGroup key={item.label} item={item} pathname={pathname} />
          }
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href!} title={collapsed ? item.label : undefined} className={itemClass(active, collapsed)}>
              {Icon && <Icon />}
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="relative z-10 mt-2 rounded-2xl border border-border bg-bg px-3.5 py-3 text-xs text-text-muted">
          <p className="font-semibold text-text">Sistema de Ventas</p>
          <p className="mt-0.5 text-text-muted">TikTok Leads · CK2</p>
        </div>
      )}
    </aside>
  )
}
