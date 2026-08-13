import { Button } from '@/components/ui/Button'

type PaginationProps = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div className="mt-4 flex items-center justify-end gap-3">
      <Button variant="secondary" onClick={() => onChange(page - 1)} disabled={page <= 1}>
        Anterior
      </Button>
      <span className="text-sm text-text-muted">
        Página {page} de {totalPages}
      </span>
      <Button variant="secondary" onClick={() => onChange(page + 1)} disabled={page >= totalPages}>
        Siguiente
      </Button>
    </div>
  )
}
