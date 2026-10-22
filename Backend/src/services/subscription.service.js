import { Subscription } from "../models/Subscription.js";
import Student from "../models/Student.js";
import { Teacher } from "../models/Teacher.js";
import { User } from "../models/User.js";
import { Role } from "../models/Role.js";
import AppError from "../utils/AppError.js";
import { isWithinSubscriptionLimit } from "../utils/subscriptionRules.js";

export const getActiveUsageCount = async (schoolId, kind) => {
  if (kind === "student") {
    return Student.countDocuments({ schoolId, isActive: true });
  }
  if (kind === "teacher") {
    return Teacher.countDocuments({ schoolId, isActive: true });
  }
  if (kind === "admin") {
    const roles = await Role.find({ schoolId }).select("_id role name").lean();
    const adminRoleIds = roles
      .filter((role) => (role.role || role.name) === "Admin")
      .map((role) => role._id);
    return User.countDocuments({
      schoolId,
      isActive: true,
      roleId: { $in: adminRoleIds },
    });
  }
  throw new AppError("Unsupported subscription usage type", 500);
};

export const getActiveSubscription = (schoolId, at = new Date()) =>
  Subscription.findOne({
    schoolId,
    status: "active",
    paymentStatus: "paid",
    startDate: { $lte: at },
    endDate: { $gt: at },
  })
    .sort({ startDate: -1, createdAt: -1 })
    .lean();

export const requireActiveSubscription = async (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }
  try {
    const subscription = await getActiveSubscription(req.user.schoolId._id);
    if (!subscription) {
      return res.status(402).json({
        success: false,
        code: "SUBSCRIPTION_INACTIVE",
        message: "This school plan has expired. An administrator must renew it.",
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
};

export const reservePlanUsage = async (schoolId, kind) => {
  const usageFields = {
    student: ["studentCount", "maxStudents"],
    teacher: ["teacherCount", "maxTeachers"],
    admin: ["adminCount", "maxAdmin"],
  };
  const [countField, limitField] = usageFields[kind] || [];
  if (!countField) {
    throw new AppError("Unsupported subscription usage type", 500);
  }
  const now = new Date();
  const subscription = await getActiveSubscription(schoolId, now);
  if (!subscription) {
    throw new AppError(
      "This school plan has expired. An administrator must renew it.",
      402,
    );
  }

  if (
    !Number.isInteger(subscription[countField]) ||
    !Number.isInteger(subscription[limitField])
  ) {
    throw new AppError(
      "Subscription usage needs to be initialized before creating records. Contact your administrator.",
      503,
    );
  }

  const [activeCount, futureSubscription] = await Promise.all([
    getActiveUsageCount(schoolId, kind),
    Subscription.findOne({
      schoolId,
      $or: [
        {
          status: "pending",
          paymentStatus: "pending",
          createdAt: { $gt: new Date(now.getTime() - 30 * 60 * 1000) },
        },
        {
          status: "active",
          paymentStatus: "paid",
          startDate: { $gt: now },
          endDate: { $gt: now },
        },
      ],
    })
      .sort({ createdAt: 1 })
      .lean(),
  ]);
  const actualCount = Math.max(subscription[countField], activeCount);
  await Subscription.updateOne(
    { _id: subscription._id },
    { $max: { [countField]: activeCount } },
  );
  const futureLimit = futureSubscription?.[limitField];
  const limit =
    Number.isInteger(futureLimit) &&
    futureLimit !== -1 &&
    (subscription[limitField] === -1 || futureLimit < subscription[limitField])
      ? futureLimit
      : subscription[limitField];
  const filter = {
    _id: subscription._id,
    status: "active",
    paymentStatus: "paid",
    startDate: { $lte: now },
    endDate: { $gt: now },
    [countField]: limit === -1 ? { $gte: 0 } : { $lt: limit },
  };
  const result = await Subscription.updateOne(filter, {
    $inc: { [countField]: 1 },
  });
  if (result.modifiedCount === 1) {
    return { subscriptionId: subscription._id, countField };
  }

  if (!isWithinSubscriptionLimit(actualCount, limit)) {
    throw new AppError(
      `This school has reached its plan limit of ${limit} ${kind}s. Upgrade the plan to add more.`,
      403,
    );
  }
  throw new AppError(
    "The school subscription changed while processing this request. Try again.",
    409,
  );
};

export const releasePlanUsage = async (reservation) => {
  if (!reservation) return;
  const result = await Subscription.updateOne(
    {
      _id: reservation.subscriptionId,
      [reservation.countField]: { $gt: 0 },
    },
    { $inc: { [reservation.countField]: -1 } },
  );
  if (result.modifiedCount !== 1) {
    throw new Error("Could not release the reserved subscription capacity");
  }
};

export const releaseActivePlanUsage = async (schoolId, kind) => {
  const countField = {
    student: "studentCount",
    teacher: "teacherCount",
    admin: "adminCount",
  }[kind];
  if (!countField) {
    throw new AppError("Unsupported subscription usage type", 500);
  }
  const subscription = await getActiveSubscription(schoolId);
  if (!subscription) {
    throw new AppError("The active school subscription was not found", 402);
  }
  const result = await Subscription.updateOne(
    { _id: subscription._id, [countField]: { $gt: 0 } },
    { $inc: { [countField]: -1 } },
  );
  if (result.modifiedCount !== 1) {
    throw new AppError(
      "Subscription usage is not initialized or is out of sync",
      503,
    );
  }
};
