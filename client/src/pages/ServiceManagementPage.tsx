import { useCallback, useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import type { FormEvent } from "react";
import Container from "../components/layout/Container";
import LoadingState from "../components/ui/LoadingState";
import { useBusiness } from "../context/BusinessContext";
import {
  createService,
  deleteService,
  getMyServices,
  getDeletedServices,
  restoreService,
  updateService,
  type PricingType,
  type Service,
  type ServiceStatus,
} from "../services/serviceService";

type ServiceFilter =
  | "all"
  | "activated"
  | "archived"
  | "visible"
  | "hidden"
  | "deleted";

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

const currencies = [
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "USD", name: "US Dollar" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "RWF", name: "Rwandan Franc" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
];

function ServiceManagementPage() {
  const navigate = useNavigate();
  const { businesses, activeBusiness, selectActiveBusiness } = useBusiness();

  const [services, setServices] = useState<Service[]>([]);
  const [deletedServices, setDeletedServices] = useState<Service[]>([]);
  const [serviceFilter, setServiceFilter] = useState<ServiceFilter>("all");
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [servicePage, setServicePage] = useState(1);
  const SERVICE_PAGE_SIZE = 12;

  const [servicePagination, setServicePagination] = useState({
    page: 1,
    limit: SERVICE_PAGE_SIZE,
    totalServices: 0,
    totalPages: 1,
  });

  const loadServices = useCallback(async () => {
    if (!activeBusiness?._id) {
      setServices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [response, binResponse] = await Promise.all([
        getMyServices(
          activeBusiness._id,
          servicePage,
          SERVICE_PAGE_SIZE,
        ),
        getDeletedServices(activeBusiness._id),
      ]);

      setServices(response.data?.services ?? []);
      setServicePagination(
        response.data?.pagination ?? {
          page: servicePage,
          limit: SERVICE_PAGE_SIZE,
          totalServices: response.data?.services?.length ?? 0,
          totalPages: 1,
        },
      );
      setDeletedServices(binResponse.data?.services ?? []);
    } catch {
      setError("Unable to load your services right now.");
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [activeBusiness, servicePage]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadServices();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [loadServices]);

  function updateForm<K extends keyof ServiceForm>(
    field: K,
    value: ServiceForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingService(null);
    setShowForm(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeBusiness?._id) {
      setError("Create or select a business before adding a service.");
      return;
    }

    if (!form.name.trim()) {
      setError("Service name is required.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

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
      if (editingService) {
        await updateService(editingService._id, payload);
        setSuccess("Service updated successfully.");
      } else {
        await createService({
          businessId: activeBusiness._id,
          ...payload,
        });
        setSuccess("Service created successfully.");
      }

      resetForm();
      await loadServices();
    } catch (requestError: unknown) {
      setError(
        (requestError instanceof Error ? requestError.message : "") ||
          "Unable to save this service right now.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(service: Service) {
    const confirmed = window.confirm(
      `Move "${service.name}" to the Bin? It will be permanently deleted after 30 days unless restored.`,
    );

    if (!confirmed) {
      return;
    }

    setWorkingId(service._id);
    setError("");
    setSuccess("");

    try {
      await deleteService(service._id);

      if (editingService?._id === service._id) {
        resetForm();
      }

      setSuccess(
        "Service moved to the Bin. It will be permanently deleted after 30 days.",
      );
      await loadServices();
    } catch (requestError: unknown) {
      setError(
        (requestError instanceof Error ? requestError.message : "") ||
          "Unable to delete this service right now.",
      );
    } finally {
      setWorkingId("");
    }
  }

  async function handleToggleVisibility(service: Service) {
    setWorkingId(service._id);
    setError("");
    setSuccess("");

    try {
      await updateService(service._id, {
        isVisible: !service.isVisible,
      });

      await loadServices();
    } catch {
      setError("Unable to update service visibility.");
    } finally {
      setWorkingId("");
    }
  }

  async function handleToggleStatus(service: Service) {
    setWorkingId(service._id);
    setError("");
    setSuccess("");

    try {
      await updateService(service._id, {
        status: service.status === "active" ? "archived" : "active",
      });

      await loadServices();
    } catch {
      setError("Unable to update service status.");
    } finally {
      setWorkingId("");
    }
  }

  const filteredServices =
    serviceFilter === "deleted"
      ? deletedServices
      : services.filter((service) => {
          switch (serviceFilter) {
            case "activated":
              return service.status === "active";
            case "archived":
              return service.status === "archived";
            case "visible":
              return service.isVisible;
            case "hidden":
              return !service.isVisible;
            case "all":
            default:
              return true;
          }
        });

  const filterCounts = {
    all: services.length,
    activated: services.filter((service) => service.status === "active").length,
    archived: services.filter((service) => service.status === "archived")
      .length,
    visible: services.filter((service) => service.isVisible).length,
    hidden: services.filter((service) => !service.isVisible).length,
    deleted: deletedServices.length,
  };

  useEffect(() => {
    setServicePage(1);
  }, [serviceFilter, activeBusiness?._id]);

  const emptyState = {
    all: {
      title: "No services yet",
      message:
        "This business has not added any services yet. Add services to showcase what your business offers.",
      action: true,
    },
    activated: {
      title: "No activated services",
      message: "There are no activated services for this business right now.",
      action: false,
    },
    archived: {
      title: "No archived services",
      message: "There are no archived services for this business right now.",
      action: false,
    },
    visible: {
      title: "No visible services",
      message: "There are no visible services for customers to see right now.",
      action: false,
    },
    hidden: {
      title: "No hidden services",
      message: "There are no hidden services for this business right now.",
      action: false,
    },
    deleted: {
      title: "No deleted services",
      message: "There are no deleted services in the Bin right now.",
      action: false,
    },
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8 sm:py-10">
      <Container>
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-9 text-white shadow-2xl shadow-blue-200/40 sm:px-10">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
              Business Center
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Services
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
              Add and manage the services your business offers. Active, visible
              services can appear across the Denvia marketplace.
            </p>

            {activeBusiness && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-green-300" />
                {activeBusiness.name}
              </div>
            )}
          </div>
        </section>

        {businesses.length > 1 && (
          <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <label
              htmlFor="business-selector"
              className="block text-sm font-semibold text-gray-800"
            >
              Manage services for
            </label>

            <select
              id="business-selector"
              value={activeBusiness?._id ?? ""}
              onChange={(event) => {
                void selectActiveBusiness(event.target.value);
              }}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {businesses.map((business) => (
                <option key={business._id} value={business._id}>
                  {business.name}
                </option>
              ))}
            </select>
          </section>
        )}

        {!activeBusiness ? (
          <section className="mt-8 rounded-2xl border border-blue-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-2xl font-bold text-blue-600">
              +
            </div>

            <h2 className="mt-5 text-xl font-bold text-gray-900">
              Create a business first
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-600">
              You need an active business before you can add services.
            </p>

            <a
              href="/businesses/create"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create business
            </a>
          </section>
        ) : (
          <>
            {(error || success) && (
              <div
                className={`mt-6 rounded-xl border px-4 py-3 text-sm font-medium ${
                  error
                    ? "border-red-100 bg-red-50 text-red-600"
                    : "border-green-100 bg-green-50 text-green-700"
                }`}
              >
                {error || success}
              </div>
            )}

            {!showForm && (
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate("/services/create")}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  + Add Service
                </button>
              </div>
            )}

            {showForm && (
              <>
                <section className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                        {editingService ? "Edit service" : "New service"}
                      </p>

                      <h2 className="mt-1 text-2xl font-bold text-gray-900">
                        {editingService
                          ? `Edit ${editingService.name}`
                          : "Add a service"}
                      </h2>
                    </div>

                    {editingService && (
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Cancel editing
                      </button>
                    )}
                  </div>

                  <form
                    onSubmit={handleSubmit}
                    className="mt-6 grid gap-5 md:grid-cols-2"
                  >
                    <div className="md:col-span-2">
                      <label className="text-sm font-semibold text-gray-800">
                        Service name *
                      </label>
                      <input
                        value={form.name}
                        onChange={(event) =>
                          updateForm("name", event.target.value)
                        }
                        placeholder="e.g. Website Design"
                        maxLength={150}
                        required
                        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="text-sm font-semibold text-gray-800">
                        Description
                      </label>
                      <textarea
                        value={form.description}
                        onChange={(event) =>
                          updateForm("description", event.target.value)
                        }
                        placeholder="Describe what customers receive..."
                        rows={4}
                        maxLength={2000}
                        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="service-category"
                        className="text-sm font-semibold text-gray-800"
                      >
                        Category
                      </label>
                      <select
                        id="service-category"
                        value={form.category}
                        onChange={(event) =>
                          updateForm("category", event.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">Select a category</option>
                        {serviceCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-800">
                        Pricing
                      </label>
                      <select
                        value={form.pricingType}
                        onChange={(event) =>
                          updateForm(
                            "pricingType",
                            event.target.value as PricingType,
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="fixed">Fixed price</option>
                        <option value="starting_from">Starting from</option>
                        <option value="negotiable">Negotiable</option>
                        <option value="free">Free</option>
                      </select>
                    </div>

                    {form.pricingType !== "free" && (
                      <div>
                        <label className="text-sm font-semibold text-gray-800">
                          Price
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={form.price}
                          onChange={(event) =>
                            updateForm("price", event.target.value)
                          }
                          placeholder="e.g. 150000"
                          className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="service-currency"
                        className="text-sm font-semibold text-gray-800"
                      >
                        Currency
                      </label>
                      <select
                        id="service-currency"
                        value={form.currency}
                        onChange={(event) =>
                          updateForm("currency", event.target.value)
                        }
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        {currencies.map((currency) => (
                          <option key={currency.code} value={currency.code}>
                            {currency.code} — {currency.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-800">
                        Duration
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={form.duration}
                        onChange={(event) =>
                          updateForm("duration", event.target.value)
                        }
                        placeholder="Minutes"
                        className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter duration in minutes.
                      </p>
                    </div>

                    <div>
                      <label className="text-sm font-semibold text-gray-800">
                        Status
                      </label>
                      <select
                        value={form.status}
                        onChange={(event) =>
                          updateForm(
                            "status",
                            event.target.value as ServiceStatus,
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <label className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={form.isVisible}
                        onChange={(event) =>
                          updateForm("isVisible", event.target.checked)
                        }
                        className="h-4 w-4 rounded border-gray-300 text-blue-600"
                      />

                      <span>
                        <span className="block text-sm font-semibold text-gray-800">
                          Visible on marketplace
                        </span>
                        <span className="block text-xs text-gray-500">
                          Allow customers to see this service.
                        </span>
                      </span>
                    </label>

                    <div className="md:col-span-2">
                      <button
                        type="submit"
                        disabled={saving}
                        className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving
                          ? "Saving..."
                          : editingService
                            ? "Save service changes"
                            : "Create service"}
                      </button>
                    </div>
                  </form>
                </section>
              </>
            )}

            <section className="mt-8">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
                    Your services
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-900">
                    Service catalog
                  </h2>
                </div>

                <span className="text-sm font-medium text-gray-500">
                  {services.length}{" "}
                  {services.length === 1 ? "service" : "services"}
                </span>
              </div>

              <div className="mb-5 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
                <div className="flex min-w-max gap-2">
                  {(
                    [
                      ["all", "All"],
                      ["activated", "Activated"],
                      ["archived", "Archived"],
                      ["visible", "Visible"],
                      ["hidden", "Hidden"],
                      ["deleted", "Bin"],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setServiceFilter(value)}
                      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                        serviceFilter === value
                          ? value === "deleted"
                            ? "bg-red-600 text-white"
                            : "bg-blue-600 text-white"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {label}
                      <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                        {filterCounts[value]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <LoadingState count={3} className="lg:grid-cols-3" />
              ) : filteredServices.length === 0 ? (
                <div className="mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                  <div className="px-6 py-12 text-center sm:px-10">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-3xl font-bold text-blue-600">
                      +
                    </div>

                    <h3 className="mt-5 text-xl font-bold text-gray-900">
                      {emptyState[serviceFilter].title}
                    </h3>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                      {emptyState[serviceFilter].message}
                    </p>

                    {emptyState[serviceFilter].action && (
                      <button
                        type="button"
                        onClick={() => {
                          resetForm();
                          setShowForm(true);
                        }}
                        className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                      >
                        + Add your first service
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredServices.map((service) => {
                    const isWorking = workingId === service._id;

                    return (
                      <article
                        key={service._id}
                        className={`rounded-2xl border bg-white p-5 shadow-sm ${
                          serviceFilter === "deleted"
                            ? "border-red-100 bg-red-50/30"
                            : "border-gray-100"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-600">
                              Service
                            </span>

                            <h3 className="mt-1 text-lg font-bold text-gray-900">
                              {service.name}
                            </h3>
                          </div>

                          <span
                            className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              service.status === "active"
                                ? "bg-green-100 text-green-700"
                                : service.status === "draft"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {service.status}
                          </span>
                        </div>

                        {service.category && (
                          <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
                            {service.category}
                          </p>
                        )}

                        {service.description && (
                          <p className="mt-3 line-clamp-3 text-sm leading-5 text-gray-600">
                            {service.description}
                          </p>
                        )}

                        <div className="mt-5 rounded-xl bg-gray-50 p-4">
                          <p className="text-xs font-medium text-gray-500">
                            Pricing
                          </p>

                          <p className="mt-1 text-lg font-bold text-gray-900">
                            {service.pricingType === "free"
                              ? "Free"
                              : service.price !== undefined
                                ? `${service.currency} ${service.price.toLocaleString()}`
                                : "Contact for price"}
                          </p>

                          {service.duration !== undefined && (
                            <p className="mt-1 text-xs text-gray-500">
                              {service.duration} minutes
                            </p>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {serviceFilter === "deleted" ? (
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => {
                                void (async () => {
                                  setWorkingId(service._id);
                                  setError("");
                                  setSuccess("");

                                  try {
                                    await restoreService(service._id);
                                    setSuccess(
                                      "Service restored successfully.",
                                    );
                                    await loadServices();
                                  } catch (requestError: unknown) {
                                    setError(
                                      (requestError instanceof Error
                                        ? requestError.message
                                        : "") ||
                                        "Unable to restore this service right now.",
                                    );
                                  } finally {
                                    setWorkingId("");
                                  }
                                })();
                              }}
                              className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(`/services/edit/${service._id}`)
                                }
                                className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={isWorking}
                                onClick={() => {
                                  void handleToggleVisibility(service);
                                }}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                {service.isVisible ? "Hide" : "Show"}
                              </button>

                              <button
                                type="button"
                                disabled={isWorking}
                                onClick={() => {
                                  void handleToggleStatus(service);
                                }}
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                              >
                                {service.status === "active" ? "Archive" : "Activate"}
                              </button>

                              <button
                                type="button"
                                disabled={isWorking}
                                onClick={() => {
                                  void handleDelete(service);
                                }}
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </>
                          )}

                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {serviceFilter !== "deleted" &&
                servicePagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setServicePage((page) => Math.max(1, page - 1))
                      }
                      disabled={servicePage === 1 || loading}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>

                    {Array.from(
                      { length: servicePagination.totalPages },
                      (_, index) => index + 1,
                    ).map((page) => (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setServicePage(page)}
                        disabled={loading}
                        className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-semibold transition ${
                          servicePage === page
                            ? "bg-blue-600 text-white"
                            : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setServicePage((page) =>
                          Math.min(
                            servicePagination.totalPages,
                            page + 1,
                          ),
                        )
                      }
                      disabled={
                        servicePage >= servicePagination.totalPages ||
                        loading
                      }
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
            </section>
          </>
        )}
      </Container>
    </main>
  );
}

export default ServiceManagementPage;
