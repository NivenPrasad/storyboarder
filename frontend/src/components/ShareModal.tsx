import { useState } from 'react';
import { X, Link, Copy, Check, UserPlus, Users, Globe, Lock } from 'lucide-react';
import { api } from '../api/client';
import { useStore } from '../store/useStore';
import type { Storyboard } from '../types';

interface ShareModalProps {
  storyboard: Storyboard;
  onClose: () => void;
}

export default function ShareModal({ storyboard, onClose }: ShareModalProps) {
  const { updateStoryboard } = useStore();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  const shareUrl = storyboard.shareLink
    ? `${window.location.origin}/shared/${storyboard.shareLink}`
    : '';

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setSharing(true);
    setError('');
    setSuccess('');

    try {
      await api.shareStoryboard(storyboard.id, email.trim(), permission);
      setSuccess(`Shared with ${email}`);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to share');
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const togglePublic = async () => {
    await updateStoryboard(storyboard.id, { isPublic: !storyboard.isPublic });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Share Storyboard</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Share link */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Link className="w-4 h-4" />
                Share Link
              </label>
              <button
                onClick={togglePublic}
                className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                  storyboard.isPublic
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {storyboard.isPublic ? (
                  <>
                    <Globe className="w-3 h-3" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    Private
                  </>
                )}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="input flex-1 text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="btn btn-secondary"
                disabled={!storyboard.shareLink}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {storyboard.isPublic
                ? 'Anyone with the link can view this storyboard'
                : 'Only invited collaborators can access'}
            </p>
          </div>

          {/* Invite by email */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2 mb-2">
              <UserPlus className="w-4 h-4" />
              Invite by Email
            </label>
            <form onSubmit={handleShare} className="space-y-3">
              {error && (
                <div className="p-2 rounded bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-2 rounded bg-green-50 dark:bg-green-900/20 text-green-600 text-sm">
                  {success}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input flex-1"
                  placeholder="colleague@example.com"
                />
                <select
                  value={permission}
                  onChange={(e) => setPermission(e.target.value as 'view' | 'edit')}
                  className="input w-24"
                >
                  <option value="view">View</option>
                  <option value="edit">Edit</option>
                </select>
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={sharing || !email.trim()}
              >
                {sharing ? 'Sharing...' : 'Send Invite'}
              </button>
            </form>
          </div>

          {/* Current collaborators */}
          {(storyboard.collaborators.length > 0 || storyboard.viewers.length > 0) && (
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <Users className="w-4 h-4" />
                Collaborators
              </label>
              <div className="space-y-2">
                {storyboard.collaborators.map((userId) => (
                  <div
                    key={userId}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <span className="text-sm">{userId}</span>
                    <span className="text-xs text-primary-600">Can edit</span>
                  </div>
                ))}
                {storyboard.viewers.map((userId) => (
                  <div
                    key={userId}
                    className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <span className="text-sm">{userId}</span>
                    <span className="text-xs text-gray-500">Can view</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
