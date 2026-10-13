"use client";

import { useState, useRef, useEffect, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image"; // Import Next.js Image component

export default function OnboardingPage() {
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true); // Fetching existing user data state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // State for preview URL
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // State for the actual File
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref to trigger file input click
  const router = useRouter();

  // 🟢 ဝင်လာတာနဲ့ Register တုန်းက သို့မဟုတ် ရှိပြီးသား User ရဲ့ Data တွေကို ဆွဲထုတ်ရန်
  useEffect(() => {
    async function fetchUserData() {
      try {
        const res = await fetch("/api/profile"); // သင့်ရဲ့ profile/current user API
        if (res.ok) {
          const data = await res.json();
          if (data.username) setUsername(data.username);
          if (data.bio) setBio(data.bio);
          if (data.avatarUrl) setAvatarPreview(data.avatarUrl);
        }
      } catch (error) {
        console.error("Failed to load user profile", error);
      } finally {
        setFetching(false);
      }
    }
    fetchUserData();
  }, []);

  // Handle image selection and create preview
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string); // Set base64 string for preview
      };
      reader.readAsDataURL(file); // Read file as base64
    }
  };

  // Helper to trigger the hidden file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    // Prepare profile data
    const profileData: any = { username, bio };

    if (avatarPreview) {
      profileData.avatarUrl = avatarPreview;
    }

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });

    if (res.ok) {
      router.push("/dashboard/feed");
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to update profile");
      setLoading(false);
    }
  }

  // Fallback initial
  const initial = username ? username.charAt(0).toUpperCase() : "?";

  return (
    <div className="min-h-screen flex items-center justify-center bg-sky-50 px-4 py-12">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-6 text-white text-center relative">
          <h1 className="text-2xl font-bold tracking-tight">
            Set Up Your Profile
          </h1>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
          {/* Avatar Section - Revised for FB feel */}
          <div className="flex flex-col items-center justify-center -mt-16 mb-4 relative">
            <div
              className="relative group cursor-pointer"
              onClick={triggerFileInput}
            >
              <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center bg-gradient-to-tr from-sky-100 to-blue-200 text-sky-800 text-3xl font-bold uppercase overflow-hidden">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  initial
                )}
              </div>
              {/* Camera Icon Overlay */}
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-8 h-8 text-white"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15a2.25 2.25 0 002.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
                  />
                </svg>
              </div>
            </div>
            {/* Hidden File Input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
            <span className="text-xs text-sky-700 font-medium mt-2">
              Click to change avatar
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-sky-950 mb-1.5">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="e.g. josh_dev"
                className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-sky-50/30 text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition"
              />
              <p className="text-xs text-sky-500 mt-1">
                This will be your unique handle across the community.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-sky-950 mb-1.5">
                Bio{" "}
                <span className="text-xs text-sky-400 font-normal">
                  (Optional)
                </span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Write a short bio about yourself..."
                className="w-full px-4 py-3 border border-sky-200 rounded-xl bg-sky-50/30 text-sky-950 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition resize-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || fetching}
              className="w-full py-3.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl transition-all shadow-md shadow-sky-200 disabled:opacity-60 cursor-pointer"
            >
              {loading ? "Saving Profile..." : "Next: Go to Feed"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
