import mongoose from "mongoose";
import { connectDatabase } from "../src/config/db.js";
import Student from "../src/models/Student.js";
import { Subscription } from "../src/models/Subscription.js";
import { Teacher } from "../src/models/Teacher.js";
import { Role } from "../src/models/Role.js";
import { User } from "../src/models/User.js";
import PLAN_CONFIG from "../src/config/PLAN_CONFIG.js";

const run = async () => {
  await connectDatabase();
  const schoolIds = await Subscription.distinct("schoolId");
  for (const schoolId of schoolIds) {
    const adminRoles = await Role.find({ schoolId })
      .select("_id role name")
      .lean();
    const adminRoleIds = adminRoles
      .filter((role) => (role.role || role.name) === "Admin")
      .map((role) => role._id);
    const [studentCount, teacherCount, adminCount] = await Promise.all([
      Student.countDocuments({ schoolId, isActive: true }),
      Teacher.countDocuments({ schoolId, isActive: true }),
      User.countDocuments({
        schoolId,
        isActive: true,
        roleId: { $in: adminRoleIds },
      }),
    ]);
    const subscriptions = await Subscription.find({ schoolId })
      .select("_id plan")
      .lean();
    await Promise.all(
      subscriptions.map((subscription) =>
        Subscription.updateOne(
          { _id: subscription._id },
          {
            $set: {
              studentCount,
              teacherCount,
              adminCount,
              maxAdmin:
                PLAN_CONFIG[subscription.plan]?.maxAdmin ??
                PLAN_CONFIG.free.maxAdmin,
            },
          },
        ),
      ),
    );
  }
  console.log(`Initialized subscription usage for ${schoolIds.length} schools`);
};

run()
  .catch((error) => {
    console.error("Subscription usage migration failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
