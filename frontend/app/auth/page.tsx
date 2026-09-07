"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const API_URL = "https://scalar-signal-backend.onrender.com";

type Mode = "login" | "register";

export default function AuthPage() {
  const router = useRouter();

  const [mode, setMode] = useState<Mode>("login");
  const [showOtp, setShowOtp] = useState(false);

  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function switchMode(nextMode: Mode) {
    setMode(nextMode);
    setError("");
    setShowOtp(false);
    setOtp("");
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Login failed");
      }

      localStorage.setItem(
        "access_token",
        data.access_token
      );

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!showOtp) {
      setShowOtp(true);
      return;
    }

    if (otp !== "123456") {
      setError("Invalid OTP. Use 123456 for this assignment.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username,
          phone: phone || null,
          password,
          display_name: displayName,
          avatar_url: null,
          otp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Registration failed"
        );
      }

      setMode("login");
      setShowOtp(false);
      setOtp("");
      setPassword("");
      setError("");

      alert("Registration successful. Please login.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] px-6 text-white">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-dashed border-[#555559] text-[#eeeeee]">
            <svg
              width="42"
              height="42"
              viewBox="0 0 100 100"
              fill="none"
            >
              <path
                d="M28 31.5h44c6.9 0 12.5 5.6 12.5 12.5v17c0 6.9-5.6 12.5-12.5 12.5H51l-14 10v-10h-9c-6.9 0-12.5-5.6-12.5-12.5V44C15.5 37.1 21.1 31.5 28 31.5Z"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinejoin="round"
              />
              <path
                d="M31 48h38M31 57h25"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-[30px] font-bold tracking-[-0.5px]">
            {mode === "login"
              ? "Welcome back"
              : "Create your account"}
          </h1>

          <p className="mt-2 text-[14px] text-[#8e8e93]">
            {mode === "login"
              ? "Sign in to continue to Signal"
              : "Create a secure messaging account"}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[#29292b] bg-[#1c1c1e] p-6">
          <form
            onSubmit={
              mode === "login"
                ? handleLogin
                : handleRegister
            }
            className="space-y-4"
          >
            {/* Display name */}
            {mode === "register" && (
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#b8b8bd]">
                  Display name
                </label>

                <input
                  type="text"
                  value={displayName}
                  onChange={(event) =>
                    setDisplayName(event.target.value)
                  }
                  placeholder="Your name"
                  required
                  className="h-12 w-full rounded-xl border border-[#303034] bg-[#0f0f0f] px-4 text-sm text-white outline-none transition focus:border-[#6c5dd3]"
                />
              </div>
            )}

            {/* Username */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-[#b8b8bd]">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                placeholder="Enter username"
                required
                className="h-12 w-full rounded-xl border border-[#303034] bg-[#0f0f0f] px-4 text-sm text-white outline-none transition focus:border-[#6c5dd3]"
              />
            </div>

            {/* Phone */}
            {mode === "register" && (
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#b8b8bd]">
                  Phone number
                  <span className="ml-1 text-[#66666b]">
                    (optional)
                  </span>
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="9876543210"
                  className="h-12 w-full rounded-xl border border-[#303034] bg-[#0f0f0f] px-4 text-sm text-white outline-none transition focus:border-[#6c5dd3]"
                />
              </div>
            )}

            {/* Password */}
            <div>
              <label className="mb-2 block text-[13px] font-medium text-[#b8b8bd]">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Enter password"
                required
                className="h-12 w-full rounded-xl border border-[#303034] bg-[#0f0f0f] px-4 text-sm text-white outline-none transition focus:border-[#6c5dd3]"
              />
            </div>

            {/* OTP */}
            {mode === "register" && showOtp && (
              <div>
                <label className="mb-2 block text-[13px] font-medium text-[#b8b8bd]">
                  Verification code
                </label>

                <input
                  type="text"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value)
                  }
                  placeholder="123456"
                  maxLength={6}
                  required
                  className="h-12 w-full rounded-xl border border-[#303034] bg-[#0f0f0f] px-4 text-sm tracking-[4px] text-white outline-none transition focus:border-[#6c5dd3]"
                />

                <p className="mt-2 text-[12px] text-[#77777d]">
                  Use 123456 as the mock OTP.
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-[#5a2525] bg-[#321818] px-4 py-3 text-[13px] text-[#ff8a8a]">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-[#6c5dd3] text-sm font-bold text-white transition hover:bg-[#7b68ee] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in"
                  : showOtp
                    ? "Verify & create account"
                    : "Continue"}
            </button>
          </form>

          {/* Switch auth mode */}
          <div className="mt-6 border-t border-[#303034] pt-5 text-center">
            {mode === "login" ? (
              <p className="text-[13px] text-[#8e8e93]">
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => switchMode("register")}
                  className="font-semibold text-[#7b68ee] hover:underline"
                >
                  Create account
                </button>
              </p>
            ) : (
              <p className="text-[13px] text-[#8e8e93]">
                Already have an account?{" "}
                <button
                  onClick={() => switchMode("login")}
                  className="font-semibold text-[#7b68ee] hover:underline"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-[#66666b]">
          Your conversations are private and secure.
        </p>
      </div>
    </main>
  );
}