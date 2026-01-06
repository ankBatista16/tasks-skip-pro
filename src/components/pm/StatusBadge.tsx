import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useI18n } from '@/context/I18nContext'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useI18n()
  let colorClass = 'bg-slate-100 text-slate-800 hover:bg-slate-200'

  // Map status to color
  switch (status.toLowerCase()) {
    case 'done':
    case 'completed':
    case 'active':
      colorClass = 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
      break
    case 'in-progress':
      colorClass = 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      break
    case 'todo':
    case 'on-hold':
      colorClass = 'bg-amber-100 text-amber-800 hover:bg-amber-200'
      break
    case 'high':
      colorClass = 'bg-rose-100 text-rose-800 hover:bg-rose-200'
      break
  }

  // Get translation
  const translatedStatus = t(`status.${status.toLowerCase().replace('-', '_')}`)

  return (
    <Badge
      variant="outline"
      className={cn('capitalize border-0 font-medium', colorClass, className)}
    >
      {translatedStatus}
    </Badge>
  )
}
