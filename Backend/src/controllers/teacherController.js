import mongoose from "mongoose";
import { Teacher } from "../models/Teacher.js";
import Class from "../models/Classes.model.js";
import { createTeacherService } from "../services/teacher.service.js";
import { getClassAccessScope } from "../utils/classAccess.js";
import { getRoleName } from "../utils/role.js";
import { Subject } from "../models/Subject.model.js";
import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { TeacherPayout } from "../models/TeacherPayout.js";
import AppError from "../utils/AppError.js";
import {
  destroyStudentPhoto,
  uploadStudentPhoto,
} from "../services/studentPhoto.service.js";

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

const getTeacherForSchool = async (teacherId, schoolId) => {
  if (!mongoose.isValidObjectId(teacherId)) {
    throw new AppError("A valid teacher is required", 400);
  }
  const teacher = await Teacher.findOne({ _id: teacherId, schoolId })
    .populate({
      path: "userId",
      select: "name email phone roleId",
      populate: { path: "roleId", select: "role name" },
    })
    .populate("schoolId", "schoolName logo address")
    .populate({
      path: "teachingAssignments.classId",
      select: "name section course",
    })
    .populate({
      path: "teachingAssignments.subjectIds",
      select: "name",
    });
  if (!teacher) throw new AppError("Teacher not found", 404);
  return teacher;
};

export const getTeacherDetailsController = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId._id;
    const teacher = await getTeacherForSchool(req.params.id, schoolId);
    const classAccessScope = await getClassAccessScope(req.user);
    if (
      classAccessScope !== null &&
      !teacher.teachingAssignments.some((assignment) =>
        classAccessScope.some(
          (classId) => String(classId) === String(assignment.classId?._id),
        ),
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this teacher",
      });
    }
    const [payouts, roles] = await Promise.all([
      TeacherPayout.find({ schoolId, teacherId: teacher._id })
        .sort({ period: -1, createdAt: -1 })
        .lean(),
      Role.find({ schoolId }).select("role name").sort({ role: 1 }).lean(),
    ]);
    return res.status(200).json({
      success: true,
      teacher,
      payouts,
      roles: roles.map((role) => role.role || role.name).filter(Boolean),
    });
  } catch (error) {
    return next(error);
  }
};

export const updateTeacherController = async (req, res, next) => {
  let uploadedPhoto;
  let photoPersisted = false;
  try {
    const schoolId = req.user.schoolId._id;
    const teacher = await getTeacherForSchool(req.params.id, schoolId);
    const classAccessScope = await getClassAccessScope(req.user);
    let assignments = req.body.assignments;
    if (typeof assignments === "string") {
      try {
        assignments = JSON.parse(assignments);
      } catch {
        return res.status(400).json({
          success: false,
          message: "Teacher assignments must be valid JSON",
        });
      }
    }
    if (!Array.isArray(assignments)) {
      return res.status(400).json({
        success: false,
        message: "Teacher class and subject assignments are required",
      });
    }
    if (
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
        message: "Each assigned class must include at least one valid subject",
      });
    }
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
    const classIds = assignments.map((assignment) => assignment.classId);
    if (new Set(classIds.map(String)).size !== classIds.length) {
      return res.status(400).json({
        success: false,
        message: "A class can only be assigned once",
      });
    }
    const [classes, subjects] = await Promise.all([
      classIds.length
        ? Class.find({ _id: { $in: classIds }, schoolId, isActive: true })
        : [],
      assignments.length
        ? Subject.find({
            _id: { $in: assignments.flatMap((assignment) => assignment.subjectIds) },
            schoolId,
          })
        : [],
    ]);
    if (classes.length !== classIds.length) {
      return res.status(400).json({
        success: false,
        message: "One or more assigned classes are unavailable",
      });
    }
    const subjectsById = new Map(
      subjects.map((subject) => [String(subject._id), subject]),
    );
    if (
      assignments.some((assignment) =>
        assignment.subjectIds.some(
          (subjectId) =>
            !subjectsById
              .get(String(subjectId))
              ?.classIds.some(
                (classId) => String(classId) === String(assignment.classId),
              ),
        ),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "A selected subject does not belong to its assigned class",
      });
    }

    const {
      name,
      email,
      phone,
      employeeId,
      dateOfBirth,
      gender,
      designation,
      joiningDate,
      experience,
      qualification,
      address,
      isActive,
      role,
    } = req.body;
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof phone !== "string" ||
      !phone.trim() ||
      typeof employeeId !== "string" ||
      !employeeId.trim() ||
      typeof designation !== "string" ||
      !designation.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, email, phone, employee ID, and designation are required",
      });
    }
    const parsedExperience = Number(experience || 0);
    if (!Number.isFinite(parsedExperience) || parsedExperience < 0) {
      return res.status(400).json({
        success: false,
        message: "Experience must be a non-negative number",
      });
    }
    const parsedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
    const parsedJoiningDate = joiningDate ? new Date(joiningDate) : undefined;
    if (
      (parsedDateOfBirth && Number.isNaN(parsedDateOfBirth.getTime())) ||
      (parsedJoiningDate && Number.isNaN(parsedJoiningDate.getTime()))
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter valid date values",
      });
    }
    if (gender && !["MALE", "FEMALE", "OTHER"].includes(gender)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid gender",
      });
    }
    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: teacher.userId._id },
    }).select("_id");
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }
    const duplicateEmployee = await Teacher.findOne({
      schoolId,
      employeeId: employeeId.trim(),
      _id: { $ne: teacher._id },
    }).select("_id");
    if (duplicateEmployee) {
      return res.status(409).json({
        success: false,
        message: "Employee ID already exists",
      });
    }

    let roleRecord = teacher.userId.roleId;
    if (typeof role === "string" && role.trim()) {
      const isAdmin = getRoleName(req.user.roleId) === "Admin";
      if (!isAdmin && role.trim().toLowerCase() === "admin") {
        return res.status(403).json({
          success: false,
          message: "Only a school administrator can promote a teacher to administrator",
        });
      }
      roleRecord = await Role.findOne({
        schoolId,
        $or: [{ role: role.trim() }, { name: role.trim() }],
      });
      if (!roleRecord) {
        return res.status(400).json({
          success: false,
          message: "Select a role available in this school",
        });
      }
    }
    const rawIsActive = req.body.isActive;
    if (
      rawIsActive !== undefined &&
      ![true, false, "true", "false"].includes(rawIsActive)
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a valid teacher status",
      });
    }
    if (req.file) {
      uploadedPhoto = await uploadStudentPhoto(req.file, schoolId, "teachers");
    }

    await User.updateOne(
      { _id: teacher.userId._id, schoolId },
      {
        $set: {
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          roleId: roleRecord._id,
        },
      },
    );
    const updatedFields = {
      employeeId: employeeId.trim(),
      dateOfBirth: parsedDateOfBirth,
      gender: gender || undefined,
      designation: designation.trim(),
      joiningDate: parsedJoiningDate,
      experience: parsedExperience,
      qualification: Array.isArray(qualification)
        ? qualification
        : typeof qualification === "string"
          ? qualification.split(",").map((item) => item.trim()).filter(Boolean)
          : [],
      address:
        typeof address === "string" ? { street: address.trim() } : address,
      isActive: rawIsActive === undefined
        ? teacher.isActive
        : rawIsActive === true || rawIsActive === "true",
      teachingAssignments: assignments,
      classes: classes.map((record) => `${record.name} - ${record.section}`),
      subjects: [
        ...new Set(
          assignments.flatMap((assignment) =>
            assignment.subjectIds.map(
              (subjectId) => subjectsById.get(String(subjectId)).name,
            ),
          ),
        ),
      ],
    };
    if (uploadedPhoto) {
      updatedFields.profileImage = uploadedPhoto.url;
      updatedFields.profileImagePublicId = uploadedPhoto.publicId;
    }
    await Teacher.updateOne({ _id: teacher._id, schoolId }, { $set: updatedFields });
    photoPersisted = Boolean(uploadedPhoto);
    if (uploadedPhoto && teacher.profileImagePublicId) {
      await destroyStudentPhoto(teacher.profileImagePublicId);
    }
    const updatedTeacher = await getTeacherForSchool(teacher._id, schoolId);
    return res.status(200).json({
      success: true,
      message: "Teacher details updated successfully",
      teacher: updatedTeacher,
    });
  } catch (error) {
    if (uploadedPhoto && !photoPersisted) {
      try {
        await destroyStudentPhoto(uploadedPhoto.publicId);
      } catch (cleanupError) {
        console.error("Could not delete an unlinked teacher photo:", cleanupError);
      }
    }
    return next(error);
  }
};

export const createTeacherPayoutController = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId._id;
    const teacher = await getTeacherForSchool(req.params.id, schoolId);
    const { period, amount, note } = req.body;
    const parsedAmount = Number(amount);
    if (
      typeof period !== "string" ||
      !/^\d{4}-(0[1-9]|1[0-2])$/.test(period) ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid payout month and an amount greater than zero",
      });
    }
    const payout = await TeacherPayout.create({
      teacherId: teacher._id,
      schoolId,
      period,
      amount: parsedAmount,
      note: typeof note === "string" ? note.trim() : "",
      recordedBy: req.user._id,
    });
    return res.status(201).json({
      success: true,
      message: "Payout recorded as pending",
      payout,
    });
  } catch (error) {
    return next(error);
  }
};

export const updateTeacherPayoutController = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId._id;
    const teacher = await getTeacherForSchool(req.params.id, schoolId);
    if (!mongoose.isValidObjectId(req.params.payoutId)) {
      return res.status(400).json({
        success: false,
        message: "A valid payout is required",
      });
    }
    if (!["Pending", "Paid"].includes(req.body.status)) {
      return res.status(400).json({
        success: false,
        message: "Payout status must be Pending or Paid",
      });
    }
    const payoutUpdate = {
      $set: { status: req.body.status },
    };
    if (req.body.status === "Paid") {
      payoutUpdate.$set.paidAt = new Date();
    } else {
      payoutUpdate.$unset = { paidAt: 1 };
    }
    const payout = await TeacherPayout.findOneAndUpdate(
      {
        _id: req.params.payoutId,
        teacherId: teacher._id,
        schoolId,
      },
      payoutUpdate,
      { new: true, runValidators: true },
    );
    if (!payout) throw new AppError("Payout not found", 404);
    return res.status(200).json({
      success: true,
      message: "Payout status updated",
      payout,
    });
  } catch (error) {
    return next(error);
  }
};
