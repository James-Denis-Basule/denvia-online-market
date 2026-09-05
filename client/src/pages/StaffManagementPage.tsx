import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

import Container from "../components/layout/Container";
import Card from "../components/ui/Card";
import {
  listStaff,
  inviteStaff,
  removeStaff,
  updateStaffNotifications,
  type StaffMember,
} from "../services/businessStaffService";

function StaffManagementPage() {
  const { businessId } = useParams<{ businessId: string }>();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"manager" | "staff">("staff");
  const [error, setError] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (!businessId) return;
    void load();
  }, [businessId]);

  async function load() {
    if (!businessId) return;
    setLoading(true);
    try {
      const result = await listStaff(businessId);
      setStaff(result);
    } catch {
      setError("Could not load staff.");
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!businessId || !email.trim()) return;

    setInviting(true);
    setError("");

    try {
      await inviteStaff(businessId, email.trim(), role);
      setEmail("");
      await load();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(
        axiosError.response?.data?.message || "Could not invite staff member.",
      );
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(membershipId: string) {
    if (!businessId) return;
    if (!window.confirm("Remove this staff member?")) return;

    await removeStaff(businessId, membershipId);
    await load();
  }

  async function handleToggleNotifications(member: StaffMember) {
    if (!businessId) return;

    await updateStaffNotifications(
      businessId,
      member._id,
      !member.canReceiveOrderNotifications,
    );
    await load();
  }

  return (
    <main className="py-12">
      <Container>
        <div className="mb-6">
          <Link
            to="/businesses/manage"
            className="text-sm font-semibold text-blue-600"
          >
            ← Back to businesses
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Staff</h1>
          <p className="mt-1 text-sm text-gray-500">
            Invite staff to help manage this business, and control who receives
            order/feedback notifications.
          </p>
        </div>

        <Card className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Invite staff</h2>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Staff member's email"
              type="email"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "manager" | "staff")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
            </select>
            <button
              type="button"
              onClick={handleInvite}
              disabled={inviting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {inviting ? "Inviting..." : "Invite"}
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <p className="mt-2 text-xs text-gray-400">
            The person must already have a DOM account with this email.
          </p>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-gray-900">Team</h2>

          {loading && <p className="mt-4 text-sm text-gray-500">Loading...</p>}

          {!loading && staff.length === 0 && (
            <p className="mt-4 text-sm text-gray-500">No staff yet.</p>
          )}

          <div className="mt-4 divide-y divide-gray-100">
            {staff.map((member) => {
              const user =
                typeof member.userId === "object" ? member.userId : null;

              return (
                <div
                  key={member._id}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {user ? `${user.firstName} ${user.lastName}` : "Unknown"}
                    </p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="mt-1 text-xs">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold uppercase text-gray-600">
                        {member.role}
                      </span>{" "}
                      <span className="text-gray-400">· {member.status}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-gray-600">
                      <input
                        type="checkbox"
                        checked={member.canReceiveOrderNotifications}
                        onChange={() => void handleToggleNotifications(member)}
                        className="h-4 w-4 rounded text-blue-600 focus:ring-blue-500"
                      />
                      Notifications
                    </label>

                    <button
                      type="button"
                      onClick={() => void handleRemove(member._id)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </Container>
    </main>
  );
}

export default StaffManagementPage;
