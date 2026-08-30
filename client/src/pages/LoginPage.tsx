import { useState } from "react";

import type { FormEvent } from "react";

import { Link, useLocation, useNavigate } from "react-router-dom";

import Container from "../components/layout/Container";

import { useAuth } from "../hooks/useAuth";

const LOGO_URL =
  "https://res.cloudinary.com/dy3a8sgs7/image/upload/v1787605738/ChatGPT_Image_Aug_22_2026_at_01_25_02_AM_kbz3h0.png";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo =
    new URLSearchParams(location.search).get("returnTo") || "/dashboard";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      await login(email, password);

      navigate(returnTo);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      const message =
        error.response?.data?.message ||
        "Unable to sign in. Please check your email and password.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Animated background */}
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

        <div
          className="absolute bottom-[10%] right-[20%] h-48 w-48 animate-bounce rounded-full bg-blue-100/20 blur-3xl"
          style={{
            animationDuration: "7s",
            animationDelay: "1s",
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.06),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.06),transparent_30%)]" />
      </div>

      <Container>
        <div className="relative z-10 grid min-h-[calc(100vh-4rem)] items-center gap-12 py-10 lg:grid-cols-2 lg:py-16">
          {/* Left side */}
          <section className="hidden lg:block">
            <div className="max-w-xl">
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-blue-100 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-md">
                <img
                  src={LOGO_URL}
                  alt="Denvia Online Market"
                  className="h-9 w-9 rounded-lg object-contain"
                />

                <span className="text-sm font-semibold text-gray-800">
                  Denvia Online Market
                </span>
              </div>

              <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-950">
                Welcome back to your
                <span className="block text-blue-600">online marketplace.</span>
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-gray-600">
                Sign in to manage your account, discover businesses, shop
                products, track orders, and connect through DOM.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-4">
                {[
                  ["Discover", "Businesses & products"],
                  ["Shop", "Simple online ordering"],
                  ["Connect", "Chat & updates"],
                ].map(([title, description], index) => (
                  <div
                    key={title}
                    className="group rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-2 hover:border-blue-100 hover:shadow-lg"
                    style={{
                      animation: "floatCard 5s ease-in-out infinite",
                      animationDelay: `${index * 0.8}s`,
                    }}
                  >
                    <p className="font-semibold text-gray-900 transition group-hover:text-blue-600">
                      {title}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      {description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex items-center gap-3 text-sm text-gray-500">
                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                <span>Everything you need, connected in one place.</span>
              </div>
            </div>
          </section>

          {/* Login form */}
          <section className="mx-auto w-full max-w-md">
            <div className="mb-7 text-center lg:hidden">
              <img
                src={LOGO_URL}
                alt="Denvia Online Market"
                className="mx-auto h-16 w-16 rounded-2xl object-contain shadow-sm"
              />
            </div>

            <div className="rounded-3xl border border-gray-100/80 bg-white/90 p-6 shadow-xl shadow-gray-200/60 backdrop-blur-xl transition duration-500 hover:shadow-2xl hover:shadow-blue-100/50 sm:p-8">
              <div className="mb-8">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                  Welcome back
                </p>

                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                  Sign in
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Enter your account details to continue to DOM.
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
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition duration-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  {loading ? "Signing you in..." : "Sign in to DOM"}
                </button>
              </form>

              <div className="my-7 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />

                <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
                  New to DOM?
                </span>

                <div className="h-px flex-1 bg-gray-200" />
              </div>

              <Link
                to={`/register?type=customer&returnTo=${encodeURIComponent(returnTo)}`}
                className="block w-full rounded-2xl border border-gray-200 px-4 py-3.5 text-center font-semibold text-gray-800 transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                Create a new account
              </Link>

              <p className="mt-6 text-center text-xs leading-5 text-gray-400">
                By continuing, you agree to use Denvia Online Market in
                accordance with its platform policies.
              </p>
            </div>
          </section>
        </div>
      </Container>

      <style>{`
        @keyframes floatCard {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </main>
  );
}

export default LoginPage;
