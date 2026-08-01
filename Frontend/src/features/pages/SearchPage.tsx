import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Search, FileText, Users, MessageSquare } from 'lucide-react'

interface SearchResult {
  boards: unknown[]
  cards: unknown[]
  comments: unknown[]
  users: unknown[]
  total: number
}

export function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const { user } = useAuth()

  const performSearch = async () => {
    if (!user || query.length < 2) return
    setLoading(true)
    try {
      const response = await api.get(`/search?q=${encodeURIComponent(query)}&type=${activeTab}`)
      setResults(response.data)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (query.length >= 2) {
        void performSearch()
      } else {
        setResults(null)
      }
    }, 300)

    return () => clearTimeout(delayedSearch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, activeTab])

  const renderResult = (item: unknown, type: string): React.ReactNode => {
    const data = item as Record<string, unknown>
    const name = String(data.name || '')
    const description = String(data.description || 'No description')
    const title = String(data.title || '')
    const content = String(data.content || '')
    const email = String(data.email || '')
    const createdAt = data.created_at ? String(data.created_at) : ''
    const dueDate = data.due_date ? String(data.due_date) : ''

    switch (type) {
      case 'boards':
        return (
          <div className="p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-1" />
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
                {createdAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {new Date(createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      case 'cards':
        return (
          <div className="p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-green-600 mt-1" />
              <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
                {dueDate && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Due {new Date(dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      case 'comments':
        return (
          <div className="p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-purple-600 mt-1" />
              <div>
                <p className="font-medium">{content}</p>
                {createdAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      case 'users':
        return (
          <div className="p-4 border-b hover:bg-gray-50 dark:hover:bg-gray-800">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-orange-600 mt-1" />
              <div>
                <p className="font-medium">{name}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Search</h1>
        <p className="text-muted-foreground mt-1">Search across boards, cards, comments, and users</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search for boards, cards, comments, users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 py-3 text-lg"
          />
        </div>
      </div>

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-muted-foreground mb-4">Please enter at least 2 characters to search</p>
      )}

      {loading && (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {!loading && results && (
        <div>
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Found {results.total} result{results.total !== 1 ? 's' : ''} for "{query}"
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({results.total})</TabsTrigger>
              <TabsTrigger value="boards">Boards ({results.boards?.length || 0})</TabsTrigger>
              <TabsTrigger value="cards">Cards ({results.cards?.length || 0})</TabsTrigger>
              <TabsTrigger value="comments">Comments ({results.comments?.length || 0})</TabsTrigger>
              <TabsTrigger value="users">Users ({results.users?.length || 0})</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <Card>
                <CardContent className="p-0">
                  {results.boards?.map((board, i) => <div key={`board-${i}`}>{renderResult(board, 'boards')}</div>)}
                  {results.cards?.map((card, i) => <div key={`card-${i}`}>{renderResult(card, 'cards')}</div>)}
                  {results.comments?.map((comment, i) => <div key={`comment-${i}`}>{renderResult(comment, 'comments')}</div>)}
                  {results.users?.map((user, i) => <div key={`user-${i}`}>{renderResult(user, 'users')}</div>)}
                  {results.total === 0 && (
                    <div className="p-12 text-center text-muted-foreground">
                      No results found
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="boards">
              <Card>
                <CardContent className="p-0">
                  {results.boards?.map((board, i) => <div key={`board-${i}`}>{renderResult(board, 'boards')}</div>)}
                  {results.boards?.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground">No boards found</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cards">
              <Card>
                <CardContent className="p-0">
                  {results.cards?.map((card, i) => <div key={`card-${i}`}>{renderResult(card, 'cards')}</div>)}
                  {results.cards?.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground">No cards found</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card>
                <CardContent className="p-0">
                  {results.comments?.map((comment, i) => <div key={`comment-${i}`}>{renderResult(comment, 'comments')}</div>)}
                  {results.comments?.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground">No comments found</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardContent className="p-0">
                  {results.users?.map((user, i) => <div key={`user-${i}`}>{renderResult(user, 'users')}</div>)}
                  {results.users?.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground">No users found</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {!loading && !results && query.length >= 2 && (
        <div className="text-center text-muted-foreground py-12">
          Start typing to search...
        </div>
      )}

      {!loading && !results && query.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Enter a search query to find boards, cards, comments, and users</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}