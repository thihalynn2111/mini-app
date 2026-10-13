"use client";

import { useState } from "react";

export interface Comment {
  id: string;
  content: string;
  user: { username: string; avatarUrl: string | null };
}

export interface Post {
  id: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  likesCount: number;
  isLikedByMe: boolean;
  author: { id: string; username: string; avatarUrl: string | null };
  comments: Comment[];
}

export default function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(post.isLikedByMe);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [commentText, setCommentText] = useState("");

  async function handleToggleLike() {
    setLiked(!liked);
    setLikesCount(liked ? likesCount - 1 : likesCount + 1);

    await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;

    const res = await fetch(`/api/posts/${post.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText }),
    });

    if (res.ok) {
      const newComment = await res.json();
      setComments([...comments, newComment]);
      setCommentText("");
    }
  }

  return (
    <div className="bg-white border border-sky-100 rounded-2xl shadow-sm p-5 mb-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={
            post.author.avatarUrl || "https://via.placeholder.com/40?text=User"
          }
          alt={post.author.username}
          className="w-10 h-10 rounded-full object-cover border-2 border-sky-200"
        />
        <div>
          <h4 className="font-bold text-sky-950 text-sm">
            @{post.author.username}
          </h4>
          <span className="text-xs text-sky-400">
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Body */}
      {post.content && (
        <p className="text-sky-900 text-sm mb-3 whitespace-pre-line leading-relaxed">
          {post.content}
        </p>
      )}
      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post attachment"
          className="w-full rounded-xl object-cover max-h-96 mb-3 border border-sky-100"
        />
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 border-t border-b border-sky-100 py-2.5 my-3 text-xs font-semibold">
        <button
          onClick={handleToggleLike}
          className={`flex items-center gap-1.5 transition ${
            liked ? "text-sky-600 font-bold" : "text-sky-500 hover:text-sky-700"
          }`}
        >
          {liked ? "💙" : "🤍"} {likesCount} Likes
        </button>
        <span className="text-sky-500 flex items-center gap-1">
          💬 {comments.length} Comments
        </span>
      </div>

      {/* Comments List */}
      <div className="space-y-2 mt-3">
        {comments.map((c) => (
          <div
            key={c.id}
            className="text-xs bg-sky-50/70 border border-sky-100/80 p-2.5 rounded-xl"
          >
            <span className="font-bold text-sky-900">@{c.user.username}: </span>
            <span className="text-sky-800">{c.content}</span>
          </div>
        ))}

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-sky-50/50 border border-sky-200 rounded-xl px-3 py-1.5 text-xs text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400"
          />
          <button
            type="submit"
            className="px-4 py-1.5 bg-sky-600 text-white rounded-xl text-xs font-semibold hover:bg-sky-700 transition"
          >
            Reply
          </button>
        </form>
      </div>
    </div>
  );
}
