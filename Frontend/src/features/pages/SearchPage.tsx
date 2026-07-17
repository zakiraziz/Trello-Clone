import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { Search, LayoutGrid, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

export const SearchPage = () => {
  const [query, setQuery] = useState('')

  const { data: results, isLoading } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      if (!query.trim()) return { boards: [], cards: [] }
      const { data } = await api.get(`/search?q=${encodeURIComponent(query)}`)
      return data
    },
    enabled: query.length > 2,
  })

  return (
    <div className="min-h-screen bg-[#F4F5F7] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search boards and cards..."
            className="w-full pl-12 pr-4 py-4 text-lg border rounded-lg shadow-sm focus:ring-2 focus:ring-[#026AA7] focus:border-transparent outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        {isLoading && <div className="text-center py-8">Searching...</div>}

        {results && (
          <div className="space-y-8">
            {/* Boards Results */}
            {results.boards?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5" />
                  Boards ({results.boards.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.boards.map((board: any) => (
                    <Link
                      key={board.id}
                      to={`/board/${board.id}`}
                      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border"
                    >
                      <h3 className="font-semibold text-[#172B4D]">{board.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{board.cardCount} cards</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Cards Results */}
            {results.cards?.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Cards ({results.cards.length})
                </h2>
                <div className="space-y-2">
                  {results.cards.map((card: any) => (
                    <Link
                      key={card.id}
                      to={`/board/${card.boardId}?card=${card.id}`}
                      className="block bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow border"
                    >
                      <h3 className="font-medium text-[#172B4D]">{card.title}</h3>
                      <p className="text-sm text-gray-500">in {card.listName}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {query.length > 2 && !isLoading && results && results.boards?.length === 0 && results.cards?.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No results found for "{query}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}