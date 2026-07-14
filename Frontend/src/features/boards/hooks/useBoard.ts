import { useQuery } from '@tanstack/react-query'
import { getBoard } from '../api/getBoard'

export const useBoard = (id: string) => {
  return useQuery({
    queryKey: ['board', id],
    queryFn: () => getBoard(id),
    enabled: !!id,
  })
}
