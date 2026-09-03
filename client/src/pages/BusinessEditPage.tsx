import { useEffect, useState, type DragEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";

import Container from "../components/layout/Container";
import LoadingState from "../components/ui/LoadingState";
import { useBusiness } from "../context/BusinessContext";
import {
  updateBusiness,
  uploadBusinessImage,
} from "../services/businessService";

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

function BusinessEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { businesses, isLoading, refreshBusinesses } = useBusiness();

  const business = businesses.find((item) => item._id === id);

  const [country, setCountry] = useState<CountryCode>("UG");
  const [logoPreview, setLogoPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    slogan: "",
    description: "",
    category: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    district: "",
    country: "Uganda",
    logo: "",
    coverImage: "",
  });

  useEffect(() => {
    if (!business) return;

    const phone = business.phone ?? "";
    const countryName = business.country ?? "Uganda";

    const matchedCountry =
      countries.find((item) => {
        const name =
          new Intl.DisplayNames(["en"], {
            type: "region",
          }).of(item.code) ?? item.code;

        return name.toLowerCase() === countryName.toLowerCase();
      })?.code ?? "UG";

    setCountry(matchedCountry);

    setForm({
      name: business.name ?? "",
      slogan: String(business.slogan ?? ""),
      description: business.description ?? "",
      category: business.category ?? "",
      phone: phone.replace(/^\+\d+\s*/, "").replace(/^0/, ""),
      email: business.email ?? "",
      address: business.address ?? "",
      city: business.city ?? "",
      district: String(business.district ?? ""),
      country: countryName,
      logo: business.logo ?? "",
      coverImage: business.coverImage ?? "",
    });

    setLogoPreview(business.logo ?? "");
    setCoverPreview(business.coverImage ?? "");
  }, [business]);

  function handleChange(
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) {
    const { name, value } = event.target;

    if (name === "phone") {
      let phone = value.replace(/[^\d]/g, "");

      if (phone.startsWith("0")) {
        phone = phone.slice(1);
      }

      setForm((current) => ({
        ...current,
        phone,
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

    if (!id || !business) {
      setError("Business could not be found.");
      return;
    }

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

      const response = await updateBusiness(id, {
        name: trimmedName,
        slogan: form.slogan.trim() || undefined,
        description: form.description.trim() || undefined,
        category: form.category || undefined,
        phone: form.phone
          ? `+${getCountryCallingCode(country)} ${form.phone}`
          : undefined,
        email: form.email.trim() || undefined,
        location: {
          country: form.country,
          city: form.city.trim() || undefined,
          address: form.address.trim() || undefined,
        },
        logo:
          !logoFile && form.logo.startsWith("http")
            ? form.logo
            : undefined,
        coverImage:
          !coverFile && form.coverImage.startsWith("http")
            ? form.coverImage
            : undefined,
      });

      if (!response.success) {
        throw new Error(
          response.message || "Unable to update business.",
        );
      }

      if (logoFile) {
        await uploadBusinessImage(id, logoFile, "logo");
      }

      if (coverFile) {
        await uploadBusinessImage(id, coverFile, "cover");
      }

      await refreshBusinesses();

      navigate("/businesses/manage", {
        replace: true,
      });
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
        "Unable to update business right now.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  const input =
    "mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-50";

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 py-8 sm:py-10">
        <Container>
          <LoadingState count={1} />
        </Container>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-slate-50 py-8 sm:py-10">
        <Container>
          <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">
              Business not found
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              The business you are trying to edit could not be found.
            </p>
            <Link
              to="/businesses/manage"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Back to businesses
            </Link>
          </section>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 sm:py-10">
      <Container>
        <section className="rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 px-6 py-10 text-white shadow-2xl sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
            Business management
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Edit your business
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100 sm:text-base">
            Update your business information, contact details, location,
            logo, and cover image.
          </p>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}

        {submitting ? (
          <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-gray-900">
                Saving changes...
              </h2>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                We’re updating your business profile. Please wait while
                your changes are being saved.
              </p>
              <div className="mt-6 w-full rounded-xl bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
                Please don’t close or refresh this page.
              </div>
            </div>
          </section>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-8"
          >
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-gray-900">
                Basic information
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Business name *
                  </span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    className={input}
                    placeholder="e.g. James Electronics"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Slogan
                  </span>
                  <input
                    name="slogan"
                    value={form.slogan}
                    onChange={handleChange}
                    className={input}
                    placeholder="Your business slogan"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Description
                  </span>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows={5}
                    className={input}
                    placeholder="Tell customers about your business"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-gray-700">
                    Category
                  </span>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={input}
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-gray-900">
                Contact information
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-semibold text-gray-700">
                    Phone
                  </span>
                  <div className="mt-2 flex">
                    <select
                      value={country}
                      onChange={handleCountryChange}
                      className="w-28 rounded-l-xl border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-700 outline-none focus:border-blue-500"
                    >
                      {countries.map((item) => (
                        <option key={item.code} value={item.code}>
                          +{item.callingCode} ({item.code})
                        </option>
                      ))}
                    </select>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handleChange}
                      className="w-full rounded-r-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      placeholder="700123456"
                    />
                  </div>
                </label>

                <label>
                  <span className="text-sm font-semibold text-gray-700">
                    Email
                  </span>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className={input}
                    placeholder="business@example.com"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-gray-900">
                Location
              </h2>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-semibold text-gray-700">
                    Country
                  </span>
                  <select
                    value={country}
                    onChange={handleCountryChange}
                    className={input}
                  >
                    {countries.map((item) => {
                      const name =
                        new Intl.DisplayNames(["en"], {
                          type: "region",
                        }).of(item.code) ?? item.code;

                      return (
                        <option key={item.code} value={item.code}>
                          {name}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label>
                  <span className="text-sm font-semibold text-gray-700">
                    City
                  </span>
                  <input
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className={input}
                    placeholder="Kampala"
                  />
                </label>

                <label>
                  <span className="text-sm font-semibold text-gray-700">
                    District
                  </span>
                  <input
                    name="district"
                    value={form.district}
                    onChange={handleChange}
                    className={input}
                    placeholder="Kampala"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Address
                  </span>
                  <input
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    className={input}
                    placeholder="Street, building, landmark"
                  />
                </label>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-gray-900">
                Business images
              </h2>

              <div className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Logo
                  </p>

                  <div
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event, "logo")}
                    className="mt-2 rounded-2xl border-2 border-dashed border-gray-300 p-5 text-center"
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Business logo preview"
                        className="mx-auto h-32 w-32 rounded-2xl object-cover shadow-sm"
                      />
                    ) : (
                      <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-2xl bg-blue-50 text-sm font-bold text-blue-600">
                        No logo
                      </div>
                    )}

                    <p className="mt-3 text-xs text-gray-500">
                      Drag & drop an image here or choose an option below
                    </p>

                    <div className="mt-4 flex flex-col gap-2">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                        Upload logo
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) handleFile(file, "logo");
                          }}
                        />
                      </label>

                      <input
                        type="url"
                        value={form.logo.startsWith("blob:") ? "" : form.logo}
                        onChange={(event) => {
                          const value = event.target.value;
                          setForm((current) => ({
                            ...current,
                            logo: value,
                          }));
                          setLogoPreview(value);
                          setLogoFile(null);
                        }}
                        className={input}
                        placeholder="Or paste logo image URL"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-700">
                    Cover image
                  </p>

                  <div
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event, "coverImage")}
                    className="mt-2 rounded-2xl border-2 border-dashed border-gray-300 p-5 text-center"
                  >
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Business cover preview"
                        className="h-32 w-full rounded-xl object-cover shadow-sm"
                      />
                    ) : (
                      <div className="flex h-32 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600">
                        No cover image
                      </div>
                    )}

                    <p className="mt-3 text-xs text-gray-500">
                      Drag & drop an image here or choose an option below
                    </p>

                    <div className="mt-4 flex flex-col gap-2">
                      <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
                        Upload cover
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) handleFile(file, "coverImage");
                          }}
                        />
                      </label>

                      <input
                        type="url"
                        value={
                          form.coverImage.startsWith("blob:")
                            ? ""
                            : form.coverImage
                        }
                        onChange={(event) => {
                          const value = event.target.value;
                          setForm((current) => ({
                            ...current,
                            coverImage: value,
                          }));
                          setCoverPreview(value);
                          setCoverFile(null);
                        }}
                        className={input}
                        placeholder="Or paste cover image URL"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                to="/businesses/manage"
                className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-center text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save changes
              </button>
            </div>
          </form>
        )}
      </Container>
    </main>
  );
}

export default BusinessEditPage;
