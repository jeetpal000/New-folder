import Class from "../models/Classes.model.js";
import { Teacher } from "../models/Teacher.js";
import { getRoleName } from "./role.js";

export const getClassAccessScope = async (user) => {
  const roleName = getRoleName(user.roleId);
  if (roleName === "Admin") return null;

  const schoolId = user.schoolId?._id || user.schoolId;
  const teacher = await Teacher.findOne({
    schoolId,
    userId: user._id,
    isActive: true,
  })
    .select("_id teachingAssignments.classId")
    .lean();

  if (!teacher) return [];

  const assignmentClassIds = (teacher.teachingAssignments || []).map(
    (assignment) => assignment.classId,
  );
  return Class.distinct("_id", {
    schoolId,
    isActive: true,
    $or: [
      { classTeacherId: teacher._id },
      ...(assignmentClassIds.length
        ? [{ _id: { $in: assignmentClassIds } }]
        : []),
    ],
  });
};

export const getClassTeacherAccessScope = async (user) => {
  const schoolId = user.schoolId?._id || user.schoolId;
  const teacher = await Teacher.findOne({
    schoolId,
    userId: user._id,
    isActive: true,
  })
    .select("_id")
    .lean();

  if (!teacher) return [];

  return Class.distinct("_id", {
    schoolId,
    isActive: true,
    classTeacherId: teacher._id,
  });
};
