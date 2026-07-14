export interface Board {
  id: string
  name: string
  description?: string
  owner_id: string
  background_color?: string
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface BoardWithLists extends Board {
  lists: List[]
}

export interface List {
  id: string
  board_id: string
  title: string
  position: number
  cards: Card[]
}

export interface Card {
  id: string
  list_id: string
  title: string
  description?: string
  position: number
  due_date?: string
  is_completed: boolean
  assigned_to?: string
  created_by: string
  created_at: string
  updated_at: string
}
