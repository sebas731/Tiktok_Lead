'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'

export function LoginForm() {
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError('')

    if (!login || !password) {
      setError('Completa todos los campos')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al iniciar sesión')
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setError('No se pudo conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <Input
        label="Usuario"
        value={login}
        onChange={setLogin}
        placeholder="admin"
        disabled={loading}
      />

      <Input
        label="Contraseña"
        type="password"
        value={password}
        onChange={setPassword}
        disabled={loading}
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:bg-gray-400"
      >
        {loading ? 'Ingresando...' : 'Iniciar sesión'}
      </button>
    </div>
  )
}