import argon2 from "argon2";
import { Subject } from "../models/Subject.model.js";
import Class from "../models/Classes.model.js";
import { Role } from "../models/Role.js";
import { Teacher } from "../models/Teacher.js";
import { User } from "../models/User.js";
import AppError from "../utils/AppError.js";
import {
  releasePlanUsage,
  reservePlanUsage,
} from "./subscription.service.js";

export const createTeacherService = async ({
  schoolId,
  name,
  email,
  phone,
  role,
  password,
  employeeId,
  gender,
  dateOfBirth,
  address,
  qualification = [],
  experience = 0,
  joiningDate,
  designation = "Teacher",
  assignments,
}) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedEmployeeId = employeeId.trim();

  const classIds = assignments.map((assignment) => assignment.classId);
  const classRecords = await Class.find({
    _id: { $in: classIds },
    schoolId,
    isActive: true,
  });
  if (classRecords.length !== new Set(classIds.map(String)).size) {
    throw new AppError("One or more assigned classes are invalid", 400);
  }

  const subjectIds = assignments.flatMap((assignment) => assignment.subjectIds);
  const subjects = await Subject.find({
    _id: { $in: subjectIds },
    schoolId,
  });
  const subjectIdsFound = new Set(subjects.map((subject) => String(subject._id)));
  const subjectsBelongToAssignedClasses = assignments.every((assignment) =>
    assignment.subjectIds.every(
      (subjectId) =>
        subjectIdsFound.has(String(subjectId)) &&
        subjects.find((subject) => String(subject._id) === String(subjectId))
          .classIds.some((id) => String(id) === String(assignment.classId)),
    ),
  );
  if (!subjectsBelongToAssignedClasses) {
    throw new AppError("A selected subject does not belong to its assigned class", 400);
  }

  let user;
  let teacher;
  let userRole;
  let usageReservation;
  let adminReservation;
  try {
    const [existingUser, existingTeacher, teacherRole] = await Promise.all([
      User.findOne({ email: normalizedEmail }),
      Teacher.findOne({ schoolId, employeeId: normalizedEmployeeId }),
      Role.findOne({ schoolId, role,}),
    ]);
    if (existingUser) throw new AppError("A user with this email already exists", 409);
    if (existingTeacher) throw new AppError("Employee ID already exists", 409);

    usageReservation = await reservePlanUsage(schoolId, "teacher");
    if (role.toLowerCase() === "admin") {
      adminReservation = await reservePlanUsage(schoolId, "admin");
    }

   userRole = teacherRole;
    if (!userRole) {
    userRole = await Role.create({ schoolId,  role, permission: [] });
   }

    const hashedPassword = await argon2.hash(password);
    user = await User.create({
      schoolId,
      roleId: userRole._id,
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
    });


    teacher = await Teacher.create({
      userId: user._id,
      schoolId,
      employeeId: normalizedEmployeeId,
      gender,
      dateOfBirth,
      address,
      qualification,
      experience,
      joiningDate,
      designation,
      teachingAssignments: assignments,
      classes: classRecords.map((record) => `${record.name} - ${record.section}`),
      subjects: [...new Set(subjects.map((subject) => subject.name))],
    });

    usageReservation = null;
    adminReservation = null;
    return { teacher, user: { id: user._id, name: user.name, email: user.email } };
  } catch (error) {
    let teacherRemains = Boolean(teacher);
    let userRemains = Boolean(user);
    for (const [model, document] of [
      [Teacher, teacher],
      [User, user],
    ]) {
      if (!document) continue;
      try {
        await model.deleteOne({ _id: document._id });
      } catch (cleanupError) {
        if (model === Teacher) teacherRemains = true;
        if (model === User) userRemains = true;
        console.error(`Failed to clean up partial teacher creation (${model.modelName}):`, cleanupError);
      }
    }
    if (usageReservation && !teacherRemains) {
      try {
        await releasePlanUsage(usageReservation);
      } catch (cleanupError) {
        console.error("Could not release failed teacher capacity reservation:", cleanupError);
      }
    }
    if (adminReservation && !userRemains) {
      try {
        await releasePlanUsage(adminReservation);
      } catch (cleanupError) {
        console.error("Could not release failed administrator capacity reservation:", cleanupError);
      }
    }

    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern || {})[0];
      if (duplicateField === "email") {
        throw new AppError("A user with this email already exists", 409);
      }
      if (duplicateField === "employeeId") {
        throw new AppError("Employee ID already exists", 409);
      }
    }
    throw error;
  }
};
