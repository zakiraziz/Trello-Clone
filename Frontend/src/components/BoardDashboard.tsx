// src/components/BoardDashboard.tsx
import React, { useState } from 'react';
import { useBoards, useCreateBoard } from '../hooks/boards';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

export const BoardDashboard: React.FC = () => {
  const { data: boards, isLoading, isError, error } = useBoards();
  const createBoardMut = useCreateBoard();
  const [title, setTitle] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createBoardMut.mutateAsync({ title });
      setTitle('');
      toast.success('Board created');
    } catch (e) {
      toast.error('Failed to create board');
    }
  };

  if (isLoading) return <div className="text-text-primary">Loading boards…</div>;
  if (isError) return <div className="text-error">Error: {(error as any).message}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4 text-text-primary">Your Boards</h1>
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          className="border border-border rounded px-2 py-1 bg-surface text-text-primary"
          placeholder="New board title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className="bg-primary hover:bg-primary/80 text-text-primary font-medium px-4 py-1 rounded transition-colors">
          Create
        </button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards && boards.map((board) => (
          <Link
            key={board.id}
            to={`/boards/${board.id}`}
            className="block p-4 bg-surface rounded-lg shadow hover:shadow-lg transition-shadow border border-border"
          >
            <h2 className="text-xl font-semibold text-text-primary">{board.title}</h2>
            {board.description && <p className="text-text-secondary mt-1">{board.description}</p>}
          </Link>
        ))}
      </div>
    </div>
  );
};
