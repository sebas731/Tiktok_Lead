import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-gray-900">
            Gestión de Leads
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ingresa con tus credenciales
          </p>
        </div>

        <LoginForm />
      </div>
    </main>
  )
}