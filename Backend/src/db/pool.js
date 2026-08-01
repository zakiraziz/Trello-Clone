/**
 * Database pool module.
 * Supports both real PostgreSQL (production) and in-memory database (development).
 */
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL && process.env.NODE_ENV !== 'test') {
    // Use real PostgreSQL
    const { Pool } = require('pg');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
        console.error('Unexpected database pool error:', err);
    });

    pool.on('connect', () => {
        console.log('✅ Connected to PostgreSQL database');
    });

    module.exports = pool;
} else {
    // In-memory database fallback for development/testing
    const db = {
        users: [],
        boards: [],
        board_members: [],
        lists: [],
        cards: [],
        card_checklist_items: [],
        card_comments: [],
        activities: [],
        labels: [],
        card_labels: [],
        card_checklists: [],
        notifications: [],
        email_queue: [],
        audit_logs: [],
        refresh_tokens: [],
    };

    let nextId = 1;
    let nextListId = 1;
    let nextCardId = 1;
    let nextChecklistId = 1;

    const genId = () => String(nextId++);
    const genListId = () => String(nextListId++);
    const genCardId = () => String(nextCardId++);
    const genChecklistId = () => String(nextChecklistId++);

    function makeResult(rows, command = 'SELECT') {
        return { rows, rowCount: rows.length, command, oid: 0, fields: [] };
    }

    const normalizeSql = (text) => text.replace(/\s+/g, ' ').trim();

    pool = {
        query: async (text, params) => {
            const sql = normalizeSql(text).toLowerCase();
            
            // Helper to extract last param as ID for updates
            const lastParam = () => params && params.length > 0 ? params[params.length - 1] : null;
            const firstParam = () => params && params.length > 0 ? params[0] : null;

            if (sql.startsWith('select now()')) {
                return makeResult([{ current_time: new Date().toISOString() }]);
            }

            // ===== SELECT HANDLERS =====
            if (sql.startsWith('select')) {
                // Users
                if (sql.includes('from users')) {
                    let rows = [...db.users];
                    if (params && params.length > 0) {
                        if (sql.includes('email = $1') && sql.includes('id != $2')) {
                            rows = rows.filter(u => u.email === params[0] && u.id !== params[1]);
                        } else if (sql.includes('id = $1') && !sql.includes('id !=')) {
                            rows = rows.filter(u => u.id === params[0]);
                        } else if (sql.includes('email = $1') && !sql.includes('id !=')) {
                            rows = rows.filter(u => u.email === params[0]);
                        } else if (sql.includes('id = $1') && sql.includes('limit $2')) {
                            rows = rows.filter(u => u.id === params[0]).slice(0, parseInt(params[1]) || 50);
                        }
                    }
                    // Add default notification_settings if missing
                    rows = rows.map(u => ({
                        ...u,
                        notification_settings: u.notification_settings || {
                            email: {
                                welcome: true, login_alert: true, password_reset: true,
                                board_invite: true, task_assigned: true, mention: true,
                                due_date_reminder: true, profile_change: true
                            }, in_app: true
                        }
                    }));
                    return makeResult(rows);
                }

                // Boards
                if (sql.includes('from boards')) {
                    let rows = [...db.boards];

                    // Board access check: SELECT b.id, b.owner_id, bm.role FROM boards b LEFT JOIN board_members bm...
                    if (sql.includes('left join board_members') && sql.includes('b.owner_id') && sql.includes('bm.role')) {
                        const userId = params[0];
                        const boardId = params[1];
                        const board = db.boards.find(b => b.id === boardId);
                        if (board && (board.owner_id === userId || db.board_members.some(m => m.board_id === boardId && m.user_id === userId))) {
                            const member = db.board_members.find(m => m.board_id === boardId && m.user_id === userId);
                            return makeResult([{ id: board.id, owner_id: board.owner_id, role: member ? member.role : 'admin' }]);
                        }
                        return makeResult([]);
                    }

                    // Board findById with user join: SELECT b.*, u.name as owner_name FROM boards b JOIN users u...
                    if (sql.includes('join users u') && sql.includes('owner_name')) {
                        const boardId = params[0];
                        const board = db.boards.find(b => b.id === boardId);
                        if (board) {
                            const user = db.users.find(u => u.id === board.owner_id);
                            return makeResult([{ ...board, owner_name: user?.name || 'Unknown' }]);
                        }
                        return makeResult([]);
                    }

                    // Board with lists and cards query
                    if (sql.includes('from lists l') && sql.includes('json_agg') && sql.includes('cards c')) {
                        const boardId = params[0];
                        const lists = db.lists
                            .filter(l => l.board_id === boardId && !l.is_archived)
                            .sort((a, b) => (a.position || 0) - (b.position || 0))
                            .map(l => ({
                                ...l,
                                cards: db.cards
                                    .filter(c => c.list_id === l.id && !c.is_archived)
                                    .sort((a, b) => (a.position || 0) - (b.position || 0))
                            }));
                        return makeResult(lists);
                    }

                    if (params && params.length > 0) {
                        const boardId = params[0];
                        if (!sql.includes('join') && !sql.includes('left join')) {
                            rows = rows.filter(b => b.id === boardId);
                        } else {
                            const userId = params[0];
                            const memberBoardIds = db.board_members
                                .filter(m => m.user_id === userId)
                                .map(m => m.board_id);
                            rows = rows.filter(b => 
                                (b.owner_id === userId || memberBoardIds.includes(b.id)) && 
                                !b.is_archived
                            );
                        }
                    }
                    rows = rows.filter(b => !b.is_archived);
                    return makeResult(rows);
                }

                // Lists
                if (sql.includes('from lists')) {
                    // SELECT board_id FROM lists WHERE id = $1
                    if (sql.includes('select board_id from lists') && sql.includes('where id = $1')) {
                        const list = db.lists.find(l => l.id === firstParam());
                        return makeResult(list ? [{ board_id: list.board_id }] : []);
                    }

                    // SELECT l.board_id, b.name as board_name FROM cards c JOIN lists l ON c.list_id = l.id JOIN boards b ON l.board_id = b.id WHERE c.id = $1
                    if (sql.includes('join lists l') && sql.includes('join boards b') && sql.includes('c.id = $1')) {
                        const card = db.cards.find(c => c.id === firstParam());
                        if (card) {
                            const list = db.lists.find(l => l.id === card.list_id);
                            if (list) {
                                const board = db.boards.find(b => b.id === list.board_id);
                                return makeResult([{ board_id: list.board_id, board_name: board?.name || 'Unknown' }]);
                            }
                        }
                        return makeResult([]);
                    }

                    // SELECT l.board_id FROM cards c JOIN lists l ON c.list_id = l.id WHERE c.id = $1
                    if (sql.includes('join lists l') && sql.includes('c.list_id = l.id') && sql.includes('c.id = $1')) {
                        const card = db.cards.find(c => c.id === firstParam());
                        if (card) {
                            const list = db.lists.find(l => l.id === card.list_id);
                            if (list) {
                                return makeResult([{ board_id: list.board_id }]);
                            }
                        }
                        return makeResult([]);
                    }

                    let rows = [...db.lists];
                    if (params && sql.includes('board_id')) {
                        rows = rows.filter(l => l.board_id === firstParam() && !l.is_archived)
                                   .sort((a, b) => (a.position || 0) - (b.position || 0));
                    }
                    return makeResult(rows);
                }

                // Cards
                if (sql.includes('from cards')) {
                    let rows = [...db.cards];
                    if (params && sql.includes('where')) {
                        if (sql.includes('list_id = $1')) {
                            rows = rows.filter(c => c.list_id === firstParam() && !c.is_archived)
                                       .sort((a, b) => (a.position || 0) - (b.position || 0));
                        } else if (sql.includes('c.id = $1') || sql.includes('cards.id = $1') || sql.match(/where\s+c\.id\s*=\s*\$\d+/)) {
                            rows = rows.filter(c => c.id === firstParam());
                        } else if (!sql.includes('join')) {
                            rows = rows.filter(c => c.id === firstParam());
                        }
                    }
                    return makeResult(rows);
                }

                // Board members with user join
                if (sql.includes('from board_members') && sql.includes('join')) {
                    const boardId = firstParam();
                    const members = db.board_members
                        .filter(m => m.board_id === boardId)
                        .map(m => {
                            const user = db.users.find(u => u.id === m.user_id);
                            return { ...m, id: user?.id, name: user?.name || 'Unknown', email: user?.email || 'unknown', avatar_url: user?.avatar_url };
                        });
                    return makeResult(members);
                }

                // Board members
                if (sql.includes('from board_members')) {
                    if (params && sql.includes('board_id')) {
                        return makeResult(db.board_members.filter(m => m.board_id === firstParam()));
                    }
                    return makeResult(db.board_members);
                }

                // Activities
                if (sql.includes('from activities')) {
                    if (params && sql.includes('where') && sql.includes('board_id')) {
                        return makeResult(
                            db.activities.filter(a => a.board_id === firstParam())
                                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                        );
                    }
                    return makeResult(db.activities);
                }

                // Card comments with user join
                if (sql.includes('from card_comments') && sql.includes('join')) {
                    const cardId = firstParam();
                    const comments = db.card_comments
                        .filter(c => c.card_id === cardId)
                        .map(c => {
                            const user = db.users.find(u => u.id === c.user_id);
                            return { ...c, user_name: user?.name || 'Unknown', avatar_url: user?.avatar_url };
                        })
                        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    return makeResult(comments);
                }

                if (sql.includes('from card_comments')) {
                    if (params) return makeResult(db.card_comments.filter(c => c.card_id === firstParam()));
                    return makeResult(db.card_comments);
                }

                if (sql.includes('from card_labels')) {
                    if (params) return makeResult(db.card_labels.filter(cl => cl.card_id === firstParam()));
                    return makeResult(db.card_labels);
                }

                if (sql.includes('from card_checklists')) {
                    if (params && sql.includes('card_id')) return makeResult(db.card_checklists.filter(c => c.card_id === firstParam()));
                    return makeResult(db.card_checklists);
                }

                if (sql.includes('from card_checklist_items')) {
                    if (params && sql.includes('checklist_id')) {
                        return makeResult(
                            db.card_checklist_items.filter(i => i.checklist_id === firstParam())
                                .sort((a, b) => (a.position || 0) - (b.position || 0))
                        );
                    }
                    return makeResult(db.card_checklist_items);
                }

                // Notifications
                if (sql.includes('from notifications')) {
                    if (params) {
                        const userId = firstParam();
                        let notifications = db.notifications
                            .filter(n => n.user_id === userId)
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                        if (sql.includes('is_read = false')) {
                            notifications = notifications.filter(n => !n.is_read);
                        }
                        return makeResult(notifications);
                    }
                    return makeResult(db.notifications);
                }

                // COUNT queries
                if (sql.includes('count(*)')) {
                    let count = 0;
                    if (sql.includes('from users')) {
                        count = db.users.length;
                        if (params && sql.includes('created_at')) {
                            count = db.users.filter(u => new Date(u.created_at) > new Date(firstParam())).length;
                        }
                    } else if (sql.includes('from boards')) count = db.boards.length;
                    else if (sql.includes('from cards')) count = db.cards.length;
                    else if (sql.includes('from notifications')) {
                        if (params && sql.includes('is_read = false')) {
                            count = db.notifications.filter(n => n.user_id === firstParam() && !n.is_read).length;
                        } else if (params) {
                            count = db.notifications.filter(n => n.user_id === firstParam()).length;
                        }
                    }
                    return makeResult([{ count: String(count) }]);
                }

                // MAX(position)
                if (sql.includes('max(position)')) {
                    if (sql.includes('from lists')) {
                        const max = db.lists.reduce((m, l) => Math.max(m, l.position || 0), 0);
                        return makeResult([{ max }]);
                    }
                    if (sql.includes('from cards') && sql.includes('where') && sql.includes('list_id')) {
                        const listId = firstParam();
                        const max = db.cards.filter(c => c.list_id === listId).reduce((m, c) => Math.max(m, c.position || 0), 0);
                        return makeResult([{ max }]);
                    }
                    return makeResult([{ max: 0 }]);
                }

                // Activities with joins for admin
                if (sql.includes('from activities a')) {
                    return makeResult(
                        db.activities
                            .map(a => {
                                const user = db.users.find(u => u.id === a.user_id);
                                const board = db.boards.find(b => b.id === a.board_id);
                                return { ...a, user_name: user?.name, user_email: user?.email, board_name: board?.name };
                            })
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                    );
                }

                console.log(`[MockDB] Unhandled SELECT: ${sql.substring(0, 100)}...`);
                return makeResult([]);
            }

            // ===== INSERT HANDLERS =====
            if (sql.startsWith('insert')) {
                const now = new Date().toISOString();

                if (sql.includes('into users')) {
                    const user = { id: genId(), email: params[0] || '', password_hash: params[1] || '', name: params[2] || '', pro_tier: false, created_at: now, last_login_at: null, notification_settings: { email: { welcome: true, login_alert: true, password_reset: true, board_invite: true, task_assigned: true, mention: true, due_date_reminder: true, profile_change: true }, in_app: true } };
                    db.users.push(user);
                    return makeResult([{ id: user.id, email: user.email, name: user.name, pro_tier: false, created_at: now, notification_settings: user.notification_settings }], 'INSERT');
                }

                if (sql.includes('into boards')) {
                    const board = { id: genId(), name: params[0] || 'Untitled', owner_id: params[2] || '', description: params[1] || null, background_color: params[3] || '#0F766E', is_archived: false, created_at: now, updated_at: now };
                    db.boards.push(board);
                    return makeResult([board], 'INSERT');
                }

                if (sql.includes('into board_members')) {
                    const member = { board_id: params[0], user_id: params[1], role: params[2] || 'editor', joined_at: now };
                    db.board_members.push(member);
                    return makeResult([member], 'INSERT');
                }

                if (sql.includes('into lists')) {
                    const list = { id: genListId(), board_id: params[0], title: params[1] || 'New List', position: params[2] || db.lists.filter(l => l.board_id === params[0]).length, is_archived: false, created_at: now, updated_at: now };
                    db.lists.push(list);
                    return makeResult([list], 'INSERT');
                }

                if (sql.includes('into cards')) {
                    const card = { id: genCardId(), list_id: params[0], title: params[1] || 'New Card', description: params[2] || null, position: params[3] || db.cards.filter(c => c.list_id === params[0]).length, due_date: params[4] || null, assigned_to: params[5] || null, created_by: params[6] || null, is_archived: false, is_completed: false, created_at: now, updated_at: now };
                    db.cards.push(card);
                    return makeResult([card], 'INSERT');
                }

                if (sql.includes('into card_comments')) {
                    const comment = { id: genId(), card_id: params[0], user_id: params[1], content: params[2] || '', created_at: now };
                    db.card_comments.push(comment);
                    return makeResult([comment], 'INSERT');
                }

                if (sql.includes('into card_labels')) {
                    const label = { id: genId(), card_id: params[0], name: params[1] || 'Label', color: params[2] || '#ddd', created_at: now };
                    db.card_labels.push(label);
                    return makeResult([label], 'INSERT');
                }

                if (sql.includes('into card_checklists')) {
                    const checklist = { id: genChecklistId(), card_id: params[0], title: params[1] || 'New Checklist', position: 0, created_at: now };
                    db.card_checklists.push(checklist);
                    return makeResult([checklist], 'INSERT');
                }

                if (sql.includes('into card_checklist_items')) {
                    const item = { id: genId(), checklist_id: params[0], text: params[1] || '', is_completed: false, position: params[2] || 0, created_at: now };
                    db.card_checklist_items.push(item);
                    return makeResult([item], 'INSERT');
                }

                if (sql.includes('into notifications')) {
                    const notification = { id: genId(), user_id: params[0], type: params[1] || 'general', title: params[2] || '', message: params[3] || '', data: params[4] ? (typeof params[4] === 'string' ? JSON.parse(params[4]) : params[4]) : {}, is_read: false, read_at: null, created_at: now };
                    db.notifications.push(notification);
                    return makeResult([notification], 'INSERT');
                }

                if (sql.includes('into activities')) {
                    const activity = { id: genId(), board_id: params[0], user_id: params[1], action: params[2] || 'unknown', entity_type: params[3] || 'board', entity_id: params[4] || null, metadata: params[5] ? (typeof params[5] === 'string' ? params[5] : JSON.stringify(params[5])) : null, created_at: now };
                    db.activities.push(activity);
                    return makeResult([activity], 'INSERT');
                }

                if (sql.includes('into email_queue')) {
                    const email = { id: genId(), to: params[0], subject: params[1], template: params[2], data: params[3] ? JSON.stringify(params[3]) : '{}', status: 'pending', retries: 0, max_retries: 5, next_attempt: now, last_error: null, created_at: now, updated_at: now };
                    db.email_queue.push(email);
                    return makeResult([email], 'INSERT');
                }

                if (sql.includes('into audit_logs')) {
                    const log = { id: genId(), user_id: params[0] || null, action: params[1], entity_type: params[2], entity_id: params[3] || null, details: params[4] ? JSON.stringify(params[4]) : null, ip_address: params[5] || null, user_agent: params[6] || null, status: params[7] || 'success', created_at: now };
                    db.audit_logs.push(log);
                    return makeResult([log], 'INSERT');
                }

                if (sql.includes('into refresh_tokens')) {
                    const token = { id: genId(), user_id: params[0], token: params[1], expires_at: params[2], created_at: now, revoked: false };
                    db.refresh_tokens.push(token);
                    return makeResult([token], 'INSERT');
                }

                console.log(`[MockDB] Unhandled INSERT: ${sql.substring(0, 100)}...`);
                return makeResult([{ id: genId() }], 'INSERT');
            }

            // ===== UPDATE HANDLERS =====
            if (sql.startsWith('update')) {
                if (sql.includes('update users')) {
                    const userId = lastParam();
                    const user = db.users.find(u => u.id === userId);
                    if (user) {
                        if (sql.includes('password_hash = $1')) user.password_hash = params[0];
                        if (sql.includes('last_login_at')) user.last_login_at = new Date().toISOString();
                        if (sql.includes('name = $1') && !sql.includes('password_hash')) user.name = params[0];
                        if (sql.includes('email = $2')) user.email = params[1];
                        if ((sql.includes('name') && !sql.includes('password') && !sql.includes('last_login')) && sql.includes('email')) {
                            user.name = params[0];
                            user.email = params[1];
                        }
                        if (sql.includes('avatar_url = $1')) user.avatar_url = params[0];
                        if (sql.includes('pro_tier')) user.pro_tier = params[0];
                        if (sql.includes('pro_expires_at')) user.pro_expires_at = params[1];
                        if (sql.includes('notification_settings = $1')) user.notification_settings = params[0];
                        if (sql.includes('stripe_customer_id')) user.stripe_customer_id = params[0];
                        user.updated_at = new Date().toISOString();
                    }
                    return makeResult([user || { id: userId }], 'UPDATE');
                }

                if (sql.includes('update boards')) {
                    const boardId = lastParam();
                    const board = db.boards.find(b => b.id === boardId);
                    if (board) {
                        // Handle COALESCE pattern: [name, description, background_color, is_archived, id]
                        if (sql.includes('coalesce')) {
                            if (params[0] !== null) board.name = params[0];
                            if (params[1] !== null) board.description = params[1];
                            if (params[2] !== null) board.background_color = params[2];
                            if (params[3] !== null) board.is_archived = params[3];
                        } else {
                            if (sql.includes('name = $1')) board.name = params[0];
                            if (sql.includes('description') && params.length > 1) board.description = params[sql.indexOf('description') > -1 ? 1 : 0] || board.description;
                        }
                        board.updated_at = new Date().toISOString();
                    }
                    return makeResult([board || { id: boardId }], 'UPDATE');
                }

                if (sql.includes('update lists')) {
                    const listId = lastParam();
                    const list = db.lists.find(l => l.id === listId);
                    if (list) {
                        if (sql.includes('title = $1')) list.title = params[0];
                        if (sql.includes('position = $1') || sql.includes('position = $2')) {
                            const pos = params.find(p => typeof p === 'number');
                            if (pos !== undefined) list.position = pos;
                        }
                        list.updated_at = new Date().toISOString();
                    }
                    return makeResult([list || { id: listId }], 'UPDATE');
                }

                if (sql.includes('update cards')) {
                    const cardId = lastParam();
                    const card = db.cards.find(c => c.id === cardId);
                    if (card) {
                        if (params[0] !== null && params[0] !== undefined) card.title = params[0];
                        if (params[1] !== null && params[1] !== undefined) card.description = params[1];
                        if (params[2] !== null && params[2] !== undefined) card.position = params[2];
                        if (params[3] !== null && params[3] !== undefined) card.due_date = params[3];
                        if (params[4] !== null && params[4] !== undefined) card.assigned_to = params[4];
                        if (params[5] !== null && params[5] !== undefined) card.is_completed = params[5];
                        card.updated_at = new Date().toISOString();
                    }
                    return makeResult([card || { id: cardId }], 'UPDATE');
                }

                if (sql.includes('update card_checklist_items')) {
                    const itemId = lastParam();
                    const item = db.card_checklist_items.find(i => i.id === itemId);
                    if (item) {
                        if (sql.includes('text = $1') && params[0]) item.text = params[0];
                        if (sql.includes('is_completed')) {
                            const completed = params.find(p => typeof p === 'boolean');
                            if (completed !== undefined) item.is_completed = completed;
                        }
                    }
                    return makeResult([item || { id: itemId }], 'UPDATE');
                }

                if (sql.includes('update notifications') && sql.includes('is_read = true')) {
                    const notifId = lastParam();
                    const notif = db.notifications.find(n => n.id === notifId);
                    if (notif) {
                        notif.is_read = true;
                        notif.read_at = new Date().toISOString();
                    }
                    return makeResult([notif || { id: notifId }], 'UPDATE');
                }

                console.log(`[MockDB] Unhandled UPDATE: ${sql.substring(0, 100)}...`);
                return makeResult([{ id: lastParam() || 'unknown' }], 'UPDATE');
            }

            // ===== DELETE HANDLERS =====
            if (sql.startsWith('delete')) {
                if (sql.includes('from board_members')) {
                    const userId = firstParam();
                    db.board_members = db.board_members.filter(m => m.user_id !== userId);
                    return makeResult([], 'DELETE');
                }
                if (sql.includes('from boards')) {
                    const boardId = firstParam();
                    db.boards = db.boards.filter(b => b.id !== boardId);
                    db.lists = db.lists.filter(l => l.board_id !== boardId);
                    const listIds = db.lists.filter(l => l.board_id === boardId).map(l => l.id);
                    db.cards = db.cards.filter(c => !listIds.includes(c.list_id));
                    return makeResult([], 'DELETE');
                }
                if (sql.includes('from lists')) {
                    const listId = firstParam();
                    db.lists = db.lists.filter(l => l.id !== listId);
                    db.cards = db.cards.filter(c => c.list_id !== listId);
                    return makeResult([], 'DELETE');
                }
                if (sql.includes('from cards')) {
                    const cardId = firstParam();
                    db.cards = db.cards.filter(c => c.id !== cardId);
                    db.card_comments = db.card_comments.filter(c => c.card_id !== cardId);
                    db.card_labels = db.card_labels.filter(cl => cl.card_id !== cardId);
                    const checklistIds = db.card_checklists.filter(ch => ch.card_id === cardId).map(ch => ch.id);
                    db.card_checklists = db.card_checklists.filter(ch => ch.card_id !== cardId);
                    db.card_checklist_items = db.card_checklist_items.filter(i => !checklistIds.includes(i.checklist_id));
                    return makeResult([], 'DELETE');
                }
                if (sql.includes('from card_labels')) {
                    if (params && params.length > 1) {
                        db.card_labels = db.card_labels.filter(l => !(l.card_id === params[0] && l.id === params[1]));
                    } else {
                        db.card_labels = db.card_labels.filter(l => l.card_id !== firstParam());
                    }
                    return makeResult([], 'DELETE');
                }
                if (sql.includes('from card_checklists')) {
                    const checklistId = firstParam();
                    db.card_checklists = db.card_checklists.filter(c => c.id !== checklistId);
                    db.card_checklist_items = db.card_checklist_items.filter(i => i.checklist_id !== checklistId);
                    return makeResult([], 'DELETE');
                }
                if (sql.includes('from card_checklist_items')) {
                    const itemId = firstParam();
                    db.card_checklist_items = db.card_checklist_items.filter(i => i.id !== itemId);
                    return makeResult([], 'DELETE');
                }
                if (sql.includes('from notifications')) {
                    const notifId = firstParam();
                    const userId = params && params.length > 1 ? params[1] : null;
                    if (userId) {
                        db.notifications = db.notifications.filter(n => n.id !== notifId || n.user_id !== userId);
                    } else {
                        db.notifications = db.notifications.filter(n => n.id !== notifId);
                    }
                    return makeResult([], 'DELETE');
                }
                if (sql.includes('from users')) {
                    const userId = firstParam();
                    db.users = db.users.filter(u => u.id !== userId);
                    return makeResult([], 'DELETE');
                }

                return makeResult([], 'DELETE');
            }

            console.log(`[MockDB] Unhandled SQL: ${sql.substring(0, 100)}...`);
            return makeResult([]);
        },
        connect: async () => {
            console.log('✅ Connected to in-memory database');
            return { query: pool.query, release: () => {} };
        },
        end: async () => {
            console.log('🛑 Database connection closed.');
        },
        on: () => {},
        __db: db,
    };

    module.exports = pool;
}