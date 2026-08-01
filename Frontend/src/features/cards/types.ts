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
  created_at: string
  updated_at: string
  labels?: Label[]
  checklists?: Checklist[]
  comments?: Comment[]
}

export interface Comment {
  id: string
  text: string
  author: { id: string; name: string; avatar?: string }
  created_at: string
}

export interface Checklist {
  id: string
  title: string
  items: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface Label {
  id: string
  name: string
  color: string
}