import { useQuery } from '@tanstack/react-query'
import { getBoards } from '../api/getBoards'

export const useBoards = () => {
  return useQuery({
    queryKey: ['boards'],
    queryFn: getBoards,
  })
}
