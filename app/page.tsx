"use client";

import { useEffect, useState } from "react";

interface Post {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string; avatar?: string };
}

interface CurrentUser {
  id: string;
  username: string;
  email: string;
}

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [content, setContent] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
  }, []);

  const fetchCurrentUser = async () => {
    const res = await fetch("/api/profile");
    if (res.ok) {
      const data = await res.json();
      setCurrentUser(data);
    }
  };

  const fetchPosts = async () => {
    const res = await fetch("/api/posts");
    if (res.ok) {
      const data = await res.json();
      setPosts(data);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      setContent("");
      fetchPosts();
    } else {
      const data = await res.json();
      setError(data.message || "Failed to create post");
    }
  };

  const handleUpdatePost = async (id: string) => {
    const res = await fetch(`/api/posts/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent }),
    });

    if (res.ok) {
      setEditingPostId(null);
      fetchPosts();
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    const res = await fetch(`/api/posts/${id}`, { method: "DELETE" });
    if (res.ok) fetchPosts();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Create Post Form */}
        <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-gray-800">
            Create a Post
          </h2>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <form onSubmit={handleCreatePost}>
            <textarea
              className="w-full rounded-md border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="What's happening?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Post
              </button>
            </div>
          </form>
        </div>

        {/* Feed List */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="rounded-lg border bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">
                    @{post.user.username}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(post.createdAt).toLocaleString()}
                </span>
              </div>

              {editingPostId === post.id ? (
                <div className="mt-3">
                  <textarea
                    className="w-full rounded border p-2 text-sm"
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingPostId(null)}
                      className="rounded px-3 py-1 text-xs font-medium text-gray-600 border"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdatePost(post.id)}
                      className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="my-3 text-gray-800 whitespace-pre-line">
                  {post.content}
                </p>
              )}

              {currentUser?.id === post.user.id &&
                editingPostId !== post.id && (
                  <div className="flex justify-end gap-3 border-t pt-2">
                    <button
                      onClick={() => {
                        setEditingPostId(post.id);
                        setEditContent(post.content);
                      }}
                      className="text-xs font-medium text-blue-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
