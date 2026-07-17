-- Migration 001: Optimize database indexes for performance
-- Run after schema.sql if you already have data

-- Composite index for board member lookups by user + role
CREATE INDEX IF NOT EXISTS idx_board_members_user_role ON board_members(user_id, role);

-- Composite index for activities sorted by board + time (for activity feeds)
CREATE INDEX IF NOT EXISTS idx_activities_board_created ON activities(board_id, created_at DESC);

-- Index for cards by list + position (for board loading)
CREATE INDEX IF NOT EXISTS idx_cards_list_position ON cards(list_id, position);

-- Index for completed cards filtering
CREATE INDEX IF NOT EXISTS idx_cards_completed ON cards(list_id, is_completed) WHERE is_completed = TRUE;

-- Index for due date reminders (for notifications)
CREATE INDEX IF NOT EXISTS idx_cards_due_date ON cards(due_date) WHERE due_date IS NOT NULL AND is_completed = FALSE;

-- Index for archived status filtering
CREATE INDEX IF NOT EXISTS idx_boards_archived ON boards(owner_id, is_archived) WHERE is_archived = FALSE;

-- Index for lists ordering
CREATE INDEX IF NOT EXISTS idx_lists_board_position ON lists(board_id, position);

-- Full-text search index for cards (if you add search later)
-- CREATE INDEX IF NOT EXISTS idx_cards_search ON cards USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Index for card labels lookups
CREATE INDEX IF NOT EXISTS idx_card_labels_card ON card_labels(card_id);
CREATE INDEX IF NOT EXISTS idx_card_labels_label ON card_labels(label_id);

-- Index for checklist items completion
CREATE INDEX IF NOT EXISTS idx_checklist_items_checklist_position ON checklist_items(checklist_id, position);

COMMENT ON INDEX idx_board_members_user_role IS 'Optimizes permission checks: find all boards a user can access with their role';
COMMENT ON INDEX idx_activities_board_created IS 'Optimizes activity feed queries sorted by newest first';
COMMENT ON INDEX idx_cards_list_position IS 'Optimizes loading cards in order for a list';
COMMENT ON INDEX idx_cards_completed IS 'Optimizes filtering completed cards within a list';
COMMENT ON INDEX idx_cards_due_date IS 'Optimizes finding upcoming/overdue tasks for notifications';
COMMENT ON INDEX idx_boards_archived IS 'Optimizes showing only non-archived boards on dashboard';
COMMENT ON INDEX idx_lists_board_position IS 'Optimizes loading lists in correct order for a board';