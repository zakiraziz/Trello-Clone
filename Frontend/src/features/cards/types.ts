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
}
