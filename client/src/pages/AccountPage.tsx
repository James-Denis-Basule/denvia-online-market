import { useEffect, useState } from "react";
import { useContext } from "react";

import Container from "../components/layout/Container";
import Card from "../components/ui/Card";
import { AuthContext } from "../context/AuthContext";
import {
  getCurrentUser,
  updateNotificationPreferences,
} from "../services/authService";

type Preferences = { sms: boolean; whatsapp: boolean; email: boolean };

function AccountPage() {
  const auth = useContext(AuthContext);
  const [preferences, setPreferences] = useState<Preferences>({
    sms: true,
    whatsapp: true,
    email: true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        const prefs = res?.data?.user?.notificationPreferences;
        if (prefs) {
          setPreferences({
            sms: prefs.sms,
            whatsapp: prefs.whatsapp,
            email: prefs.email,
          });
        }
      })
      .catch(() => {});
  }, []);

  async function handleToggle(key: keyof Preferences) {
    const next = { ...preferences, [key]: !preferences[key] };
    setPreferences(next);
    setSaving(true);
    setSaved(false);

    try {
      await updateNotificationPreferences(next);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  const user = auth?.user;

  return (
    <main className="py-12">
      <Container>
        <div className="mx-auto max-w-2xl space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Account
            </p>
            <h1 className="text-3xl font-bold text-gray-900">
              Account settings
            </h1>
          </div>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p>
                <span className="text-gray-500">Name: </span>
                {user?.firstName} {user?.lastName}
              </p>
              <p>
                <span className="text-gray-500">Email: </span>
                {user?.email}
              </p>
              {user?.phone && (
                <p>
                  <span className="text-gray-500">Phone: </span>
                  {user.phone}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-gray-900">
              Notification preferences
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose how you'd like to receive order and account updates.
              In-app notifications can't be turned off since they carry
              important order information.
            </p>

            <div className="mt-5 space-y-3">
              {(
                [
                  ["sms", "SMS"],
                  ["whatsapp", "WhatsApp"],
                  ["email", "Email"],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                >
                  <span className="text-sm font-medium text-gray-800">
                    {label}
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences[key]}
                    onChange={() => handleToggle(key)}
                    disabled={saving}
                    className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500"
                  />
                </label>
              ))}

              <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 opacity-70">
                <span className="text-sm font-medium text-gray-600">
                  In-app (always on)
                </span>
                <input type="checkbox" checked disabled className="h-5 w-5" />
              </div>
            </div>

            {saved && (
              <p className="mt-3 text-sm font-medium text-green-600">
                Preferences saved.
              </p>
            )}
          </Card>
        </div>
      </Container>
    </main>
  );
}

export default AccountPage;
