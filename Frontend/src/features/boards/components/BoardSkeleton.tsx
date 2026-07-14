import { Skeleton } from '@/components/ui/skeleton'

export const BoardSkeleton = () => {
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full mt-2" />
      <Skeleton className="h-4 w-2/3 mt-1" />
      <Skeleton className="h-3 w-1/4 mt-4" />
    </div>
  )
}
