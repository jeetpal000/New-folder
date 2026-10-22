import Razorpay from "razorpay";
import PLAN_CONFIG from "../config/PLAN_CONFIG.js";
import { Subscription } from "../models/Subscription.js";
import Student from "../models/Student.js";
import { Teacher } from "../models/Teacher.js";
import { User } from "../models/User.js";
import { Role } from "../models/Role.js";
import AppError from "../utils/AppError.js";
import {
  getActiveSubscription,
  getActiveUsageCount,
} from "./subscription.service.js";
import { verifyRazorpaySignature } from "../utils/razorpaySignatures.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new AppError("Razorpay is not configured on this server", 503);
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const activatePaidSubscription = async ({
  orderId,
  paymentId,
  amount,
  currency,
}) => {
  const subscription = await Subscription.findOne({
    orderId,
    status: "pending",
    paymentStatus: "pending",
  });
  if (!subscription) {
    const completed = await Subscription.findOne({
      orderId,
      paymentStatus: "paid",
    });
    if (completed?.paymentId === paymentId) return completed;
    if (completed) {
      throw new AppError("This order has already been paid", 409);
    }
    throw new AppError("Pending school subscription was not found", 404);
  }

  if (
    amount !== Math.round(subscription.amount * 100) ||
    currency !== "INR"
  ) {
    throw new AppError("Payment amount does not match the selected plan", 400);
  }

  const now = new Date();
  const current = await getActiveSubscription(subscription.schoolId, now);
  const startDate =
    current && !current.isTrial && current.endDate > now
      ? new Date(current.endDate)
      : now;
  const endDate = new Date(
    startDate.getTime() + PLAN_CONFIG[subscription.plan].durationDays * DAY_MS,
  );
  const adminRoles = await Role.find({ schoolId: subscription.schoolId })
    .select("_id role name")
    .lean();
  const adminRoleIds = adminRoles
    .filter((role) => (role.role || role.name) === "Admin")
    .map((role) => role._id);
  const [studentCount, teacherCount, adminCount] = await Promise.all([
    Student.countDocuments({ schoolId: subscription.schoolId, isActive: true }),
    Teacher.countDocuments({ schoolId: subscription.schoolId, isActive: true }),
    User.countDocuments({
      schoolId: subscription.schoolId,
      isActive: true,
      roleId: { $in: adminRoleIds },
    }),
  ]);

  const activated = await Subscription.findOneAndUpdate(
    {
      _id: subscription._id,
      orderId,
      status: "pending",
      paymentStatus: "pending",
    },
    {
      $set: {
        status: "active",
        paymentStatus: "paid",
        paymentId,
        startDate,
        endDate,
        studentCount,
        teacherCount,
        adminCount,
        isTrial: false,
      },
    },
    { new: true, runValidators: true },
  );
  if (activated) return activated;

  const completed = await Subscription.findOne({
    orderId,
    paymentStatus: "paid",
  });
  if (completed?.paymentId === paymentId) return completed;
  if (completed) {
    throw new AppError("This order has already been paid", 409);
  }
  throw new AppError("Subscription payment is being processed. Try again.", 409);
};

export const getSchoolBilling = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId._id;
    const now = new Date();
    await Subscription.updateMany(
      {
        schoolId,
        status: "active",
        endDate: { $lte: now },
      },
      { $set: { status: "expired" } },
    );
    const [activeSubscription, latestSubscription, upcomingSubscription, pendingOrder] =
      await Promise.all([
      getActiveSubscription(schoolId, now),
      Subscription.findOne({ schoolId }).sort({ createdAt: -1 }).lean(),
      Subscription.findOne({
        schoolId,
        status: "active",
        paymentStatus: "paid",
        startDate: { $gt: now },
      })
        .sort({ startDate: 1 })
        .lean(),
      Subscription.findOne({
        schoolId,
        status: "pending",
        paymentStatus: "pending",
      })
        .select("plan amount orderId createdAt")
        .lean(),
    ]);
    return res.status(200).json({
      success: true,
      subscription: activeSubscription || latestSubscription,
      active: Boolean(activeSubscription),
      upcomingSubscription,
      pendingOrder,
      plans: Object.values(PLAN_CONFIG).map((plan) => ({
        plan: plan.plan,
        amount: plan.amount,
        maxStudents: plan.maxStudents,
        maxTeachers: plan.maxTeachers,
        maxAdmin: plan.maxAdmin,
        durationDays: plan.durationDays,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

export const createSubscriptionOrder = async (req, res, next) => {
  let subscription;
  try {
    const planName = req.body.plan;
    const plan = PLAN_CONFIG[planName];
    if (!plan || planName === "free") {
      return res.status(400).json({
        success: false,
        message: "Choose a valid paid school plan",
      });
    }

    const schoolId = req.user.schoolId._id;
    const now = new Date();
    const [studentCount, teacherCount, adminCount] = await Promise.all([
      getActiveUsageCount(schoolId, "student"),
      getActiveUsageCount(schoolId, "teacher"),
      getActiveUsageCount(schoolId, "admin"),
    ]);
    if (
      (plan.maxStudents !== -1 && studentCount > plan.maxStudents) ||
      (plan.maxTeachers !== -1 && teacherCount > plan.maxTeachers) ||
      (plan.maxAdmin !== -1 && adminCount > plan.maxAdmin)
    ) {
      return res.status(409).json({
        success: false,
        message: "This plan cannot hold the school's current active usage. Reduce usage or choose a larger plan.",
      });
    }
    await Subscription.updateMany(
      {
        schoolId,
        status: "pending",
        orderId: { $exists: false },
        createdAt: { $lte: new Date(now.getTime() - 30 * 60 * 1000) },
      },
      { $set: { status: "cancelled", paymentStatus: "failed" } },
    );
    const pendingOrder = await Subscription.findOne({
      schoolId,
      status: "pending",
      paymentStatus: "pending",
    }).select("_id orderId plan");
    if (pendingOrder) {
      if (pendingOrder.plan !== planName) {
        return res.status(409).json({
          success: false,
          message: `A ${pendingOrder.plan} plan payment is already in progress. Complete it before choosing another plan.`,
        });
      }
      if (!pendingOrder.orderId) {
        return res.status(409).json({
          success: false,
          message: "A school plan payment is being prepared. Try again shortly.",
        });
      }
      const order = await getRazorpayClient().orders.fetch(pendingOrder.orderId);
      return res.status(200).json({
        success: true,
        order: { id: order.id, amount: order.amount, currency: order.currency },
        keyId: process.env.RAZORPAY_KEY_ID,
        plan: pendingOrder.plan,
      });
    }

    const queuedPlan = await Subscription.findOne({
      schoolId,
      status: "active",
      paymentStatus: "paid",
      startDate: { $gt: now },
      endDate: { $gt: now },
    }).select("_id");
    if (queuedPlan) {
      return res.status(409).json({
        success: false,
        message: "A renewed plan is already scheduled for this school",
      });
    }

    const razorpay = getRazorpayClient();
    subscription = await Subscription.create({
      schoolId,
      plan: plan.plan,
      maxStudents: plan.maxStudents,
      maxTeachers: plan.maxTeachers,
      maxAdmin: plan.maxAdmin,
      studentCount: 0,
      teacherCount: 0,
      amount: plan.amount,
      status: "pending",
      paymentStatus: "pending",
      paymentProvider: "razorpay",
      isTrial: false,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(plan.amount * 100),
      currency: "INR",
      receipt: `school-${String(schoolId).slice(-8)}-${String(subscription._id).slice(-8)}`,
      notes: {
        schoolId: String(schoolId),
        subscriptionId: String(subscription._id),
        plan: plan.plan,
      },
    });
    subscription.orderId = order.id;
    await subscription.save();

    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: plan.plan,
    });
  } catch (error) {
    if (subscription) {
      try {
        await Subscription.updateOne(
          { _id: subscription._id, status: "pending" },
          { $set: { status: "cancelled", paymentStatus: "failed" } },
        );
      } catch (cleanupError) {
        console.error(
          `Could not cancel failed Razorpay order record ${subscription._id}:`,
          cleanupError,
        );
      }
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A school plan payment is already in progress",
      });
    }
    if (error.statusCode) {
      return next(error);
    }
    console.error("Razorpay order creation failed:", error.message);
    return next(new AppError("Could not create a Razorpay order", 502));
  }
};

export const verifySubscriptionPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = req.body;
    if (
      typeof orderId !== "string" ||
      typeof paymentId !== "string" ||
      typeof signature !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are incomplete",
      });
    }
    const subscription = await Subscription.findOne({
      schoolId: req.user.schoolId._id,
      orderId,
    });
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found for this school",
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      throw new AppError("Razorpay is not configured on this server", 503);
    }
    if (
      !verifyRazorpaySignature(
        process.env.RAZORPAY_KEY_SECRET,
        `${orderId}|${paymentId}`,
        signature,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature is invalid",
      });
    }

    const razorpay = getRazorpayClient();
    const payment = await razorpay.payments.fetch(paymentId);
    if (
      payment.order_id !== orderId ||
      payment.status !== "captured"
    ) {
      return res.status(409).json({
        success: false,
        message: "Payment has not been captured for this order",
      });
    }
    const activated = await activatePaidSubscription({
      orderId,
      paymentId,
      amount: payment.amount,
      currency: payment.currency,
    });
    return res.status(200).json({
      success: true,
      message: "School subscription activated successfully",
      subscription: activated,
    });
  } catch (error) {
    return next(error);
  }
};

export const handleRazorpayWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.get("x-razorpay-signature");
    if (!webhookSecret) {
      throw new AppError("Razorpay webhook is not configured on this server", 503);
    }
    if (!req.rawBody || !signature) {
      return res.status(400).json({
        success: false,
        message: "Razorpay webhook configuration or signature is missing",
      });
    }
    if (
      !verifyRazorpaySignature(
        webhookSecret,
        req.rawBody,
        signature,
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Razorpay webhook signature is invalid",
      });
    }

    const event = req.body?.event;
    if (event !== "payment.captured") {
      return res.status(200).json({ success: true, ignored: true });
    }
    const payment = req.body?.payload?.payment?.entity;
    if (
      !payment?.order_id ||
      !payment?.id ||
      payment.status !== "captured"
    ) {
      return res.status(400).json({
        success: false,
        message: "Captured payment data is incomplete",
      });
    }
    await activatePaidSubscription({
      orderId: payment.order_id,
      paymentId: payment.id,
      amount: payment.amount,
      currency: payment.currency,
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    return next(error);
  }
};
