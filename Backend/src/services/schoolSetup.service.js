import mongoose from "mongoose";
import argon from "argon2";
import { School } from "../models/School.js";
import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { Permission } from "../models/Permission.js";
import { Subscription } from "../models/Subscription.js";
import PLAN_CONFIG from "../config/PLAN_CONFIG.js";
import AppError from "../utils/AppError.js";

const createSlug = (name, id) => {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "school"}-${id.toString().slice(-8)}`;
};

export const createSchoolSetup = async ({ adminData, organisationData, profileData }) => {
  let school;
  let schoolAdminRole;
  let adminUser;
  let subscription;
  try {
    const email = adminData.email.trim().toLowerCase();
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new AppError("An account with this email already exists", 409);
    }

    const schoolId = new mongoose.Types.ObjectId();
    const schoolCode = `SCH-${schoolId.toString().slice(-8).toUpperCase()}`;
    const schoolPayload = {
      _id: schoolId,
      schoolName: organisationData.name,
      slug: createSlug(organisationData.name, schoolId),
      schoolCode,
      board: profileData.board,
      city: organisationData.address.city,
      address: organisationData.address.street,
      pincode: organisationData.address.pincode,
      schoolEmail: organisationData.contact.email,
      schoolPhone: organisationData.contact.phone,
      state: organisationData.address.state,
      schoolType: profileData.schoolType,
      principalName: profileData.principalName,
      affiliationNumber: profileData.affiliationNumber,
      academicSession: profileData.academicSession,
      establishedYear: profileData.establishedYear,
      facilities: profileData.facilities || [],
    };

    school = await School.create(schoolPayload);
    const permissions = await Permission.find({}, "_id");
    const permissionIds = permissions.map((permission) => permission._id);

    schoolAdminRole = await Role.create({
      schoolId: school._id,
      role: "Admin",
      permission: permissionIds,
    });

    const hashedPassword = await argon.hash(adminData.password);
    adminUser = await User.create({
      schoolId: school._id,
      roleId: schoolAdminRole._id,
      name: adminData.name,
      email,
      phone: adminData.phone,
      password: hashedPassword,
    });

    const freePlan = PLAN_CONFIG.free;
    subscription = await Subscription.create({
      schoolId: school._id,
      plan: freePlan.plan,
      maxStudents: freePlan.maxStudents,
      maxTeachers: freePlan.maxTeachers,
      maxAdmin: freePlan.maxAdmin,
      studentCount: 0,
      teacherCount: 0,
      adminCount: 1,
      startDate: new Date(),
      endDate: new Date(Date.now() + freePlan.durationDays * 24 * 60 * 60 * 1000),
      amount: freePlan.amount,
      paymentStatus: "paid",
      isTrial: true,
    });

    const user = adminUser.toObject();
    delete user.password;
    return {
      success: true,
      school,
      adminUser: user,
      subscription,
    };
  } catch (error) {
    for (const [model, document] of [
      [Subscription, subscription],
      [User, adminUser],
      [Role, schoolAdminRole],
      [School, school],
    ]) {
      if (!document) continue;
      try {
        await model.deleteOne({ _id: document._id });
      } catch (cleanupError) {
        console.error(`Failed to clean up partial school setup (${model.modelName}):`, cleanupError);
      }
    }
    throw error;
  }
};