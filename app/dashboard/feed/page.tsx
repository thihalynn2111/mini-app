"use client";

import { useState, useEffect, useRef } from "react";
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

  // File Input Refs for clean UI
  const createFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

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
        <span key={index} className="font-bold text-[#1877F2]">
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

    const promises = filesToProcess.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((base64Images) => {
      setImageUrls((prev) => [...prev, ...base64Images]);
    });

    e.target.value = "";
  }

  function handleEditImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const remainingSlots = 8 - editImageUrls.length;
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    const promises = filesToProcess.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((base64Images) => {
      setEditImageUrls((prev) => [...prev, ...base64Images]);
    });

    e.target.value = "";
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
    <div className="min-h-screen bg-[#f0f2f5] pb-12">
      {/* Classic Facebook Blue Header */}
      <header className="bg-[#1877F2] border-b border-[#166fe5] sticky top-0 z-10 shadow-md">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full px-4 py-1.5 rounded-full bg-white/25 text-white placeholder-white/80 focus:outline-none text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => router.push("/onboarding")}
              className="text-xs font-semibold text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
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
              className="px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-xs font-semibold"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-2 sm:px-4 mt-4 space-y-4">
        {/* Create Post Box */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
          <form onSubmit={handleCreatePost} className="space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={3}
              className="w-full p-3 rounded-lg bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#1877F2] resize-none text-sm"
            />

            {/* Selected Image Previews */}
            {imageUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-2 pt-1">
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative w-full h-20 rounded-lg overflow-hidden border border-gray-200"
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
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold shadow-sm"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden Input File */}
            <input
              type="file"
              accept="image/*"
              multiple
              ref={createFileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />

            {/* Clean Action Toolbar */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => createFileInputRef.current?.click()}
                  disabled={imageUrls.length >= 8}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
                >
                  <span className="text-base">🖼️</span>
                  <span>
                    Photo {imageUrls.length > 0 && `(${imageUrls.length}/8)`}
                  </span>
                </button>

                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="px-2.5 py-1.5 bg-gray-100 border border-gray-200 text-gray-800 text-xs font-medium rounded-lg focus:outline-none"
                >
                  <option value="PUBLIC">🌍 Public</option>
                  <option value="ONLY_ME">🔒 Only Me</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold rounded-lg transition disabled:opacity-50 text-xs shadow-sm"
              >
                {loading ? "Posting..." : "Post"}
              </button>
            </div>
          </form>
        </div>

        {/* Feed Posts Stream */}
        <div className="space-y-4">
          {fetching ? (
            <p className="text-center text-gray-500 py-8 font-medium">
              Loading feed...
            </p>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200 text-gray-500">
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

              const isLiked = post.likes?.some(
                (like) => like.userId === currentUserId,
              );

              return (
                <div
                  key={post.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3 relative"
                >
                  {/* Post Header */}
                  <div className="flex items-center justify-between">
                    <div
                      onClick={() =>
                        router.push(
                          `/userprofile?username=${encodeURIComponent(post.author.username || "")}`,
                        )
                      }
                      className="flex items-center space-x-2.5 cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center uppercase overflow-hidden border border-gray-300">
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
                        <h3 className="font-semibold text-gray-900 group-hover:underline text-sm">
                          {post.author.username || "Anonymous"}
                        </h3>
                        <p className="text-[11px] text-gray-500 flex items-center space-x-1">
                          <span>
                            {new Date(post.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                              },
                            )}{" "}
                            ·{" "}
                            {post.visibility === "ONLY_ME"
                              ? "🔒 Only Me"
                              : "👥 Public"}
                          </span>
                        </p>
                      </div>
                    </div>

                    {isOwner && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setMenuOpenPostId(
                              menuOpenPostId === post.id ? null : post.id,
                            )
                          }
                          className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 font-bold text-lg"
                        >
                          •••
                        </button>

                        {menuOpenPostId === post.id && (
                          <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingPostId(post.id);
                                setEditContent(post.content || "");
                                setEditVisibility(post.visibility);
                                setEditImageUrls([...(post.imageUrls || [])]);
                                setMenuOpenPostId(null);
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800 font-medium"
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

                  {editingPostId === post.id ? (
                    <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1877F2] resize-none text-gray-950"
                        rows={3}
                      />

                      {/* Edit Image Section */}
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          ref={editFileInputRef}
                          onChange={handleEditImageChange}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          disabled={editImageUrls.length >= 8}
                          className="flex items-center space-x-1.5 px-3 py-1 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <span>🖼️</span>
                          <span>
                            Add Photo{" "}
                            {editImageUrls.length > 0 &&
                              `(${editImageUrls.length}/8)`}
                          </span>
                        </button>

                        {editImageUrls.length > 0 && (
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            {editImageUrls.map((url, idx) => (
                              <div
                                key={idx}
                                className="relative w-full h-16 rounded-md overflow-hidden border border-gray-200"
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
                                  className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold"
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
                          className="px-2.5 py-1 bg-white border border-gray-200 text-gray-800 text-xs font-medium rounded-lg"
                        >
                          <option value="PUBLIC">🌍 Public</option>
                          <option value="ONLY_ME">🔒 Only Me</option>
                        </select>
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingPostId(null)}
                            className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdatePost(post.id)}
                            className="px-3 py-1 bg-[#1877F2] text-white text-xs font-semibold rounded-lg hover:bg-[#166fe5]"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    post.content && (
                      <p className="text-gray-900 text-sm whitespace-pre-wrap leading-relaxed">
                        {renderFormattedContent(post.content)}
                      </p>
                    )
                  )}

                  {/* Multi-Image Display Grid */}
                  {post.imageUrls &&
                    Array.isArray(post.imageUrls) &&
                    post.imageUrls.length > 0 && (
                      <div
                        className={`grid gap-1 rounded-lg overflow-hidden ${
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
                            className="bg-gray-100 rounded overflow-hidden border border-gray-100 flex items-center justify-center max-h-72"
                          >
                            <img
                              src={imgUrl}
                              alt={`Post attachment ${idx + 1}`}
                              className="w-full h-full object-cover max-h-72"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Like Count Bar */}
                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-b border-gray-100 pb-2">
                    <span className="flex items-center space-x-1 cursor-pointer hover:underline">
                      <span>👍</span>
                      <span>{post.likes?.length || 0}</span>
                    </span>
                    <span className="cursor-pointer hover:underline">
                      {totalCommentsCount} Comments
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 text-center text-xs font-semibold text-gray-600">
                    <button
                      type="button"
                      onClick={() => handleLike(post.id)}
                      className={`py-1.5 rounded-lg transition flex items-center justify-center space-x-1.5 ${
                        isLiked
                          ? "text-[#1877F2] bg-sky-50 font-bold"
                          : "hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <span>👍</span>
                      <span>{isLiked ? "Liked" : "Like"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveCommentsPostId(
                          activeCommentsPostId === post.id ? null : post.id,
                        )
                      }
                      className="py-1.5 hover:bg-gray-50 rounded-lg transition flex items-center justify-center space-x-1.5"
                    >
                      <span>💬</span>
                      <span>Comment</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {activeCommentsPostId === post.id && (
                    <div className="pt-2 border-t border-gray-100 space-y-3">
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
                          className="flex-1 px-3 py-1.5 text-xs bg-gray-100 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-[#1877F2] text-gray-950 placeholder-gray-500"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-semibold rounded-full"
                        >
                          Send
                        </button>
                      </form>

                      <div className="space-y-3 mt-2">
                        {post.comments?.map((comment) => (
                          <div key={comment.id} className="space-y-1">
                            <div className="flex items-start space-x-2">
                              <div
                                onClick={() =>
                                  router.push(
                                    `/profile/${encodeURIComponent(comment.user.username || "")}`,
                                  )
                                }
                                className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center uppercase overflow-hidden border border-gray-300 text-[10px] shrink-0 cursor-pointer"
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
                                <div className="bg-[#f0f2f5] p-2.5 rounded-2xl text-xs">
                                  <span
                                    onClick={() =>
                                      router.push(
                                        `/profile/${encodeURIComponent(comment.user.username || "")}`,
                                      )
                                    }
                                    className="font-bold text-gray-900 hover:underline cursor-pointer block mb-0.5"
                                  >
                                    {comment.user.username || "User"}
                                  </span>
                                  <p className="text-gray-800">
                                    {renderFormattedContent(comment.content)}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-3 mt-1 ml-2 text-[10px] text-gray-500 font-medium">
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
                                    className="hover:underline font-bold text-gray-600 cursor-pointer"
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
                              <div className="pl-9 space-y-2 mt-2">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="space-y-1">
                                    <div className="flex items-start space-x-2">
                                      <div
                                        onClick={() =>
                                          router.push(
                                            `/profile/${encodeURIComponent(reply.user.username || "")}`,
                                          )
                                        }
                                        className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 font-bold flex items-center justify-center uppercase overflow-hidden border border-gray-300 text-[9px] shrink-0 cursor-pointer"
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
                                        <div className="bg-[#f0f2f5] p-2 rounded-xl text-xs">
                                          <span
                                            onClick={() =>
                                              router.push(
                                                `/profile/${encodeURIComponent(reply.user.username || "")}`,
                                              )
                                            }
                                            className="font-bold text-gray-900 hover:underline cursor-pointer block mb-0.5"
                                          >
                                            {reply.user.username || "User"}
                                          </span>
                                          <p className="text-gray-800">
                                            {renderFormattedContent(
                                              reply.content,
                                            )}
                                          </p>
                                        </div>

                                        {/* Reply Actions: Reply & Delete */}
                                        <div className="flex items-center space-x-3 mt-1 ml-2 text-[10px] text-gray-500 font-medium">
                                          <span>
                                            {new Date(
                                              reply.createdAt,
                                            ).toLocaleDateString()}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (
                                                activeReplyId === comment.id
                                              ) {
                                                setActiveReplyId(null);
                                              } else {
                                                setActiveReplyId(comment.id);
                                                setReplyText(
                                                  `@${reply.user.username || "user"} `,
                                                );
                                              }
                                            }}
                                            className="hover:underline font-bold text-gray-600 cursor-pointer"
                                          >
                                            {activeReplyId === comment.id
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
                                              className="hover:underline font-bold text-red-500 cursor-pointer"
                                            >
                                              Delete
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input Form */}
                            {activeReplyId === comment.id && (
                              <form
                                onSubmit={(e) =>
                                  handleAddReply(post.id, comment.id, e)
                                }
                                className="flex gap-2 ml-9 mt-1"
                              >
                                <input
                                  type="text"
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder="Write a reply..."
                                  className="flex-1 px-3 py-1 text-xs bg-gray-100 border border-gray-200 rounded-full focus:outline-none text-gray-950 placeholder-gray-500"
                                />
                                <button
                                  type="submit"
                                  className="px-2.5 py-1 bg-[#1877F2] text-white text-[11px] font-semibold rounded-full"
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
