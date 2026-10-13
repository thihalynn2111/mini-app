"use client";

import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoading(false);
        setErrorMessage(data.message || "Invalid email or password");
        return;
      }

      // 🟢 API က ပေးလိုက်တဲ့ redirectTo သို့မဟုတ် isNewUser အပေါ်မူတည်၍ လမ်းကြောင်းပြောင်းခြင်း
      if (data.redirectTo) {
        window.location.href = data.redirectTo;
      } else if (data.isNewUser) {
        window.location.href = "/onboarding";
      } else {
        window.location.href = "/dashboard/feed";
      }
    } catch {
      setLoading(false);
      setErrorMessage("Something went wrong");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-sky-950/5 border border-sky-100 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-600 text-3xl font-bold text-white shadow-lg shadow-sky-200">
            S
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-sky-950">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-sky-600">
            Sign in to your account to continue
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-sky-900"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full rounded-xl border border-sky-200 bg-sky-50/40 px-4 py-3 text-sky-950 outline-none transition placeholder:text-sky-300 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-sky-900"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-xl border border-sky-200 bg-sky-50/40 px-4 py-3 text-sky-950 outline-none transition placeholder:text-sky-300 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-100"
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-600">
              {errorMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3.5 font-semibold text-white shadow-md shadow-sky-200 transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <div className="mt-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-sky-100" />
            <span className="text-xs font-medium uppercase tracking-wider text-sky-400">
              New here?
            </span>
            <div className="h-px flex-1 bg-sky-100" />
          </div>

          <p className="text-center text-sm text-sky-700">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-sky-600 hover:text-sky-800 hover:underline"
            >
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
