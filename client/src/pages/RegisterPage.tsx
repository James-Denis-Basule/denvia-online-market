import { useState } from 'react';

import type { FormEvent } from 'react';

import { Link, useNavigate } from 'react-router-dom';

import Container from '../components/layout/Container';

import { useAuth } from '../hooks/useAuth';

const LOGO_URL =
  'https://res.cloudinary.com/dy3a8sgs7/image/upload/v1787605738/ChatGPT_Image_Aug_22_2026_at_01_25_02_AM_kbz3h0.png';

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await register({
        firstName,
        lastName,
        email,
        password,
        phone: phone || undefined,
      });

      navigate('/login');
    } catch (err: any) {
      const response = err?.response?.data;

      if (response?.errors) {
        const firstError = Object.values(response.errors)
          .flat()
          .find((value) => typeof value === 'string');

        setError(
          typeof firstError === 'string'
            ? firstError
            : response.message || 'Unable to create your account.',
        );
      } else {
        setError(
          response?.message ||
            'Unable to create your account. Please try again.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Animated background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-80 w-80 animate-pulse rounded-full bg-blue-300/20 blur-3xl" />

        <div
          className="absolute right-[-8rem] top-20 h-96 w-96 animate-pulse rounded-full bg-indigo-300/20 blur-3xl"
          style={{ animationDelay: '1.5s' }}
        />

        <div
          className="absolute bottom-[-10rem] left-1/3 h-96 w-96 animate-pulse rounded-full bg-cyan-300/15 blur-3xl"
          style={{ animationDelay: '3s' }}
        />

        <div
          className="absolute bottom-20 right-1/4 h-48 w-48 animate-bounce rounded-full bg-blue-200/10 blur-3xl"
          style={{
            animationDuration: '8s',
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.06),transparent_28%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.06),transparent_30%)]" />
      </div>

      <style>
        {`
          @keyframes domFloat {
            0%, 100% {
              transform: translate3d(0, 0, 0);
            }
            50% {
              transform: translate3d(0, -18px, 0);
            }
          }

          @keyframes domDrift {
            0%, 100% {
              transform: translate3d(0, 0, 0) scale(1);
            }
            50% {
              transform: translate3d(25px, -15px, 0) scale(1.05);
            }
          }

          .dom-float {
            animation: domFloat 7s ease-in-out infinite;
          }

          .dom-drift {
            animation: domDrift 10s ease-in-out infinite;
          }
        `}
      </style>

      {/* Additional floating shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="dom-float absolute left-[8%] top-[28%] h-3 w-3 rounded-full bg-blue-400/30" />

        <div
          className="dom-float absolute left-[42%] top-[12%] h-2 w-2 rounded-full bg-indigo-400/30"
          style={{ animationDelay: '1s' }}
        />

        <div
          className="dom-float absolute right-[12%] top-[42%] h-4 w-4 rounded-full bg-cyan-400/20"
          style={{ animationDelay: '2s' }}
        />

        <div
          className="dom-drift absolute bottom-[15%] left-[15%] h-5 w-5 rounded-full border border-blue-300/20"
          style={{ animationDelay: '1.5s' }}
        />

        <div
          className="dom-drift absolute bottom-[25%] right-[8%] h-8 w-8 rounded-full border border-indigo-300/20"
          style={{ animationDelay: '3s' }}
        />
      </div>

      <div className="relative z-10">
        <Container>
          <div className="grid min-h-[calc(100vh-4rem)] items-center gap-12 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:py-14">
            <section className="hidden lg:block">
              <div className="max-w-lg">
                <div className="dom-float inline-block">
                  <img
                    src={LOGO_URL}
                    alt="Denvia Online Market"
                    className="mb-8 h-20 w-20 rounded-3xl object-contain shadow-md shadow-blue-200/50"
                  />
                </div>

                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
                  Join Denvia Online Market
                </p>

                <h1 className="mt-3 text-5xl font-bold leading-tight tracking-tight text-gray-950">
                  One account.
                  <span className="block text-blue-600">
                    A whole marketplace.
                  </span>
                </h1>

                <p className="mt-6 text-lg leading-8 text-gray-600">
                  Create your DOM account and get access to businesses,
                  products, services, orders, messaging, and your personal
                  marketplace dashboard.
                </p>

                <div className="mt-9 space-y-3">
                  {[
                    'Discover businesses and products',
                    'Manage your orders in one place',
                    'Connect with businesses through DOM',
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="dom-drift flex items-center gap-3 rounded-2xl border border-gray-100/80 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-sm transition hover:-translate-y-1 hover:shadow-md"
                      style={{
                        animationDelay: `${index * 0.8}s`,
                      }}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                        ✓
                      </span>

                      <span className="text-sm font-medium text-gray-700">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="mx-auto w-full max-w-xl">
              <div className="mb-7 text-center lg:hidden">
                <img
                  src={LOGO_URL}
                  alt="Denvia Online Market"
                  className="mx-auto h-16 w-16 rounded-2xl object-contain shadow-sm"
                />
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-gray-200/60 backdrop-blur-md sm:p-8">
                <div className="mb-7">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                    Get started
                  </p>

                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                    Create your account
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    It only takes a moment to get started with DOM.
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
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        First name
                      </label>

                      <input
                        id="firstName"
                        type="text"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        placeholder="James"
                        minLength={2}
                        maxLength={50}
                        required
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="lastName"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Last name
                      </label>

                      <input
                        id="lastName"
                        type="text"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        placeholder="Basule"
                        minLength={2}
                        maxLength={50}
                        required
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="register-email"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Email address
                    </label>

                    <input
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Phone number
                      <span className="ml-1 font-normal text-gray-400">
                        (optional)
                      </span>
                    </label>

                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="+256..."
                      className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="register-password"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Password
                      </label>

                      <input
                        id="register-password"
                        type="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="At least 8 characters"
                        minLength={8}
                        maxLength={128}
                        required
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Confirm password
                      </label>

                      <input
                        id="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        placeholder="Repeat password"
                        minLength={8}
                        maxLength={128}
                        required
                        className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-gray-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {password && confirmPassword && (
                    <p
                      className={`text-sm ${
                        password === confirmPassword
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {password === confirmPassword
                        ? '✓ Passwords match'
                        : 'Passwords do not match'}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-2xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {loading ? 'Creating your account...' : 'Create account'}
                  </button>
                </form>

                <div className="mt-7 border-t border-gray-100 pt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-blue-600 transition hover:text-blue-700"
                    >
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </section>
          </div>
        </Container>
      </div>
    </main>
  );
}

export default RegisterPage;