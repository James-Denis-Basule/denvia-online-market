import { useState } from "react";

import type { FormEvent } from "react";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Container from "../components/layout/Container";

import { resetPassword } from "../services/authService";

const LOGO_URL =
  "https://res.cloudinary.com/dy3a8sgs7/image/upload/v1787605738/ChatGPT_Image_Aug_22_2026_at_01_25_02_AM_kbz3h0.png";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await resetPassword(token, password);

      setSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message =
        error.response?.data?.message ||
        "This reset link is invalid or has expired.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-24 -top-24 h-80 w-80 animate-pulse rounded-full bg-blue-200/30 blur-3xl" />

        <div
          className="absolute right-[-8rem] top-[12%] h-96 w-96 animate-pulse rounded-full bg-indigo-200/25 blur-3xl"
          style={{ animationDelay: "1.5s" }}
        />

        <div
          className="absolute bottom-[-10rem] left-[30%] h-96 w-96 animate-pulse rounded-full bg-cyan-200/20 blur-3xl"
          style={{ animationDelay: "3s" }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.06),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.06),transparent_30%)]" />
      </div>

      <Container>
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center py-10 sm:py-16">
          <section className="mx-auto w-full max-w-md">
            <div className="mb-7 text-center">
              <img
                src={LOGO_URL}
                alt="Denvia Online Market"
                className="mx-auto h-16 w-16 rounded-2xl object-contain shadow-sm"
              />
            </div>

            <div className="rounded-3xl border border-gray-100/80 bg-white/90 p-6 shadow-xl shadow-gray-200/60 backdrop-blur-xl transition duration-500 hover:shadow-2xl hover:shadow-blue-100/50 sm:p-8">
              {!token ? (
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-2xl font-bold text-red-600">
                    !
                  </div>

                  <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-950">
                    Missing reset link
                  </h2>

                  <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-gray-600">
                    This page needs a valid reset token from your email
                    link. Request a new one below.
                  </p>

                  <Link
                    to="/forgot-password"
                    className="mt-7 block w-full rounded-2xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
                  >
                    Request a new link
                  </Link>
                </div>
              ) : success ? (
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-2xl font-bold text-green-600">
                    ✓
                  </div>

                  <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-950">
                    Password reset
                  </h2>

                  <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-gray-600">
                    Your password has been reset successfully. Redirecting
                    you to sign in...
                  </p>

                  <Link
                    to="/login"
                    className="mt-7 block w-full rounded-2xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
                  >
                    Continue to sign in
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                      Reset password
                    </p>

                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                      Choose a new password
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Enter a new password for your account below.
                    </p>
                  </div>

                  {error && (
                    <div
                      role="alert"
                      className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700"
                    >
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        New password
                      </label>

                      <input
                        id="password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="At least 8 characters"
                        required
                        minLength={8}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Confirm new password
                      </label>

                      <input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        placeholder="Re-enter your new password"
                        required
                        minLength={8}
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {loading ? "Resetting password..." : "Reset password"}
                    </button>
                  </form>
                </>
              )}
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}

export default ResetPasswordPage;
