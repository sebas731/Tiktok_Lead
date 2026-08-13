import { promises as fs } from 'fs'
import path from 'path'

export type Branding = {
  title: string
  subtitle: string
  logoUrl: string | null
  sideImageUrl: string | null
}

const DEFAULT_BRANDING: Branding = {
  title: 'Grupo CK2',
  subtitle: 'Sistema de gestión de leads y ventas',
  logoUrl: null,
  sideImageUrl: null,
}

// Persistencia simple en archivo (sin migración). Suficiente para una sola instancia.
const FILE = path.join(process.cwd(), 'data', 'branding.json')

export async function getBranding(): Promise<Branding> {
  try {
    const raw = await fs.readFile(FILE, 'utf-8')
    return { ...DEFAULT_BRANDING, ...(JSON.parse(raw) as Partial<Branding>) }
  } catch {
    return DEFAULT_BRANDING
  }
}

export async function updateBranding(input: Record<string, unknown>): Promise<Branding> {
  const current = await getBranding()
  const next: Branding = {
    title: typeof input.title === 'string' ? input.title : current.title,
    subtitle: typeof input.subtitle === 'string' ? input.subtitle : current.subtitle,
    logoUrl: typeof input.logoUrl === 'string' ? input.logoUrl : current.logoUrl,
    sideImageUrl: typeof input.sideImageUrl === 'string' ? input.sideImageUrl : current.sideImageUrl,
  }
  await fs.mkdir(path.dirname(FILE), { recursive: true })
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), 'utf-8')
  return next
}
