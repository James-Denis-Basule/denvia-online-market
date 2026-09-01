import { Link } from "react-router-dom";
import type { Business } from "../../services/businessService";

interface BusinessManagementCardProps {
  business: Business;
  isActive: boolean;
  isWorking?: boolean;
  onSelect?: (businessId: string) => void;
  onDelete?: (businessId: string, businessName: string) => void;
  showDelete?: boolean;
}

function BusinessManagementCard({
  business,
  isActive,
  isWorking = false,
  onSelect,
  onDelete,
  showDelete = true,
}: BusinessManagementCardProps) {
  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        isActive
          ? "border-blue-300 ring-2 ring-blue-100"
          : "border-gray-100"
      }`}
    >
      <div className="h-28 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600">
        {business.coverImage && (
          <img
            src={business.coverImage}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="p-5">
        <div className="-mt-10 flex items-end justify-between">
          {business.logo ? (
            <img
              src={business.logo}
              alt={business.name}
              className="h-16 w-16 rounded-2xl border-4 border-white bg-white object-cover shadow-md"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-blue-50 text-xl font-bold text-blue-600 shadow-md">
              {business.name.charAt(0).toUpperCase()}
            </div>
          )}

          {isActive && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              Active
            </span>
          )}
        </div>

        <h3 className="mt-4 truncate text-lg font-bold text-gray-900">
          {business.name}
        </h3>

        {business.category && (
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-blue-600">
            {business.category}
          </p>
        )}

        {business.description && (
          <p className="mt-3 line-clamp-2 text-sm leading-5 text-gray-600">
            {business.description}
          </p>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          {!isActive && onSelect && (
            <button
              type="button"
              disabled={isWorking}
              onClick={() => onSelect(business._id)}
              className="rounded-xl bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isWorking ? "Switching..." : "Make active"}
            </button>
          )}

          <Link
            to="/dashboard"
            className={`rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-center text-sm font-semibold text-blue-700 transition hover:bg-blue-100 ${
              isActive ? "col-span-2" : ""
            }`}
          >
            Open dashboard
          </Link>
        </div>

        {showDelete && onDelete && (
          <button
            type="button"
            disabled={isWorking}
            onClick={() => onDelete(business._id, business.name)}
            className="mt-3 w-full rounded-xl px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete business
          </button>
        )}
      </div>
    </article>
  );
}

export default BusinessManagementCard;