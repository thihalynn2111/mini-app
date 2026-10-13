"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface ReplyItem {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string | null; avatarUrl: string | null };
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; username: string | null; avatarUrl: string | null };
  replies?: ReplyItem[];
}

interface Post {
  id: string;
  authorId: string;
  content: string | null;
  imageUrls: string[];
  visibility: string;
  createdAt: string;
  author: { id: string; username: string | null; avatarUrl: string | null };
  likes: { userId: string }[];
  comments: CommentItem[];
}

export default function FeedPage() {
  const [content, setContent] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [visibility, setVisibility] = useState("PUBLIC");
  const [searchQuery, setSearchQuery] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Edit State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editVisibility, setEditVisibility] = useState("PUBLIC");
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [menuOpenPostId, setMenuOpenPostId] = useState<string | null>(null);

  // Comment & Reply states
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<
    string | null
  >(null);
  const [commentInputs, setCommentInputs] = useState<{
    [postId: string]: string;
  }>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const router = useRouter();

  useEffect(() => {
    fetchPosts();
  }, []);

  function renderFormattedContent(text: string) {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, index) =>
      part.startsWith("@") ? (
        <span key={index} className="font-bold text-sky-700">
          {part}
        </span>
      ) : (
        part
      ),
    );
  }

  async function fetchPosts() {
    try {
      const res = await fetch("/api/Posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || data);
        if (data.currentUserId) setCurrentUserId(data.currentUserId);
      }
    } catch (error) {
      console.error("Failed to load feed");
    } finally {
      setFetching(false);
    }
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 8 - imageUrls.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrls((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && imageUrls.length === 0) {
      alert("Please enter a status or select an image.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/Posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim() || null,
          imageUrls: imageUrls,
          visibility: visibility,
        }),
      });

      if (res.ok) {
        setContent("");
        setImageUrls([]);
        setVisibility("PUBLIC");
        fetchPosts();
      } else {
        alert("Failed to create post");
      }
    } catch (error) {
      console.error("Create post error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdatePost(postId: string) {
    try {
      const res = await fetch(`/api/Posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editContent,
          visibility: editVisibility,
          imageUrls: editImageUrls,
        }),
      });

      if (res.ok) {
        setEditingPostId(null);
        fetchPosts();
      } else {
        alert("Failed to update post");
      }
    } catch (error) {
      console.error("Update error:", error);
    }
  }

  async function handleDeletePost(postId: string) {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const res = await fetch(`/api/Posts/${postId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchPosts();
      } else {
        alert("Failed to delete post");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  }

  async function handleLike(postId: string) {
    try {
      const res = await fetch(`/api/Posts/${postId}/like`, {
        method: "POST",
      });

      if (res.ok) {
        fetchPosts();
      } else {
        console.error("Failed to like post");
      }
    } catch (error) {
      console.error("Like error:", error);
    }
  }

  async function handleAddComment(postId: string, e: React.FormEvent) {
    e.preventDefault();
    const text = commentInputs[postId] || "";
    if (!text.trim()) return;

    try {
      const res = await fetch(`/api/Posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });

      if (res.ok) {
        setCommentInputs({ ...commentInputs, [postId]: "" });
        fetchPosts();
      }
    } catch (error) {
      console.error("Failed to post comment");
    }
  }

  async function handleAddReply(
    postId: string,
    parentId: string,
    e: React.FormEvent,
  ) {
    e.preventDefault();
    if (!replyText.trim()) return;

    try {
      const res = await fetch(`/api/Posts/${postId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText, parentId }),
      });

      if (res.ok) {
        setReplyText("");
        setActiveReplyId(null);
        fetchPosts();
      }
    } catch (error) {
      console.error("Failed to post reply");
    }
  }

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();

    const usernameMatch = post.author?.username
      ? post.author.username.toLowerCase().includes(query)
      : false;

    const contentMatch = post.content
      ? post.content.toLowerCase().includes(query)
      : false;

    return usernameMatch || contentMatch;
  });

  return (
    <div className="min-h-screen bg-sky-50/50 pb-12">
      <header className="bg-white border-b border-sky-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-sky-600 tracking-tight">
            Community Feed
          </h1>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push("/onboarding")}
              className="text-sm font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 transition"
            >
              Edit Profile
            </button>
            <button
              onClick={async () => {
                try {
                  const res = await fetch("/api/logout", {
                    method: "POST",
                  });
                  if (res.ok) {
                    window.location.href = "/login";
                  }
                } catch (error) {
                  console.error("Logout failed", error);
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition cursor-pointer font-medium text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search posts by keyword or username..."
            className="w-full px-4 py-2.5 rounded-xl bg-sky-50/40 border border-sky-200 text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
          />
        </div>

        {/* Create Post Box */}
        <div className="bg-white rounded-2xl shadow-sm border border-sky-100 p-4 sm:p-6 space-y-3">
          <form onSubmit={handleCreatePost} className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind? (Status)"
              rows={2}
              className="w-full p-3 rounded-xl bg-sky-50/30 border border-sky-200 text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none text-sm"
            />

            <div className="space-y-1">
              <label className="text-xs font-semibold text-sky-700">
                Upload Images (Up to 8):
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="w-full px-3 py-2 rounded-xl bg-sky-50/30 border border-sky-200 text-sky-900 text-sm focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
              />

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {imageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative w-full h-20 rounded-lg overflow-hidden border border-sky-200"
                    >
                      <img
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setImageUrls(imageUrls.filter((_, i) => i !== idx))
                        }
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="px-3 py-2 bg-sky-50 border border-sky-200 text-sky-900 text-sm font-medium rounded-xl"
              >
                <option value="PUBLIC">🌍 Public</option>
                <option value="ONLY_ME">🔒 Only Me</option>
              </select>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition disabled:opacity-50 text-sm shadow-sm"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>

        {/* Feed Posts Stream */}
        <div className="space-y-4">
          {fetching ? (
            <p className="text-center text-sky-600 py-8 font-medium">
              Loading feed...
            </p>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-sky-100 text-sky-500">
              No posts found.
            </div>
          ) : (
            filteredPosts.map((post) => {
              const isOwner =
                post.authorId === currentUserId ||
                post.author?.id === currentUserId;
              const totalCommentsCount =
                (post.comments?.length || 0) +
                (post.comments?.reduce(
                  (acc, c) => acc + (c.replies?.length || 0),
                  0,
                ) || 0);

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl shadow-sm border border-sky-100 p-6 space-y-4 relative"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between">
                    <div
                      onClick={() =>
                        router.push(
                          `/userprofile?username=${encodeURIComponent(post.author.username || "")}`,
                        )
                      }
                      className="flex items-center space-x-3 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center uppercase overflow-hidden border border-sky-200 group-hover:border-sky-500 transition">
                        {post.author.avatarUrl ? (
                          <img
                            src={post.author.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          post.author.username?.charAt(0) || "U"
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sky-950 group-hover:text-sky-600 transition">
                          {post.author.username || "Anonymous"}
                        </h3>
                        <p className="text-xs text-sky-400">
                          {new Date(post.createdAt).toLocaleDateString(
                            undefined,
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        {post.visibility === "ONLY_ME"
                          ? "🔒 Only Me"
                          : "🌍 Public"}
                      </span>

                      {isOwner && (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setMenuOpenPostId(
                                menuOpenPostId === post.id ? null : post.id,
                              )
                            }
                            className="p-1.5 hover:bg-sky-50 rounded-full text-sky-600 font-bold text-lg"
                          >
                            •••
                          </button>

                          {menuOpenPostId === post.id && (
                            <div className="absolute right-0 mt-1 w-36 bg-white border border-sky-100 rounded-xl shadow-lg z-20 overflow-hidden text-xs">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPostId(post.id);
                                  setEditContent(post.content || "");
                                  setEditVisibility(post.visibility);
                                  setEditImageUrls(post.imageUrls || []);
                                  setMenuOpenPostId(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-sky-50 text-sky-800 font-medium"
                              >
                                ✏️ Edit Post
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleDeletePost(post.id);
                                  setMenuOpenPostId(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-medium"
                              >
                                🗑️ Delete Post
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {editingPostId === post.id ? (
                    <div className="space-y-3 bg-sky-50/40 p-4 rounded-xl border border-sky-200">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 text-sm bg-white border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                        rows={3}
                      />

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-sky-700">
                          Edit Images (Up to 8):
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = e.target.files;
                            if (!files) return;
                            const remainingSlots = 8 - editImageUrls.length;
                            const filesToProcess = Array.from(files).slice(
                              0,
                              remainingSlots,
                            );

                            filesToProcess.forEach((file) => {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setEditImageUrls((prev) => [
                                  ...prev,
                                  reader.result as string,
                                ]);
                              };
                              reader.readAsDataURL(file);
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white border border-sky-200 text-sky-900 text-xs focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
                        />

                        {editImageUrls.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {editImageUrls.map((url, idx) => (
                              <div
                                key={idx}
                                className="relative w-full h-20 rounded-lg overflow-hidden border border-sky-200"
                              >
                                <img
                                  src={url}
                                  alt={`Edit Preview ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditImageUrls(
                                      editImageUrls.filter((_, i) => i !== idx),
                                    )
                                  }
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <select
                          value={editVisibility}
                          onChange={(e) => setEditVisibility(e.target.value)}
                          className="px-3 py-1.5 bg-white border border-sky-200 text-sky-900 text-xs font-medium rounded-xl"
                        >
                          <option value="PUBLIC">🌍 Public</option>
                          <option value="ONLY_ME">🔒 Only Me</option>
                        </select>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingPostId(null)}
                            className="px-4 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-300 transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdatePost(post.id)}
                            className="px-4 py-1.5 bg-sky-600 text-white text-xs font-semibold rounded-xl hover:bg-sky-700 transition"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    post.content && (
                      <p className="text-sky-900 whitespace-pre-wrap leading-relaxed">
                        {renderFormattedContent(post.content)}
                      </p>
                    )
                  )}

                  {/* Multi-Image Display Grid */}
                  {post.imageUrls &&
                    Array.isArray(post.imageUrls) &&
                    post.imageUrls.length > 0 && (
                      <div
                        className={`grid gap-2 rounded-xl overflow-hidden ${
                          post.imageUrls.length === 1
                            ? "grid-cols-1"
                            : post.imageUrls.length === 2
                              ? "grid-cols-2"
                              : "grid-cols-2 sm:grid-cols-3"
                        }`}
                      >
                        {post.imageUrls.map((imgUrl, idx) => (
                          <div
                            key={idx}
                            className="bg-black/5 rounded-lg overflow-hidden border border-sky-100 flex items-center justify-center max-h-80"
                          >
                            <img
                              src={imgUrl}
                              alt={`Post attachment ${idx + 1}`}
                              className="w-full h-full object-cover max-h-80"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-6 pt-2 border-t border-sky-50 text-sm">
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      className="flex items-center space-x-1.5 text-sky-700 hover:text-sky-900 font-medium transition cursor-pointer"
                    >
                      <span>❤️</span>
                      <span>
                        {post.likes?.length || 0}{" "}
                        {post.likes?.length === 0 || post.likes?.length === 1
                          ? "Like"
                          : "Likes"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveCommentsPostId(
                          activeCommentsPostId === post.id ? null : post.id,
                        )
                      }
                      className="flex items-center space-x-1.5 text-sky-700 hover:text-sky-900 font-medium transition cursor-pointer"
                    >
                      <span>💬</span>
                      <span>{totalCommentsCount} Comments</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {activeCommentsPostId === post.id && (
                    <div className="pt-4 border-t border-sky-100 space-y-4">
                      <form
                        onSubmit={(e) => handleAddComment(post.id, e)}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={commentInputs[post.id] || ""}
                          onChange={(e) =>
                            setCommentInputs({
                              ...commentInputs,
                              [post.id]: e.target.value,
                            })
                          }
                          placeholder="Write a comment..."
                          className="flex-1 px-3 py-2 text-sm bg-sky-50/50 border border-sky-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl"
                        >
                          Send
                        </button>
                      </form>

                      <div className="space-y-4 mt-3">
                        {post.comments?.map((comment) => (
                          <div key={comment.id} className="space-y-2">
                            <div className="flex items-start space-x-2.5">
                              <div
                                onClick={() =>
                                  router.push(
                                    `/profile/${encodeURIComponent(comment.user.username || "")}`,
                                  )
                                }
                                className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center uppercase overflow-hidden border border-sky-200 text-xs shrink-0 cursor-pointer"
                              >
                                {comment.user.avatarUrl ? (
                                  <img
                                    src={comment.user.avatarUrl}
                                    alt="Avatar"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  comment.user.username?.charAt(0) || "U"
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="bg-sky-50/80 p-3 rounded-2xl border border-sky-100 text-sm">
                                  <span
                                    onClick={() =>
                                      router.push(
                                        `/profile/${encodeURIComponent(comment.user.username || "")}`,
                                      )
                                    }
                                    className="font-bold text-sky-950 hover:underline cursor-pointer block mb-0.5"
                                  >
                                    {comment.user.username || "User"}
                                  </span>
                                  <p className="text-sky-900">
                                    {renderFormattedContent(comment.content)}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-4 mt-1 ml-3 text-xs text-sky-500 font-medium">
                                  <span>
                                    {new Date(
                                      comment.createdAt,
                                    ).toLocaleDateString()}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (activeReplyId === comment.id) {
                                        setActiveReplyId(null);
                                      } else {
                                        setActiveReplyId(comment.id);
                                        setReplyText(
                                          `@${comment.user.username || "user"} `,
                                        );
                                      }
                                    }}
                                    className="hover:underline font-bold text-sky-600 cursor-pointer"
                                  >
                                    {activeReplyId === comment.id
                                      ? "Cancel"
                                      : "Reply"}
                                  </button>
                                  {(comment.user.id === currentUserId ||
                                    post.authorId === currentUserId) && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (
                                          !confirm(
                                            "Are you sure you want to delete this comment?",
                                          )
                                        )
                                          return;
                                        try {
                                          const res = await fetch(
                                            `/api/Posts/${post.id}/comment?commentId=${comment.id}`,
                                            {
                                              method: "DELETE",
                                            },
                                          );
                                          if (res.ok) {
                                            fetchPosts();
                                          } else {
                                            alert("Failed to delete comment");
                                          }
                                        } catch (error) {
                                          console.error("Delete error:", error);
                                        }
                                      }}
                                      className="hover:underline font-bold text-red-500 cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="pl-10 space-y-3 mt-2">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="space-y-2">
                                    <div className="flex items-start space-x-2">
                                      <div
                                        onClick={() =>
                                          router.push(
                                            `/profile/${encodeURIComponent(reply.user.username || "")}`,
                                          )
                                        }
                                        className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center uppercase overflow-hidden border border-sky-200 text-[10px] shrink-0 cursor-pointer"
                                      >
                                        {reply.user.avatarUrl ? (
                                          <img
                                            src={reply.user.avatarUrl}
                                            alt="Avatar"
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          reply.user.username?.charAt(0) || "U"
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <div className="bg-white p-2.5 rounded-xl border border-sky-100 text-xs shadow-sm">
                                          <span
                                            onClick={() =>
                                              router.push(
                                                `/profile/${encodeURIComponent(reply.user.username || "")}`,
                                              )
                                            }
                                            className="font-bold text-sky-950 hover:underline cursor-pointer block mb-0.5"
                                          >
                                            {reply.user.username || "User"}
                                          </span>
                                          <p className="text-sky-900">
                                            {renderFormattedContent(
                                              reply.content,
                                            )}
                                          </p>
                                        </div>
                                        <div className="flex items-center space-x-3 mt-1 ml-2 text-[10px] text-sky-500 font-medium">
                                          <span>
                                            {new Date(
                                              reply.createdAt,
                                            ).toLocaleDateString()}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (activeReplyId === reply.id) {
                                                setActiveReplyId(null);
                                              } else {
                                                setActiveReplyId(reply.id);
                                                setReplyText(
                                                  `@${reply.user.username || "user"} `,
                                                );
                                              }
                                            }}
                                            className="hover:underline font-bold text-sky-600 cursor-pointer"
                                          >
                                            {activeReplyId === reply.id
                                              ? "Cancel"
                                              : "Reply"}
                                          </button>
                                          {(reply.user.id === currentUserId ||
                                            post.authorId ===
                                              currentUserId) && (
                                            <button
                                              type="button"
                                              onClick={async () => {
                                                if (
                                                  !confirm(
                                                    "Are you sure you want to delete this reply?",
                                                  )
                                                )
                                                  return;
                                                try {
                                                  const res = await fetch(
                                                    `/api/Posts/${post.id}/comment?commentId=${reply.id}`,
                                                    {
                                                      method: "DELETE",
                                                    },
                                                  );
                                                  if (res.ok) {
                                                    fetchPosts();
                                                  } else {
                                                    alert(
                                                      "Failed to delete reply",
                                                    );
                                                  }
                                                } catch (error) {
                                                  console.error(
                                                    "Delete error:",
                                                    error,
                                                  );
                                                }
                                              }}
                                              className="hover:underline font-bold text-red-500 cursor-pointer ml-2"
                                            >
                                              Delete
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Reply Input Form for nested reply */}
                                    {activeReplyId === reply.id && (
                                      <form
                                        onSubmit={(e) =>
                                          handleAddReply(post.id, comment.id, e)
                                        }
                                        className="flex gap-2 ml-8 mt-2"
                                      >
                                        <input
                                          type="text"
                                          value={replyText}
                                          onChange={(e) =>
                                            setReplyText(e.target.value)
                                          }
                                          placeholder="Write a reply..."
                                          className="flex-1 px-3 py-1.5 text-xs bg-sky-50/50 border border-sky-200 rounded-xl focus:outline-none"
                                        />
                                        <button
                                          type="submit"
                                          className="px-3 py-1.5 bg-sky-600 text-white text-xs font-semibold rounded-xl"
                                        >
                                          Reply
                                        </button>
                                        {(reply.user.id === currentUserId ||
                                          post.authorId === currentUserId) && (
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              if (
                                                !confirm(
                                                  "Are you sure you want to delete this reply?",
                                                )
                                              )
                                                return;
                                              try {
                                                const res = await fetch(
                                                  `/api/Posts/${post.id}/comment?commentId=${reply.id}`,
                                                  {
                                                    method: "DELETE",
                                                  },
                                                );
                                                if (res.ok) {
                                                  fetchPosts();
                                                } else {
                                                  alert(
                                                    "Failed to delete reply",
                                                  );
                                                }
                                              } catch (error) {
                                                console.error(
                                                  "Delete error:",
                                                  error,
                                                );
                                              }
                                            }}
                                            className="hover:underline font-bold text-red-500 cursor-pointer"
                                          >
                                            Delete
                                          </button>
                                        )}
                                      </form>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input Form for main comment */}
                            {activeReplyId === comment.id && (
                              <form
                                onSubmit={(e) =>
                                  handleAddReply(post.id, comment.id, e)
                                }
                                className="flex gap-2 ml-10 mt-2"
                              >
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Write a reply..."
                                  className="flex-1 px-3 py-1.5 text-xs bg-sky-50/50 border border-sky-200 rounded-xl focus:outline-none"
                                />
                                <button
                                  type="submit"
                                  className="px-3 py-1.5 bg-sky-600 text-white text-xs font-semibold rounded-xl"
                                >
                                  Reply
                                </button>
                              </form>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
