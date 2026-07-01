import { cn } from '@/lib/utils'
import logoImage from '@/assets/logo.jpeg'

export function BrandLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl shadow-lg shadow-blue-200', className)}>
      <img src={logoImage} alt="Cloud Kalisanen logo" className="h-full w-full object-cover" />
    </div>
  )
}
