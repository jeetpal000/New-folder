import { useCallback, useEffect, useMemo, useState } from "react";
import { IndianRupee, Plus, Receipt, X } from "lucide-react";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount || 0);

const getLocalDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const Fees = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = (user?.roleId?.role || user?.roleId?.name) === "Admin";
  const canCreateFeeAccount =
    isAdmin || user?.permissions?.includes("fees.account.create");
  const canRecordPayment =
    isAdmin || user?.permissions?.includes("fees.payment.record");
  const canViewStudents =
    isAdmin || user?.permissions?.includes("student.view");
  const [accounts, setAccounts] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [payingAccount, setPayingAccount] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadFees = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [feesResponse, studentsResponse] = await Promise.all([
        api.get("/fees/accounts"),
        canCreateFeeAccount && canViewStudents
          ? api.get("/students")
          : Promise.resolve({ data: { students: [] } }),
      ]);
      setAccounts(feesResponse.data.accounts || []);
      setStudents(studentsResponse.data.students || []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Fee records could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [canCreateFeeAccount, canViewStudents]);

  useEffect(() => {
    document.title = "NexaManage | Fees";
    loadFees();
  }, [loadFees]);

  const outstanding = useMemo(
    () => accounts.reduce((sum, account) => sum + account.dueAmount, 0),
    [accounts],
  );
  const collected = useMemo(
    () => accounts.reduce((sum, account) => sum + account.paidAmount, 0),
    [accounts],
  );

  const submitFee = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await api.post("/fees/accounts", {
        studentId: form.get("studentId"),
        academicSession: form.get("academicSession"),
        totalAmount: Number(form.get("totalAmount")),
        dueDate: form.get("dueDate") || undefined,
      });
      setShowCreate(false);
      await loadFees();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Fee account could not be created.",
      );
    } finally {
      setSaving(false);
    }
  };

  const submitPayment = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await api.post(`/fees/accounts/${payingAccount._id}/payments`, {
        amount: Number(form.get("amount")),
        method: form.get("method"),
        reference: form.get("reference") || undefined,
        paidAt: form.get("paidAt") || undefined,
      });
      setPayingAccount(null);
      await loadFees();
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Payment could not be recorded.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 px-3 py-5 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-(--border) pb-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-(--primary)">
            School administration
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold">
            <Receipt size={22} className="text-(--primary)" />
            Fees handling
          </h1>
          <p className="mt-1 text-sm text-(--text-muted)">
            Set student fees, review balances and record payments.
          </p>
        </div>
        {canCreateFeeAccount && canViewStudents && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-(--primary) px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={17} />
            Set student fee
          </button>
        )}
      </header>

      {canCreateFeeAccount && !canViewStudents && (
        <p className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700">
          Student viewing access is also required to create fee accounts.
        </p>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-red-500/10 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        <FeeSummary label="Collected" value={formatCurrency(collected)} />
        <FeeSummary label="Outstanding" value={formatCurrency(outstanding)} />
        <FeeSummary label="Fee accounts" value={accounts.length} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-(--border) bg-(--glass-bg)">
        <div className="border-b border-(--border) p-5">
          <h2 className="font-bold">Student fee accounts</h2>
          <p className="mt-1 text-sm text-(--text-muted)">
            Current balances and recorded payments for this school.
          </p>
        </div>
        {loading ? (
          <p className="p-8 text-center text-sm text-(--text-muted)">
            Loading fee accounts…
          </p>
        ) : accounts.length ? (
          <div className="divide-y divide-(--border)">
            {accounts.map((account) => {
              const student = account.student;
              const className = student?.classId
                ? `${student.classId.name} · ${student.classId.section}`
                : "Class not assigned";
              return (
                <article
                  key={account._id}
                  className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold">
                      {student?.name || "Student"}
                    </h3>
                    <p className="mt-1 text-sm text-(--text-muted)">
                      {student?.admissionNumber || "No admission number"} · {className} ·{" "}
                      {account.academicSession}
                    </p>
                    <p className="mt-2 text-sm">
                      Total {formatCurrency(account.totalAmount)} · Paid{" "}
                      {formatCurrency(account.paidAmount)} ·{" "}
                      <strong className={account.dueAmount ? "text-amber-600" : "text-emerald-600"}>
                        Due {formatCurrency(account.dueAmount)}
                      </strong>
                    </p>
                    {account.dueDate && (
                      <p className="mt-1 text-xs text-(--text-muted)">
                        Due by {new Date(account.dueDate).toLocaleDateString("en-IN")}
                      </p>
                    )}
                    {account.payments?.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs text-(--text-muted)">
                        {account.payments.slice(-3).reverse().map((payment) => (
                          <li key={payment._id}>
                            {formatCurrency(payment.amount)} · {payment.method} ·{" "}
                            {new Date(payment.paidAt).toLocaleDateString("en-IN")}
                            {payment.receivedBy?.name
                              ? ` · received by ${payment.receivedBy.name}`
                              : ""}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {canRecordPayment && account.dueAmount > 0 && (
                    <button
                      type="button"
                      onClick={() => setPayingAccount(account)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-(--border) px-4 py-2 text-sm font-semibold hover:bg-(--primary-soft-hover)"
                    >
                      <IndianRupee size={16} />
                      Record payment
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="font-semibold">No fee accounts yet</p>
            <p className="mt-1 text-sm text-(--text-muted)">
              Set a fee for a student to start tracking balances and payments.
            </p>
          </div>
        )}
      </section>

      {showCreate && (
        <FeeModal
          title="Set student fee"
          onClose={() => setShowCreate(false)}
          onSubmit={submitFee}
          saving={saving}
          submitLabel="Create fee account"
        >
          <label className="block text-sm font-medium">
            Student
            <select
              name="studentId"
              required
              className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5"
              defaultValue=""
            >
              <option value="" disabled>Select student</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>
                  {student.name} · {student.admissionNumber}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Academic session
            <input
              name="academicSession"
              required
              defaultValue={user?.schoolId?.academicSession || ""}
              className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5"
            />
          </label>
          <label className="block text-sm font-medium">
            Total fee (INR)
            <input
              name="totalAmount"
              type="number"
              min="1"
              step="0.01"
              required
              className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5"
            />
          </label>
          <label className="block text-sm font-medium">
            Due date
            <input
              name="dueDate"
              type="date"
              className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5"
            />
          </label>
        </FeeModal>
      )}

      {payingAccount && (
        <FeeModal
          title={`Record payment · ${payingAccount.student?.name || "Student"}`}
          onClose={() => setPayingAccount(null)}
          onSubmit={submitPayment}
          saving={saving}
          submitLabel="Save payment"
        >
          <p className="rounded-lg bg-(--primary-soft-hover) p-3 text-sm">
            Balance due: <strong>{formatCurrency(payingAccount.dueAmount)}</strong>
          </p>
          <label className="block text-sm font-medium">
            Payment amount (INR)
            <input
              name="amount"
              type="number"
              min="0.01"
              max={payingAccount.dueAmount}
              step="0.01"
              required
              className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5"
            />
          </label>
          <label className="block text-sm font-medium">
            Payment method
            <select
              name="method"
              required
              className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5"
            >
              {["Cash", "UPI", "Bank Transfer", "Card", "Other"].map((method) => (
                <option key={method}>{method}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Transaction reference (optional)
            <input
              name="reference"
              className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5"
            />
          </label>
          <label className="block text-sm font-medium">
            Payment date
            <input
              name="paidAt"
              type="date"
              defaultValue={getLocalDate()}
              className="mt-1.5 w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5"
            />
          </label>
        </FeeModal>
      )}
    </main>
  );
};

const FeeSummary = ({ label, value }) => (
  <article className="rounded-2xl border border-(--border) bg-(--glass-bg) p-5">
    <p className="text-sm text-(--text-muted)">{label}</p>
    <p className="mt-2 text-2xl font-bold">{value}</p>
  </article>
);

const FeeModal = ({ title, onClose, onSubmit, saving, submitLabel, children }) => (
  <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
    <form
      onSubmit={onSubmit}
      className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-(--border) bg-(--surface) p-5 shadow-2xl"
    >
      <header className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 hover:bg-(--primary-soft-hover)"
        >
          <X size={18} />
        </button>
      </header>
      {children}
      <footer className="flex justify-end gap-2 border-t border-(--border) pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-(--border) px-4 py-2 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-(--primary) px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : submitLabel}
        </button>
      </footer>
    </form>
  </div>
);

export default Fees;
