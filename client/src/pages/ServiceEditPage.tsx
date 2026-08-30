import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Container from "../components/layout/Container";
import { useBusiness } from "../context/BusinessContext";
import {
  getMyServices,
  updateService,
  type PricingType,
  type ServiceStatus,
} from "../services/serviceService";

type ServiceForm = {
  name: string;
  description: string;
  category: string;
  price: string;
  currency: string;
  pricingType: PricingType;
  duration: string;
  status: ServiceStatus;
  isVisible: boolean;
};

const emptyForm: ServiceForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  currency: "UGX",
  pricingType: "fixed",
  duration: "",
  status: "active",
  isVisible: true,
};

const serviceCategories = [
  "Accounting & Finance",
  "Advertising & Marketing",
  "Beauty & Personal Care",
  "Business Consulting",
  "Cleaning",
  "Construction",
  "Education & Training",
  "Events & Entertainment",
  "Food & Catering",
  "Health & Wellness",
  "IT & Technology",
  "Legal Services",
  "Photography & Media",
  "Professional Services",
  "Repairs & Maintenance",
  "Transportation",
  "Other",
];

function ServiceEditPage() {
  const navigate = useNavigate();
  const { serviceId } = useParams<{ serviceId: string }>();
  const { activeBusiness } = useBusiness();

  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function updateForm<K extends keyof ServiceForm>(
    field: K,
    value: ServiceForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  useEffect(() => {
    async function loadService() {
      if (!activeBusiness?._id || !serviceId) {
        setError("Unable to identify the service you want to edit.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await getMyServices(activeBusiness._id);
        const service = response.data?.services?.find(
          (item) => item._id === serviceId,
        );

        if (!service) {
          setError("Service not found.");
          return;
        }

        setForm({
          name: service.name,
          description: service.description ?? "",
          category: service.category ?? "",
          price:
            service.price === undefined || service.price === null
              ? ""
              : String(service.price),
          currency: service.currency || "UGX",
          pricingType: service.pricingType,
          duration:
            service.duration === undefined || service.duration === null
              ? ""
              : String(service.duration),
          status: service.status,
          isVisible: service.isVisible,
        });
      } catch (requestError: any) {
        setError(
          requestError?.response?.data?.message ||
            "Unable to load this service right now.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadService();
  }, [activeBusiness?._id, serviceId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!serviceId) {
      setError("Service ID is missing.");
      return;
    }

    if (!form.name.trim()) {
      setError("Service name is required.");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category.trim() || undefined,
      price: form.price === "" ? undefined : Number(form.price),
      currency: form.currency.trim().toUpperCase() || "UGX",
      pricingType: form.pricingType,
      duration: form.duration === "" ? undefined : Number(form.duration),
      status: form.status,
      isVisible: form.isVisible,
    };

    try {
      await updateService(serviceId, payload);
      navigate("/services/manage");
    } catch (requestError: any) {
      setError(
        requestError?.response?.data?.message ||
          "Unable to update this service right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 py-10">
        <Container>
          <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Loading service...
            </p>
          </section>
        </Container>
      </main>
    );
  }

  if (!activeBusiness || error && !form.name) {
    return (
      <main className="min-h-screen bg-slate-50 py-8 sm:py-10">
        <Container>
          <section className="rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-10 text-white shadow-2xl shadow-blue-200/40 sm:px-10">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
              DOM service management
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Edit service
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Update your service information and keep your marketplace
              listing accurate.
            </p>
          </section>

          <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">
              {activeBusiness ? "Service unavailable" : "No business selected"}
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {error ||
                "You need an active business before you can edit services."}
            </p>

            <Link
              to="/services/manage"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Back to services
            </Link>
          </section>
        </Container>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 py-8 sm:py-10">
      <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-64 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />

      <Container>
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-10 text-white shadow-2xl shadow-blue-200/40 sm:px-10 sm:py-12">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
              DOM service management
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Edit service
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Update the service offered by your business across the Denvia
              marketplace.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
              <span className="h-2 w-2 rounded-full bg-green-300" />
              {activeBusiness.name}
            </div>
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

          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label
                htmlFor="service-name"
                className="text-sm font-semibold text-gray-700"
              >
                Service name *
              </label>

              <input
                id="service-name"
                value={form.name}
                onChange={(event) =>
                  updateForm("name", event.target.value)
                }
                required
                maxLength={150}
                placeholder="e.g. Website Design"
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="service-description"
                className="text-sm font-semibold text-gray-700"
              >
                Description
              </label>

              <textarea
                id="service-description"
                value={form.description}
                onChange={(event) =>
                  updateForm("description", event.target.value)
                }
                rows={5}
                maxLength={2000}
                placeholder="Describe what customers receive..."
                className="mt-2 w-full resize-y rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label
                htmlFor="service-category"
                className="text-sm font-semibold text-gray-700"
              >
                Category
              </label>

              <select
                id="service-category"
                value={form.category}
                onChange={(event) =>
                  updateForm("category", event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="">Select category</option>
                {serviceCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="service-pricing"
                className="text-sm font-semibold text-gray-700"
              >
                Pricing
              </label>

              <select
                id="service-pricing"
                value={form.pricingType}
                onChange={(event) =>
                  updateForm(
                    "pricingType",
                    event.target.value as PricingType,
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="fixed">Fixed price</option>
                <option value="starting_from">Starting from</option>
                <option value="negotiable">Negotiable</option>
                <option value="free">Free</option>
              </select>
            </div>

            {form.pricingType !== "free" && (
              <div>
                <label
                  htmlFor="service-price"
                  className="text-sm font-semibold text-gray-700"
                >
                  Price
                </label>

                <input
                  id="service-price"
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(event) =>
                    updateForm("price", event.target.value)
                  }
                  placeholder="e.g. 150000"
                  className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="service-currency"
                className="text-sm font-semibold text-gray-700"
              >
                Currency
              </label>

              <input
                id="service-currency"
                value={form.currency}
                onChange={(event) =>
                  updateForm("currency", event.target.value.toUpperCase())
                }
                maxLength={3}
                placeholder="UGX"
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm uppercase text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label
                htmlFor="service-duration"
                className="text-sm font-semibold text-gray-700"
              >
                Duration
              </label>

              <input
                id="service-duration"
                type="number"
                min="0"
                value={form.duration}
                onChange={(event) =>
                  updateForm("duration", event.target.value)
                }
                placeholder="Minutes"
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              />

              <p className="mt-1 text-xs text-gray-500">
                Enter duration in minutes.
              </p>
            </div>

            <div>
              <label
                htmlFor="service-status"
                className="text-sm font-semibold text-gray-700"
              >
                Status
              </label>

              <select
                id="service-status"
                value={form.status}
                onChange={(event) =>
                  updateForm(
                    "status",
                    event.target.value as ServiceStatus,
                  )
                }
                className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex items-center gap-3 md:pt-7">
              <input
                id="service-visible"
                type="checkbox"
                checked={form.isVisible}
                onChange={(event) =>
                  updateForm("isVisible", event.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />

              <label
                htmlFor="service-visible"
                className="text-sm font-semibold text-gray-700"
              >
                Visible on marketplace
              </label>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
            <Link
              to="/services/manage"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Saving changes..." : "Save changes"}
            </button>
          </div>
        </form>
      </Container>
    </main>
  );
}

export default ServiceEditPage;
