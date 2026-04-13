'use client';

import { useState, useEffect } from 'react';

interface Comment {
  id: string;
  userId: string;
  content: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  timestamp: string;
}

interface MarketCommentsProps {
  marketId: string;
}

const sentimentColors = {
  bullish: 'bg-green-900/50 text-green-400 border-green-700',
  bearish: 'bg-red-900/50 text-red-400 border-red-700',
  neutral: 'bg-gray-700/50 text-gray-400 border-gray-600',
};

const sentimentIcons = {
  bullish: '🐂',
  bearish: '🐻',
  neutral: '🤔',
};

export default function MarketComments({ marketId }: MarketCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sentiment, setSentiment] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [posting, setPosting] = useState(false);
  const [aggregateScore, setAggregateScore] = useState(0);

  useEffect(() => {
    if (marketId) loadComments();
  }, [marketId]);

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/eliza/markets/analytics?marketId=${marketId}&type=comments`);
      const data = await response.json();
      if (data.comments) {
        setComments(data.comments);
        calculateAggregateSentiment(data.comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
    setLoading(false);
  };

  const calculateAggregateSentiment = (commentList: Comment[]) => {
    if (commentList.length === 0) {
      setAggregateScore(0);
      return;
    }
    const scores = { bullish: 1, bearish: -1, neutral: 0 };
    const total = commentList.reduce((sum, c) => sum + scores[c.sentiment], 0);
    setAggregateScore(total / commentList.length);
  };

  const postComment = async () => {
    if (!newComment.trim()) return;
    
    setPosting(true);
    try {
      await fetch('/api/eliza/markets/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId,
          content: newComment,
          sentiment,
        }),
      });
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Error posting comment:', error);
    }
    setPosting(false);
  };

  if (loading) return <div className="glass-card p-6 rounded-xl"><p className="text-gray-400">Loading comments...</p></div>;

  return (
    <div className="glass-card p-6 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Market Comments</h2>

      <div className="flex items-center gap-4 mb-6 p-3 bg-gray-800/50 rounded-lg">
        <span className="text-gray-400">Aggregate Sentiment:</span>
        <div className="flex items-center gap-2">
          <span className={`text-2xl ${aggregateScore > 0 ? 'text-green-400' : aggregateScore < 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {aggregateScore > 0 ? '🐂' : aggregateScore < 0 ? '🐻' : '🤔'}
          </span>
          <span className="text-lg font-bold text-white">
            {aggregateScore > 0 ? '+' : ''}{aggregateScore.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
        {comments.length === 0 ? (
          <p className="text-gray-400">No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="p-3 bg-gray-800/30 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-gray-400">{comment.userId}</span>
                <span className={`px-2 py-0.5 rounded text-xs ${sentimentColors[comment.sentiment]}`}>
                  {sentimentIcons[comment.sentiment]} {comment.sentiment}
                </span>
              </div>
              <p className="text-white text-sm">{comment.content}</p>
              <p className="text-xs text-gray-500 mt-1">{new Date(comment.timestamp).toLocaleString()}</p>
            </div>
          ))
        )}
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          {(['bullish', 'bearish', 'neutral'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSentiment(s)}
              className={`flex-1 py-2 rounded-lg text-sm ${
                sentiment === s 
                  ? sentimentColors[s]
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {sentimentIcons[s]} {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add your comment..."
            maxLength={500}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500"
            onKeyPress={(e) => e.key === 'Enter' && postComment()}
          />
          <button
            onClick={postComment}
            disabled={posting || !newComment.trim()}
            className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-all disabled:opacity-50"
          >
            {posting ? '...' : 'Post'}
          </button>
        </div>
        <p className="text-xs text-gray-500">{newComment.length}/500 characters</p>
      </div>
    </div>
  );
}
