'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { apiSend } from '@/lib/api/client'

export function ChangePasswordForm() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    setMsg('')
    setError('')
    if (next !== confirm) {
      setError('La nueva contraseña y su confirmación no coinciden')
      return
    }
    setLoading(true)
    try {
      await apiSend('/api/users/me/password', 'PATCH', { currentPassword: current, newPassword: next })
      setMsg('Contraseña actualizada correctamente.')
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const disabled = !current || !next || !confirm

  return (
    <Card className="max-w-md">
      <h2 className="text-base font-semibold text-text">Cambiar contraseña</h2>
      <div className="mt-4 flex flex-col gap-4">
        <Input label="Contraseña actual" type="password" value={current} onChange={setCurrent} />
        <div className="flex flex-col gap-4 border-t border-border pt-4">
          <Input label="Nueva contraseña" type="password" value={next} onChange={setNext} />
          <Input label="Confirmar nueva contraseña" type="password" value={confirm} onChange={setConfirm} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}
        <div className="flex justify-end">
          <Button onClick={submit} loading={loading} disabled={disabled}>Guardar</Button>
        </div>
      </div>
    </Card>
  )
}
