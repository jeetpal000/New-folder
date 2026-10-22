import mongoose from "mongoose";
import { Teacher } from "../models/Teacher.js";
import Class from "../models/Classes.model.js";
import { createTeacherService } from "../services/teacher.service.js";
import { getClassAccessScope } from "../utils/classAccess.js";
import { getRoleName } from "../utils/role.js";

export const createTeacherController = async (req, res, next) => {
  try {
    const { name, email, phone, password, employeeId, assignments, role } = req.body;
    const requestedRole = typeof role === "string" ? role.trim() : "";
    if (
      requestedRole.toLowerCase() === "admin" &&
      getRoleName(req.user.roleId) !== "Admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Only a school administrator can create another administrator",
      });
    }
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof phone !== "string" ||
      !phone.trim() ||
      !requestedRole ||
      typeof password !== "string" ||
      password.length < 8 ||
      typeof employeeId !== "string" ||
      !employeeId.trim() ||
      !Array.isArray(assignments) ||
      assignments.length === 0 ||
      assignments.some(
        (assignment) =>
          !assignment ||
          !mongoose.isValidObjectId(assignment.classId) ||
          !Array.isArray(assignment.subjectIds) ||
          assignment.subjectIds.length === 0 ||
          assignment.subjectIds.some((id) => !mongoose.isValidObjectId(id)),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Teacher details, a password of at least 8 characters, and one class with subjects are required",
      });
    }

    const classAccessScope = await getClassAccessScope(req.user);
    if (
      classAccessScope !== null &&
      assignments.some(
        (assignment) =>
          !classAccessScope.some(
            (classId) => String(classId) === String(assignment.classId),
          ),
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to one or more assigned classes",
      });
    }

    const result = await createTeacherService({
      ...req.body,
      role: requestedRole,
      schoolId: req.user.schoolId._id,
    });
    return res.status(201).json({
      success: true,
      message: "Teacher created successfully",
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const getTeachersController = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId._id;
    const classAccessScope = await getClassAccessScope(req.user);
    const filter = { schoolId };
    if (classAccessScope !== null) {
      const accessibleClasses = await Class.find({
        _id: { $in: classAccessScope },
        schoolId,
      })
        .select("classTeacherId")
        .lean();
      const classTeacherIds = accessibleClasses.flatMap(
        (schoolClass) => schoolClass.classTeacherId || [],
      );
      filter.$or = [
        { "teachingAssignments.classId": { $in: classAccessScope } },
        { _id: { $in: classTeacherIds } },
      ];
    }

    const teachers = await Teacher.find(filter)
      .populate("userId", "name email phone")
      .populate({
        path: "teachingAssignments.classId",
        select: "name section course",
      })
      .populate({
        path: "teachingAssignments.subjectIds",
        select: "name",
      })
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, teachers });
  } catch (error) {
    return next(error);
  }
};
