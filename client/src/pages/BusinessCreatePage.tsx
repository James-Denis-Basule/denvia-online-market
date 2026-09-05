import { useState, type FormEvent, type DragEvent } from "react";

import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

import { Link, useNavigate, useSearchParams } from "react-router-dom";

import Container from "../components/layout/Container";

import {
  createBusiness,
  uploadBusinessImage,
} from "../services/businessService";

import { useBusiness } from "../context/BusinessContext";

const countries = getCountries().map((code) => ({
  code: code as CountryCode,
  callingCode: getCountryCallingCode(code),
}));

const categories = [
  "Agriculture",
  "Automotive",
  "Beauty & Personal Care",
  "Clothing & Fashion",
  "Construction",
  "Education",
  "Electronics",
  "Entertainment",
  "Finance",
  "Food & Restaurant",
  "Health & Wellness",
  "Home & Furniture",
  "Hotels & Travel",
  "Professional Services",
  "Real Estate",
  "Retail",
  "Technology",
  "Telecommunications",
  "Transport & Logistics",
  "Other",
];

function BusinessCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const organizationId = searchParams.get("organizationId");

  const { refreshBusinesses } = useBusiness();

  const [country, setCountry] = useState<CountryCode>("UG");

  const [logoPreview, setLogoPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    name: "",
    slogan: "",
    description: "",
    category: "",
    phone: "",
    email: "",
    whatsappNumber: "",
    website: "",
    address: "",
    city: "",
    district: "",
    country: "Uganda",
    logo: "",
    coverImage: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const countryCode = `+${getCountryCallingCode(country)}`;

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;

    if (name === "phone" || name === "whatsappNumber") {
      let digits = value.replace(/[^\d]/g, "");

      if (digits.startsWith("0")) {
        digits = digits.slice(1);
      }

      setForm((current) => ({
        ...current,
        [name]: digits,
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleCountryChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const value = event.target.value as CountryCode;

    setCountry(value);

    const countryName =
      new Intl.DisplayNames(["en"], {
        type: "region",
      }).of(value) ?? value;

    setForm((current) => ({
      ...current,
      country: countryName,
    }));
  }

  function handleFile(file: File, type: "logo" | "coverImage") {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    setError("");

    const preview = URL.createObjectURL(file);

    if (type === "logo") {
      setLogoPreview(preview);
      setLogoFile(file);
    } else {
      setCoverPreview(preview);
      setCoverFile(file);
    }

    setForm((current) => ({
      ...current,
      [type]: preview,
    }));
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>,
    type: "logo" | "coverImage",
  ) {
    event.preventDefault();

    const file = event.dataTransfer.files[0];

    if (file) {
      handleFile(file, type);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = form.name.trim();

    if (!trimmedName) {
      setError("Business name is required.");
      return;
    }

    if (
      form.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      setError("Please enter a valid business email.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const response = await createBusiness({
        organizationId: organizationId || undefined,
        name: form.name.trim(),
        slogan: form.slogan.trim() || undefined,
        description: form.description.trim() || undefined,
        category: form.category || undefined,
        phone: form.phone
          ? `${countryCode} ${form.phone}`
          : undefined,
        email: form.email.trim() || undefined,
        whatsappNumber: form.whatsappNumber
          ? `${countryCode} ${form.whatsappNumber}`
          : undefined,
        website: form.website.trim() || undefined,
        location: {
          country: form.country,
          city: form.city.trim() || undefined,
          district: form.district.trim() || undefined,
          address: form.address.trim() || undefined,
        },
        logo: form.logo.startsWith("http")
          ? form.logo
          : undefined,
        coverImage: form.coverImage.startsWith("http")
          ? form.coverImage
          : undefined,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Unable to create business.",
        );
      }

      const businessId = response.data.business._id;

      if (logoFile) {
        await uploadBusinessImage(
          businessId,
          logoFile,
          "logo",
        );
      }

      if (coverFile) {
        await uploadBusinessImage(
          businessId,
          coverFile,
          "cover",
        );
      }

      await refreshBusinesses();

      if (organizationId) {
        navigate(`/organizations/${organizationId}`, {
          replace: true,
        });
      } else {
        navigate("/businesses/manage", {
          replace: true,
        });
      }
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      const message =
        axiosError.response?.data?.message ||
        (err instanceof Error ? err.message : "") ||
        "Unable to create business right now.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const input =
    "mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

  return (
    <main className="min-h-screen bg-slate-50 py-8 sm:py-10">
      <Container>
        <section className="rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-10 text-white shadow-2xl sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
            DOM business setup
          </p>

          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Create your business
          </h1>

          <p className="mt-3 max-w-2xl text-sm text-blue-100 sm:text-base">
            Build your business profile and show customers your brand.
          </p>

          {organizationId && (
            <div className="mt-5 rounded-xl bg-white/10 px-4 py-3 text-sm text-blue-50">
              This business will be added to your organization.
            </div>
          )}
        </section>

        {submitting ? (
          <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              </div>

              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Creating your business...
              </h2>

              <p className="mt-3 text-sm leading-6 text-gray-500">
                We’re setting up your business profile. Please wait while
                everything is being created.
              </p>

              <div className="mt-6 w-full rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                Please don’t close or refresh this page.
              </div>
            </div>
          </section>
        ) : (
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
              <label className="text-sm font-semibold text-gray-700">
                Business name *
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="e.g. Basule Electronics"
                className={input}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Brand slogan
              </label>

              <input
                name="slogan"
                value={form.slogan}
                onChange={handleChange}
                placeholder="Technology made simple"
                className={input}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Category
              </label>

              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className={input}
              >
                <option value="">Select category</option>

                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Country
              </label>

              <select
                value={country}
                onChange={handleCountryChange}
                className={input}
              >
                {countries.map(({ code, callingCode }) => {
                  const name =
                    new Intl.DisplayNames(["en"], {
                      type: "region",
                    }).of(code) ?? code;

                  return (
                    <option key={code} value={code}>
                      {name} (+{callingCode})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Phone
              </label>

              <div className="mt-2 flex">
                <span className="flex items-center rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 px-4 text-sm font-semibold text-gray-700">
                  {countryCode}
                </span>

                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  inputMode="numeric"
                  placeholder="772123456"
                  className="w-full rounded-r-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Business email
              </label>

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="business@example.com"
                className={input}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                WhatsApp number
              </label>

              <div className="mt-2 flex">
                <span className="flex items-center rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 px-4 text-sm font-semibold text-gray-700">
                  {countryCode}
                </span>

                <input
                  name="whatsappNumber"
                  value={form.whatsappNumber}
                  onChange={handleChange}
                  inputMode="numeric"
                  placeholder="Leave blank to use phone number"
                  className="w-full rounded-r-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                />
              </div>

              <p className="mt-1.5 text-xs text-gray-500">
                Customers can message you here directly from your storefront.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                Website
              </label>

              <input
                name="website"
                type="url"
                value={form.website}
                onChange={handleChange}
                placeholder="https://yourbusiness.com"
                className={input}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                District
              </label>

              <input
                name="district"
                value={form.district}
                onChange={handleChange}
                placeholder="Kampala"
                className={input}
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">
                City
              </label>

              <input
                name="city"
                value={form.city}
                onChange={handleChange}
                placeholder="Kampala"
                className={input}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="text-sm font-semibold text-gray-700">
                Address
              </label>

              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="Street, building or area"
                className={input}
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="text-sm font-semibold text-gray-700">
              Business description
            </label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={5}
              placeholder="Tell customers what your business offers..."
              className={`${input} resize-y`}
            />
          </div>

          <div className="mt-8 border-t border-gray-100 pt-8">
            <h2 className="text-lg font-bold text-gray-900">
              Brand images
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Upload, drag and drop, or use an image URL.
            </p>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              {(
                [
                  ["logo", "Logo", logoPreview],
                  ["coverImage", "Cover image", coverPreview],
                ] as const
              ).map(([type, title, preview]) => (
                <div key={type}>
                  <label className="text-sm font-semibold text-gray-700">
                    {title}
                  </label>

                  <div
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event, type)}
                    className="mt-2 rounded-2xl border-2 border-dashed border-gray-300 p-5 text-center transition hover:border-blue-400 hover:bg-blue-50/30"
                  >
                    {preview && (
                      <img
                        src={preview}
                        alt={title}
                        className="mx-auto mb-4 h-32 w-full rounded-xl object-cover"
                      />
                    )}

                    <p className="text-sm font-semibold text-gray-700">
                      Drag & drop an image here
                    </p>

                    <p className="my-2 text-xs text-gray-500">
                      or
                    </p>

                    <label className="inline-block cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700">
                      Choose from device

                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file =
                            event.target.files?.[0];

                          if (file) {
                            handleFile(file, type);
                          }
                        }}
                      />
                    </label>

                    <input
                      value={
                        form[type].startsWith("blob:")
                          ? ""
                          : form[type]
                      }
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          [type]: event.target.value,
                        }))
                      }
                      placeholder="Or paste image URL"
                      className={input}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
            <Link
              to="/businesses"
              className="rounded-xl border border-gray-200 px-5 py-3 text-center text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting
                ? "Creating business..."
                : "Create business"}
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-gray-400">
            You can add business hours and social media links after
            creating your business from the edit page.
          </p>
        </form>
        )}
      </Container>
    </main>
  );
}

export default BusinessCreatePage;