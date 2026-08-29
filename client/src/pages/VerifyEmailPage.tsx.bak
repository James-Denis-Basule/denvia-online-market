import { useEffect, useState } from 'react';

import { Link, useSearchParams } from 'react-router-dom';

import Container from '../components/layout/Container';

import { verifyEmail } from '../services/authService';

const LOGO_URL =
  'https://res.cloudinary.com/dy3a8sgs7/image/upload/v1787605738/ChatGPT_Image_Aug_22_2026_at_01_25_02_AM_kbz3h0.png';

function VerifyEmailPage() {
  const [searchParams] = useSearchParams();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<
    'checking' | 'waiting' | 'success' | 'error'
  >(token ? 'checking' : 'waiting');

  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        setStatus('checking');
        setMessage('');


        const response = await verifyEmail(token!);

        if (cancelled) {
          return;
        }

        setStatus('success');
        setMessage(
          response?.message ||
            'Your email address has been verified successfully.',
        );
      } catch (error: any) {
        if (cancelled) {
          return;
        }

        setStatus('error');

        setMessage(
          error?.response?.data?.message ||
            'This verification link is invalid or has expired.',
        );
      }
    }

    void verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const title =
    status === 'success'
      ? 'Email verified'
      : status === 'error'
        ? 'Verification unsuccessful'
        : status === 'checking'
          ? 'Verifying your email'
          : 'Check your email';

  return (
    <main className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-24 -top-24 h-80 w-80 animate-pulse rounded-full bg-blue-200/30 blur-3xl" />

        <div
          className="absolute right-[-8rem] top-[12%] h-96 w-96 animate-pulse rounded-full bg-indigo-200/25 blur-3xl"
          style={{ animationDelay: '1.5s' }}
        />

        <div
          className="absolute bottom-[-10rem] left-[30%] h-96 w-96 animate-pulse rounded-full bg-cyan-200/20 blur-3xl"
          style={{ animationDelay: '3s' }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.06),transparent_30%),radial-gradient(circle_at_80%_70%,rgba(99,102,241,0.06),transparent_30%)]" />
      </div>

      <Container>
        <div className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center py-10 sm:py-16">
          <section className="w-full max-w-lg">
            <div className="mb-7 text-center">
              <img
                src={LOGO_URL}
                alt="Denvia Online Market"
                className="mx-auto h-20 w-20 rounded-3xl object-contain shadow-md shadow-blue-200/50"
              />
            </div>

            <div className="rounded-3xl border border-gray-100/80 bg-white/90 p-6 text-center shadow-xl shadow-gray-200/60 backdrop-blur-xl sm:p-10">
              <div
                className={[
                  'mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold',
                  status === 'success'
                    ? 'bg-green-100 text-green-600'
                    : status === 'error'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-blue-100 text-blue-600',
                ].join(' ')}
              >
                {status === 'success'
                  ? '✓'
                  : status === 'error'
                    ? '!'
                    : status === 'checking'
                      ? '...'
                      : '@'}
              </div>

              <p className="mt-7 text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
                Denvia Online Market
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
                {title}
              </h1>

              {status === 'waiting' && (
                <>
                  <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-gray-600">
                    Your account has been created successfully. We sent a
                    verification link to your email address.
                  </p>

                  {email && (
                    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                      <p className="text-sm font-semibold text-blue-900">
                        {email}
                      </p>
                    </div>
                  )}

                  <div className="mt-7 rounded-2xl border border-gray-100 bg-gray-50 px-5 py-4 text-left">
                    <p className="text-sm font-semibold text-gray-800">
                      What to do next
                    </p>

                    <ol className="mt-3 space-y-2 text-sm leading-6 text-gray-600">
                      <li>1. Open your email inbox.</li>
                      <li>2. Find the Denvia verification email.</li>
                      <li>3. Click “Verify Email Address”.</li>
                    </ol>
                  </div>

                  <p className="mt-5 text-xs leading-5 text-gray-400">
                    The verification link expires after 24 hours.
                  </p>

                  <div className="mt-7 border-t border-gray-100 pt-6">
                    <p className="text-sm text-gray-500">
                      Already verified your email?{' '}
                      <Link
                        to="/login"
                        className="font-semibold text-blue-600 transition hover:text-blue-700"
                      >
                        Sign in
                      </Link>
                    </p>
                  </div>
                </>
              )}

              {status === 'checking' && (
                <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-gray-600">
                  Please wait while we verify your email address.
                </p>
              )}

              {status === 'success' && (
                <>
                  <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-gray-600">
                    {message}
                  </p>

                  <div className="mt-7 rounded-2xl border border-green-100 bg-green-50 px-5 py-4">
                    <p className="text-sm font-semibold text-green-800">
                      Your account is now ready to use.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-green-700">
                      Sign in with your email and password to continue to your
                      dashboard.
                    </p>
                  </div>

                  <Link
                    to="/login"
                    className="mt-7 block w-full rounded-2xl bg-blue-600 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-200 transition duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl"
                  >
                    Continue to sign in
                  </Link>
                </>
              )}

              {status === 'error' && (
                <>
                  <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-gray-600">
                    {message}
                  </p>

                  <div className="mt-7 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-left">
                    <p className="text-sm font-semibold text-red-800">
                      The verification link could not be used.
                    </p>
                    <p className="mt-1 text-xs leading-5 text-red-700">
                      It may have expired or already been used. If you already
                      verified your email, you can sign in normally.
                    </p>
                  </div>

                  <Link
                    to="/login"
                    className="mt-7 block w-full rounded-2xl border border-gray-200 px-4 py-3.5 font-semibold text-gray-800 transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Go to sign in
                  </Link>

                  <Link
                    to="/register"
                    className="mt-3 block text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                  >
                    Create another account
                  </Link>
                </>
              )}
            </div>
          </section>
        </div>
      </Container>
    </main>
  );
}

export default VerifyEmailPage;
