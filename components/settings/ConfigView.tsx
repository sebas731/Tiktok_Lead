'use client'

import { PageHeader } from '@/components/layout/PageHeader'
import { ChangePasswordForm } from './ChangePasswordForm'
import { BrandingView } from './BrandingView'
import type { Role } from '@/lib/types'

export function ConfigView({ role }: { role: Role }) {
  return (
    <div>
      <PageHeader title="Configuración" description="Tu cuenta y preferencias." />
      <div className="flex flex-col gap-8">
        <ChangePasswordForm />
        {role === 'ADMIN' && <BrandingView embedded />}
      </div>
    </div>
  )
}
