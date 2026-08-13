'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { FileUpload } from '@/components/ui/FileUpload'
import { PageHeader } from '@/components/layout/PageHeader'
import { apiGet, apiSend } from '@/lib/api/client'

type Branding = { title: string; subtitle: string; logoUrl: string | null; sideImageUrl: string | null }

export function BrandingView() {
  const [b, setB] = useState<Branding>({ title: '', subtitle: '', logoUrl: null, sideImageUrl: null })
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiGet<Branding>('/api/settings/branding').then(setB).catch(() => {})
  }, [])

  async function save() {
    setLoading(true)
    setError('')
    setSaved(false)
    try {
      await apiSend('/api/settings/branding', 'PATCH', b)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Configuración" description="Personaliza la pantalla de login." />
      <Card className="max-w-xl">
        <div className="flex flex-col gap-4">
          <Input label="Título" value={b.title} onChange={(v) => setB({ ...b, title: v })} />
          <Input label="Subtítulo" value={b.subtitle} onChange={(v) => setB({ ...b, subtitle: v })} />
          <FileUpload label="Logo" value={b.logoUrl} onChange={(dataUrl) => setB({ ...b, logoUrl: dataUrl })} />
          <FileUpload label="Imagen lateral" value={b.sideImageUrl} onChange={(dataUrl) => setB({ ...b, sideImageUrl: dataUrl })} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-green-600">Guardado ✓</p>}
          <div>
            <Button onClick={save} loading={loading}>Guardar</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
