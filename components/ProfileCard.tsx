"use client";

import { useState, useEffect } from "react";

interface UserProfile {
  id: string;
  username: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export default function ProfileCard() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile");
      if (res.ok) {
        const data: UserProfile = await res.json();
        setProfile(data);
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatarUrl || null);
      }
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, bio, avatarUrl }),
      });

      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setIsEditing(false);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to update profile");
      }
    } catch (err) {
      console.error("Failed to update profile", err);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sky-600 text-center font-medium">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="bg-sky-50/60 border border-sky-100 rounded-2xl shadow-sm p-6 max-w-lg mx-auto">
      {!isEditing ? (
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <img
              src={
                profile?.avatarUrl ||
                "https://via.placeholder.com/100?text=User"
              }
              alt={profile?.username || "Avatar"}
              className="w-24 h-24 rounded-full object-cover border-4 border-sky-200 shadow-sm"
            />
          </div>
          <h2 className="text-xl font-bold text-sky-950">
            {profile?.username ? `@${profile.username}` : "No username set"}
          </h2>
          <p className="text-sky-700/80 text-sm mt-2 max-w-sm">
            {profile?.bio ||
              "No bio added yet. Click edit to set up your profile."}
          </p>
          <button
            onClick={() => setIsEditing(true)}
            className="mt-5 px-5 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition shadow-sm"
          >
            Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <h2 className="text-lg font-bold text-sky-900 border-b border-sky-200 pb-2">
            Edit Your Profile
          </h2>

          <div>
            <label className="block text-xs font-semibold text-sky-800 uppercase tracking-wider mb-1">
              Avatar Image
            </label>
            <div className="flex items-center gap-4">
              <img
                src={avatarUrl || "https://via.placeholder.com/100?text=User"}
                alt="Preview"
                className="w-14 h-14 rounded-full object-cover border-2 border-sky-300"
              />
              <label className="cursor-pointer bg-sky-100 border border-sky-300 text-sky-700 hover:bg-sky-200 px-3 py-1.5 rounded-lg text-xs font-medium transition">
                Change Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-sky-800 uppercase tracking-wider mb-1">
              Username *
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. alex_dev"
              className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-sm text-sky-900 placeholder-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-sky-800 uppercase tracking-wider mb-1">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full bg-white border border-sky-200 rounded-xl px-3 py-2 text-sm text-sky-900 placeholder-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-sky-100 text-sky-700 rounded-xl text-sm font-medium hover:bg-sky-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-700 transition shadow-sm"
            >
              Save Profile
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
