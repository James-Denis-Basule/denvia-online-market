import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Container from '../components/layout/Container';
import { createBusiness } from '../services/businessService';

function BusinessCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    slogan: '',
    description: '',
    category: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: 'Uganda',
    logo: '',
    coverImage: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError('Business name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const response = await createBusiness({
        name: form.name.trim(),
        slogan: form.slogan.trim() || undefined,
        description: form.description.trim() || undefined,
        category: form.category.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        country: form.country.trim() || undefined,
        logo: form.logo.trim() || undefined,
        coverImage: form.coverImage.trim() || undefined,
      });

      if (!response.success) {
        throw new Error(response.message || 'Unable to create business.');
      }

      navigate('/businesses/manage');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to create business right now.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 py-8 sm:py-10">
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-64 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />

      <Container>
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-10 text-white shadow-2xl shadow-blue-200/40 sm:px-10 sm:py-12">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
              DOM business setup
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Create your business
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Create your business profile and establish how customers will
              see your brand on DOM.
            </p>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
        >
          {error && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="text-sm font-semibold text-gray-700"
              >
                Business name *
              </label>
              <input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Basule Electronics"
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label
                htmlFor="slogan"
                className="text-sm font-semibold text-gray-700"
              >
                Brand slogan
              </label>
              <input
                id="slogan"
                name="slogan"
                value={form.slogan}
                onChange={handleChange}
                placeholder="e.g. Technology made simple"
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="text-sm font-semibold text-gray-700"
              >
                Category
              </label>
              <input
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Electronics"
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="text-sm font-semibold text-gray-700"
              >
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+256..."
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="text-sm font-semibold text-gray-700"
              >
                Business email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="business@example.com"
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label
                htmlFor="city"
                className="text-sm font-semibold text-gray-700"
              >
                City
              </label>
              <input
                id="city"
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Kampala"
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="text-sm font-semibold text-gray-700"
              >
                Address
              </label>
              <input
                id="address"
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Street, building or area"
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label
                htmlFor="country"
                className="text-sm font-semibold text-gray-700"
              >
                Country
              </label>
              <input
                id="country"
                name="country"
                value={form.country}
                onChange={handleChange}
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>
          </div>

          <div className="mt-6">
            <label
              htmlFor="description"
              className="text-sm font-semibold text-gray-700"
            >
              Business description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Tell customers what your business offers..."
              className="mt-2 w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div className="mt-8 border-t border-gray-100 pt-8">
            <h2 className="text-lg font-bold text-gray-900">
              Brand images
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Add your business logo and cover image. These can be managed
              later from business management.
            </p>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div>
                <label
                  htmlFor="logo"
                  className="text-sm font-semibold text-gray-700"
                >
                  Logo URL
                </label>
                <input
                  id="logo"
                  name="logo"
                  value={form.logo}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <div>
                <label
                  htmlFor="coverImage"
                  className="text-sm font-semibold text-gray-700"
                >
                  Cover image URL
                </label>
                <input
                  id="coverImage"
                  name="coverImage"
                  value={form.coverImage}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
            <Link
              to="/businesses"
              className="rounded-xl border border-gray-200 px-5 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating business...' : 'Create business'}
            </button>
          </div>
        </form>
      </Container>
    </main>
  );
}

export default BusinessCreatePage;
