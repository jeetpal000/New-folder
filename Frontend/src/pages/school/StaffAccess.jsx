import { useCallback, useEffect, useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { api } from "../../services/api";

const StaffAccess = () => {
  const [staff, setStaff] = useState([]);
  const [permissionOptions, setPermissionOptions] = useState([]);
  const [permissionsByUser, setPermissionsByUser] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [savingUserId, setSavingUserId] = useState("");
  const [savedUserId, setSavedUserId] = useState("");

  const loadStaffPermissions = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const response = await api.get("/admin/staff-permissions");
      const users = response.data.staff || [];
      setStaff(users);
      setPermissionOptions(response.data.permissions || []);
      setPermissionsByUser(
        Object.fromEntries(
          users.map((member) => [member.id, member.permissions || []]),
        ),
      );
    } catch (error) {
      setLoadError(
        error.response?.data?.message ||
          "Staff permissions could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "NexaManage | Staff access";
    loadStaffPermissions();
  }, [loadStaffPermissions]);

  const togglePermission = (userId, permissionKey, checked) => {
    setPermissionsByUser((current) => {
      const selected = new Set(current[userId] || []);
      if (checked) selected.add(permissionKey);
      else selected.delete(permissionKey);
      return { ...current, [userId]: [...selected] };
    });
    setSavedUserId("");
    setSaveError("");
  };

  const savePermissions = async (userId) => {
    setSavingUserId(userId);
    setSavedUserId("");
    setSaveError("");
    try {
      await api.put(`/admin/staff-permissions/${userId}`, {
        permissions: permissionsByUser[userId] || [],
      });
      setSavedUserId(userId);
    } catch (error) {
      setSaveError(
        error.response?.data?.message ||
          "Permissions could not be saved. Please try again.",
      );
    } finally {
      setSavingUserId("");
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 px-3 py-5 sm:px-6">
      <header className="flex items-start gap-3">
        <span className="grid size-12 place-items-center rounded-2xl bg-(--primary-soft)">
          <ShieldCheck size={23} className="text-(--primary)" />
        </span>
        <div>
          <h1 className="text-2xl font-bold">Staff access</h1>
          <p className="mt-1 text-sm text-(--text-muted)">
            Choose which areas each staff member can view and which actions
            they can perform, including adding students or teachers and marking
            attendance. Dashboard and personal Settings remain available to all
            staff.
          </p>
        </div>
      </header>

      {loadError && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {loadError}
          <button
            type="button"
            className="font-semibold underline"
            onClick={loadStaffPermissions}
          >
            Retry
          </button>
        </div>
      )}

      {saveError && (
        <p
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          {saveError}
        </p>
      )}

      {loading ? (
        <div className="rounded-2xl border border-(--border) p-8 text-center text-(--text-muted)">
          Loading staff accounts…
        </div>
      ) : staff.length ? (
        <section className="space-y-4">
          {staff.map((member) => (
            <article
              key={member.id}
              className="rounded-2xl border border-(--border) bg-(--glass-bg) p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{member.name}</h2>
                  <p className="mt-1 text-sm text-(--text-muted)">
                    {member.email} · {member.role}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {savedUserId === member.id && (
                    <span className="text-sm font-medium text-(--success)">
                      Saved
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={savingUserId === member.id}
                    onClick={() => savePermissions(member.id)}
                    className="inline-flex items-center gap-2 rounded-lg bg-(--primary) px-4 py-2 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60"
                  >
                    <Save size={16} />
                    {savingUserId === member.id ? "Saving…" : "Save access"}
                  </button>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {permissionOptions.map((option) => (
                  <label
                    key={option.key}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-(--border) p-3 text-sm hover:bg-(--primary-soft-hover)"
                  >
                    <input
                      type="checkbox"
                      checked={(permissionsByUser[member.id] || []).includes(
                        option.key,
                      )}
                      onChange={(event) =>
                        togglePermission(
                          member.id,
                          option.key,
                          event.target.checked,
                        )
                      }
                      className="size-4 accent-(--primary)"
                    />
                    {option.name}
                  </label>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="rounded-2xl border border-(--border) bg-(--glass-bg) p-8 text-center">
          <h2 className="font-semibold">No staff accounts yet</h2>
          <p className="mt-1 text-sm text-(--text-muted)">
            Staff accounts will appear here when they have been added to this
            school.
          </p>
        </div>
      )}
    </main>
  );
};

export default StaffAccess;
