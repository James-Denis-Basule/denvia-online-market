import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import Container from "../components/layout/Container";
import { createOrganization } from "../services/organizationService";

function OrganizationCreatePage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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

    const name = form.name.trim();

    if (!name) {
      setError("Organization name is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await createOrganization({
        name,
        description: form.description.trim() || undefined,
      });

      if (!response.success || !response.data?.organization) {
        throw new Error(
          response.message || "Unable to create organization.",
        );
      }

      navigate("/businesses");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create organization right now.",
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
              Denvia organization
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Create an organization
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Manage multiple businesses together under one organization on
              Denvia.
            </p>
          </div>
        </section>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 max-w-3xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8"
        >
          {error && (
            <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="text-sm font-semibold text-gray-700"
            >
              Organization name *
            </label>

            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              maxLength={120}
              placeholder="e.g. Denvia Holdings"
              className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />

            <p className="mt-2 text-xs text-gray-500">
              This is the name you will use to manage your businesses together.
            </p>
          </div>

          <div className="mt-6">
            <label
              htmlFor="description"
              className="text-sm font-semibold text-gray-700"
            >
              Organization description
            </label>

            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              maxLength={1000}
              placeholder="Describe the organization and the businesses it manages..."
              className="mt-2 w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 px-4 py-4">
            <p className="text-sm font-semibold text-blue-900">
              What happens next?
            </p>

            <p className="mt-1 text-sm leading-6 text-blue-700">
              After creating your organization, you can add businesses to it
              and manage multiple businesses from one place.
            </p>
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
              {submitting ? "Creating organization..." : "Create organization"}
            </button>
          </div>
        </form>
      </Container>
    </main>
  );
}

export default OrganizationCreatePage;
