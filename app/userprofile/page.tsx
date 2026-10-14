"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

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

interface UserProfile {
  id: string;
  username: string | null;
  avatarUrl: string | null;
  bio: string | null;
  posts: Post[];
}

function UserProfileContent() {
  const searchParams = useSearchParams();
  const username = searchParams.get("username");
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Edit / Delete States
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editVisibility, setEditVisibility] = useState("PUBLIC");
  const [editImageUrls, setEditImageUrls] = useState<string[]>([]);
  const [menuOpenPostId, setMenuOpenPostId] = useState<string | null>(null);

  const [commentInputs, setCommentInputs] = useState<{
    [postId: string]: string;
  }>({});
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<
    string | null
  >(null);

  // Reply states
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  async function fetchUserProfile() {
    try {
      const res = await fetch(
        `/api/userprofile?username=${encodeURIComponent(username || "")}`,
      );
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }

      const postsRes = await fetch("/api/Posts");
      if (postsRes.ok) {
        const postsData = await postsRes.json();
        if (postsData.currentUserId) {
          setCurrentUserId(postsData.currentUserId);
        }
      }
    } catch (error) {
      console.error("Failed to load profile", error);
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
        fetchUserProfile();
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
        fetchUserProfile();
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
        fetchUserProfile();
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
        fetchUserProfile();
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
        fetchUserProfile();
      }
    } catch (error) {
      console.error("Failed to post reply");
    }
  }

  async function handleDeleteComment(postId: string, commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const res = await fetch(
        `/api/Posts/${postId}/comment?commentId=${commentId}`,
        {
          method: "DELETE",
        },
      );

      if (res.ok) {
        fetchUserProfile();
      } else {
        alert("Failed to delete comment");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  }

  if (loading) {
    return (
      <p className="text-center text-sky-600 py-12 font-medium">
        Loading profile...
      </p>
    );
  }

  if (!profile) {
    return (
      <p className="text-center text-red-500 py-12 font-medium">
        User not found.
      </p>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50/50 pb-12">
      <header className="bg-white border-b border-sky-100 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-xs font-semibold text-sky-700 hover:text-sky-900 bg-sky-50 px-3 py-2 rounded-xl border border-sky-200 transition cursor-pointer"
          >
            ← Back
          </button>
          <h1 className="text-base font-extrabold text-sky-900 tracking-wide">
            {profile.username || "Profile"}
          </h1>
          <div className="w-12"></div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
        {/* Profile Info */}
        <div className="bg-white rounded-3xl shadow-sm border border-sky-100 p-6 sm:p-8 space-y-6">
          <div className="flex items-center space-x-6 sm:space-x-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-sky-100 text-sky-800 font-extrabold text-3xl flex items-center justify-center uppercase overflow-hidden border-2 border-sky-400 shrink-0 shadow-inner">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.username?.charAt(0) || "U"
              )}
            </div>

            <div className="flex-1 space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-sky-950 tracking-tight">
                {profile.username || "Anonymous"}
              </h2>
              <div className="flex space-x-6 text-sm text-sky-900 font-medium">
                <div>
                  <span className="font-bold text-sky-600">
                    {profile.posts.length}
                  </span>{" "}
                  posts
                </div>
              </div>
            </div>
          </div>
          <p className="text-sm text-sky-900 whitespace-pre-wrap leading-relaxed">
            {profile.bio || "No bio available yet."}
          </p>
        </div>

        <div className="border-t border-sky-200 pt-4 flex justify-center">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-600 bg-sky-100/60 px-4 py-1.5 rounded-full border border-sky-200">
            📸 Posts
          </span>
        </div>

        {/* Posts Stream */}
        <div className="space-y-4">
          {profile.posts.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-sky-100 text-sky-400 text-sm font-medium">
              This user hasn't posted anything yet.
            </div>
          ) : (
            profile.posts.map((post) => {
              const isOwner =
                post.authorId === currentUserId ||
                post.author?.id === currentUserId ||
                profile.id === currentUserId;

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
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center uppercase overflow-hidden border border-sky-200">
                        {profile.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          profile.username?.charAt(0) || "U"
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sky-950">
                          {profile.username || "Anonymous"}
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
                            className="p-1.5 hover:bg-sky-50 rounded-full text-sky-600 font-bold text-lg cursor-pointer"
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
                                className="w-full text-left px-4 py-2 hover:bg-sky-50 text-sky-800 font-medium cursor-pointer"
                              >
                                ✏️ Edit Post
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleDeletePost(post.id);
                                  setMenuOpenPostId(null);
                                }}
                                className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-medium cursor-pointer"
                              >
                                🗑️ Delete Post
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Editing View with Image Upload */}
                  {editingPostId === post.id ? (
                    <div className="space-y-3 bg-sky-50/40 p-4 rounded-xl border border-sky-200">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-3 text-sm bg-white border border-sky-200 rounded-xl focus:outline-none resize-none"
                        rows={3}
                      />

                      {/* Edit Images Section */}
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
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold cursor-pointer"
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
                            className="px-4 py-1.5 bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdatePost(post.id)}
                            className="px-4 py-1.5 bg-sky-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    post.content && (
                      <p className="text-sky-900 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>
                    )
                  )}

                  {/* Images Display */}
                  {post.imageUrls && post.imageUrls.length > 0 && (
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
                      <span>{post.likes?.length || 0} Likes</span>
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
                          className="flex-1 px-3 py-2 text-sm bg-sky-50/50 border border-sky-200 rounded-xl focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl cursor-pointer"
                        >
                          Send
                        </button>
                      </form>

                      <div className="space-y-4 mt-3">
                        {post.comments?.map((comment) => (
                          <div key={comment.id} className="space-y-2">
                            <div className="flex items-start space-x-2.5">
                              <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 font-bold flex items-center justify-center uppercase overflow-hidden border border-sky-200 text-xs shrink-0">
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
                                  <span className="font-bold text-sky-950 block mb-0.5">
                                    {comment.user.username || "User"}
                                  </span>
                                  <p className="text-sky-900">
                                    {comment.content}
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
                                    isOwner) && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteComment(post.id, comment.id)
                                      }
                                      className="text-red-500 hover:underline font-bold cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Reply Input Box for Main Comment */}
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
                                  className="px-3 py-1.5 bg-sky-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
                                >
                                  Reply
                                </button>
                              </form>
                            )}

                            {/* Nested Replies */}
                            {comment.replies && comment.replies.length > 0 && (
                              <div className="ml-10 space-y-2 border-l-2 border-sky-200 pl-3 pt-1">
                                {comment.replies.map((reply) => (
                                  <div key={reply.id} className="space-y-2">
                                    <div className="bg-sky-50/40 p-2.5 rounded-xl border border-sky-100/60 text-xs space-y-1">
                                      <div className="flex justify-between items-center">
                                        <span className="font-bold text-sky-800">
                                          {reply.user?.username || "User"}
                                        </span>
                                        <div className="flex items-center space-x-3">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (activeReplyId === reply.id) {
                                                setActiveReplyId(null);
                                              } else {
                                                setActiveReplyId(reply.id);
                                                setReplyText(
                                                  `@${reply.user?.username || "user"} `,
                                                );
                                              }
                                            }}
                                            className="text-sky-600 hover:underline font-bold cursor-pointer"
                                          >
                                            {activeReplyId === reply.id
                                              ? "Cancel"
                                              : "Reply"}
                                          </button>
                                          {(reply.user?.id === currentUserId ||
                                            isOwner) && (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                handleDeleteComment(
                                                  post.id,
                                                  reply.id,
                                                )
                                              }
                                              className="text-red-500 hover:underline font-bold cursor-pointer"
                                            >
                                              Delete
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-sky-900">
                                        {reply.content}
                                      </p>
                                    </div>

                                    {/* Reply Input Box for Nested Reply */}
                                    {activeReplyId === reply.id && (
                                      <form
                                        onSubmit={(e) =>
                                          handleAddReply(post.id, comment.id, e)
                                        }
                                        className="flex gap-2 ml-4 mt-2"
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
                                          className="px-3 py-1.5 bg-sky-600 text-white text-xs font-semibold rounded-xl cursor-pointer"
                                        >
                                          Reply
                                        </button>
                                      </form>
                                    )}
                                  </div>
                                ))}
                              </div>
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

export default function UserProfilePage() {
  return (
    <Suspense
      fallback={<p className="text-center text-sky-600 py-12">Loading...</p>}
    >
      <UserProfileContent />
    </Suspense>
  );
}
