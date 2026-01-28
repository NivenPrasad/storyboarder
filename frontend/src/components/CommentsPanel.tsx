import { useState } from 'react';
import { X, Send, Trash2, MessageSquare } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Storyboard } from '../types';

interface CommentsPanelProps {
  storyboard: Storyboard;
  onClose: () => void;
}

export default function CommentsPanel({ storyboard, onClose }: CommentsPanelProps) {
  const { createComment, deleteComment, user } = useStore();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await createComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (confirm('Delete this comment?')) {
      await deleteComment(commentId);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Comments ({storyboard.comments.length})
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {storyboard.comments.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            storyboard.comments.map((comment) => (
              <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{comment.userName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                    {comment.userId === user?.id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="input flex-1"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !newComment.trim()}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
