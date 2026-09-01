import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Container from "../components/layout/Container";
import { createOrganization } from "../services/organizationService";

function OrganizationCreatePage() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Organization name is required.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);

      const response = await createOrganization({
        name: trimmedName,
        description: description.trim() || undefined,
      });

      const organization = response.data?.organization;

      if (!organization?._id) {
        throw new Error("Organization was created but no ID was returned.");
      }

      /*
       * A newly created organization has no businesses yet.
       * Continue directly to business creation and pass the organization ID
       * so the new business can be attached to it.
       */
      navigate(
        `/businesses/create?organizationId=${encodeURIComponent(
          organization._id,
        )}`,
        { replace: true },
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to create the organization right now.";

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 sm:py-10">
      <Container>
        <section className="mx-auto max-w-2xl overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-8 sm:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
              Organization setup
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">
              Create an organization
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
              Create an organization to manage multiple businesses together on
              Denvia.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-8 sm:px-8">
            {error && (
              <div className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="organization-name"
                className="text-sm font-semibold text-gray-900"
              >
                Organization name
              </label>

              <input
                id="organization-name"
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Denvia Group"
                disabled={isSubmitting}
                className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="mt-5">
              <label
                htmlFor="organization-description"
                className="text-sm font-semibold text-gray-900"
              >
                Description
                <span className="ml-1 font-normal text-gray-400">
                  (optional)
                </span>
              </label>

              <textarea
                id="organization-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Describe your organization..."
                rows={4}
                disabled={isSubmitting}
                className="mt-2 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                to="/businesses"
                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Creating organization..."
                  : "Create organization"}
              </button>
            </div>
          </form>
        </section>
      </Container>
    </main>
  );
}

export default OrganizationCreatePage;