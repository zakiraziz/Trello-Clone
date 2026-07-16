import { useQuery } from '@tanstack/react-query'
import { getBoards } from '../api/getBoards'

const PAGE_SIZE = 50

export const useBoards = (page = 0) => {
  return useQuery({
    queryKey: ['boards', page],
    queryFn: () => getBoards({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }),
    placeholderData: (previousData) => previousData,
  })
}
