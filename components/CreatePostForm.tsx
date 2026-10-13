"use client";

import { useState } from "react";

interface CreatePostFormProps {
  hasUsername: boolean;
  onPostCreated: () => void;
}

export default function CreatePostForm({
  hasUsername,
  onPostCreated,
}: CreatePostFormProps) {
  const [content, setContent] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !imagePreview) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, imageUrl: imagePreview }),
      });

      if (res.ok) {
        setContent("");
        setImagePreview(null);
        onPostCreated();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error("Post creation failed", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (!hasUsername) {
    return (
      <div className="bg-sky-100/70 border border-sky-300 text-sky-900 rounded-2xl p-4 mb-6 text-sm flex items-center justify-between">
        <span>
          ⚠️ Complete your profile and choose a username to publish posts.
        </span>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-sky-100 rounded-2xl shadow-sm p-4 mb-6"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share something with your network..."
        className="w-full bg-sky-50/50 border border-sky-100 rounded-xl p-3 text-sm text-sky-950 placeholder-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
        rows={3}
      />

      {imagePreview && (
        <div className="relative mt-3">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-h-52 w-full rounded-xl object-cover border border-sky-200"
          />
          <button
            type="button"
            onClick={() => setImagePreview(null)}
            className="absolute top-2 right-2 bg-sky-950/70 hover:bg-sky-950 text-white rounded-full w-7 h-7 text-xs font-bold transition flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mt-3 pt-2 border-t border-sky-100">
        <label className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-lg border border-sky-200 transition">
          📷 Add Photo
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </label>

        <button
          type="submit"
          disabled={submitting || (!content.trim() && !imagePreview)}
          className="px-5 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition shadow-sm disabled:opacity-40"
        >
          {submitting ? "Posting..." : "Post"}
        </button>
      </div>
    </form>
  );
}
