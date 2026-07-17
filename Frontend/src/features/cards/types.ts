export interface Card {
  id: string
  list_id: string
  board_id: string
  title: string
  description?: string
  position: number
  due_date?: string
  is_completed: boolean
  assigned_to?: string
  created_by: string
  labels?: Array<{ id: string; name: string; color: string }>
  checklists?: Array<{
    id: string
    title: string
    items: Array<{ id: string; text: string; completed: boolean }>
  }>
  comments?: Array<{
    id: string
    text: string
    author: { id: string; name: string; avatar?: string }
    createdAt: string
  }>
}
