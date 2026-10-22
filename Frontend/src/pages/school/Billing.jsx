import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, CreditCard } from "lucide-react";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

const currency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not available";

let checkoutScriptPromise;
const loadCheckoutScript = () => {
  if (window.Razorpay) return Promise.resolve();
  if (checkoutScriptPromise) return checkoutScriptPromise;

  checkoutScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      checkoutScriptPromise = null;
      reject(new Error("Razorpay checkout could not be loaded."));
    };
    document.body.appendChild(script);
  });
  return checkoutScriptPromise;
};

const Billing = () => {
  const user = useAuthStore((state) => state.user);
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/billing");
      setBilling(response.data);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Subscription information could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "NexaManage | Subscription & billing";
    loadBilling();
  }, [loadBilling]);

  const startCheckout = async (plan) => {
    setBusyPlan(plan.plan);
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/billing/orders", { plan: plan.plan });
      await loadCheckoutScript();
      const checkout = new window.Razorpay({
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: billing?.subscription?.schoolId?.schoolName || "NexaManage",
        description: `${data.plan} school subscription`,
        order_id: data.order.id,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: "#2563eb" },
        handler: async (payment) => {
          try {
            const verified = await api.post("/billing/verify", payment);
            setMessage(verified.data.message);
            await loadBilling();
          } catch (verificationError) {
            setError(
              verificationError.response?.data?.message ||
                "Payment could not be verified. If your account was charged, contact support.",
            );
          } finally {
            setBusyPlan("");
          }
        },
        modal: {
          ondismiss: () => setBusyPlan(""),
        },
      });
      checkout.on("payment.failed", (event) => {
        setError(
          event.error?.description ||
            "Payment failed. You can retry from this page.",
        );
        setBusyPlan("");
      });
      checkout.open();
    } catch (checkoutError) {
      setError(
        checkoutError.response?.data?.message ||
          checkoutError.message ||
          "Could not start checkout.",
      );
      setBusyPlan("");
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-80 place-items-center text-(--text-secondary)">
        Loading subscription…
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest text-(--primary)">
          School workspace
        </p>
        <h1 className="mt-1 text-3xl font-bold">Subscription & billing</h1>
        <p className="mt-2 text-sm text-(--text-secondary)">
          Manage your school plan and securely pay through Razorpay.
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl bg-red-500/10 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="rounded-xl bg-green-500/10 p-4 text-sm text-green-800">
          {message}
        </p>
      )}

      {billing?.subscription && (
        <article className="rounded-2xl border border-(--border) bg-(--surface) p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-(--text-secondary)">
                {billing.active ? "Active school plan" : "Latest plan"}
              </p>
              <h2 className="mt-1 text-xl font-bold capitalize">
                {billing.subscription.plan} · {currency(billing.subscription.amount || 0)}
              </h2>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                billing.active
                  ? "bg-green-500/10 text-green-700"
                  : "bg-amber-500/10 text-amber-800"
              }`}
            >
              {billing.active ? "Active" : billing.subscription.status}
            </span>
          </div>
          <p className="mt-3 text-sm text-(--text-secondary)">
            {billing.active ? "Renews or expires" : "Plan end date"}:{" "}
            {formatDate(billing.subscription.endDate)}
          </p>
        </article>
      )}

      {billing?.upcomingSubscription && (
        <article className="rounded-2xl border border-blue-300 bg-blue-500/5 p-5">
          <h2 className="font-bold capitalize">
            Upcoming plan: {billing.upcomingSubscription.plan}
          </h2>
          <p className="mt-1 text-sm text-(--text-secondary)">
            Starts {formatDate(billing.upcomingSubscription.startDate)} after
            your current paid plan ends.
          </p>
        </article>
      )}

      {billing?.pendingOrder && (
        <article className="rounded-2xl border border-amber-300 bg-amber-500/5 p-5">
          <h2 className="font-bold capitalize">
            Payment in progress: {billing.pendingOrder.plan}
          </h2>
          <p className="mt-1 text-sm text-(--text-secondary)">
            Complete the same checkout to continue; a different plan cannot be
            ordered while this payment is pending.
          </p>
        </article>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {billing?.plans?.map((plan) => {
          const isCurrent = billing.active && billing.subscription?.plan === plan.plan;
          return (
            <article
              key={plan.plan}
              className="flex flex-col rounded-2xl border border-(--border) bg-(--surface) p-5"
            >
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-(--primary)" />
                <h2 className="text-lg font-bold capitalize">{plan.plan}</h2>
                {isCurrent && (
                  <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-green-700">
                    <CheckCircle2 size={15} /> Current
                  </span>
                )}
              </div>
              <p className="mt-4 text-3xl font-extrabold">
                {plan.amount === 0 ? "Free" : currency(plan.amount)}
                {plan.amount > 0 && (
                  <span className="ml-1 text-sm font-normal text-(--text-muted)">
                    / year
                  </span>
                )}
              </p>
              <ul className="mt-5 flex-1 space-y-2 text-sm text-(--text-secondary)">
                <li>
                  {plan.maxStudents === -1 ? "Unlimited" : plan.maxStudents} students
                </li>
                <li>
                  {plan.maxTeachers === -1 ? "Unlimited" : plan.maxTeachers} teachers
                </li>
                <li>
                  {plan.maxAdmin === -1 ? "Unlimited" : plan.maxAdmin} administrators
                </li>
                <li>{plan.durationDays} days</li>
              </ul>
              {plan.amount > 0 ? (
                <button
                  type="button"
                  disabled={Boolean(busyPlan)}
                  onClick={() => startCheckout(plan)}
                  className="mt-6 rounded-lg bg-(--primary) px-4 py-2.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busyPlan === plan.plan ? "Opening secure checkout…" : "Choose plan"}
                </button>
              ) : (
                <p className="mt-6 rounded-lg border border-(--border) px-4 py-2.5 text-center text-sm text-(--text-muted)">
                  Included with registration
                </p>
              )}
            </article>
          );
        })}
      </div>

      <p className="text-xs leading-5 text-(--text-muted)">
        Paid plan changes start after the current paid subscription ends.
        Razorpay payment verification is required before plan access changes.
      </p>
    </section>
  );
};

export default Billing;
