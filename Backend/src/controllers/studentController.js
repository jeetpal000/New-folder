import mongoose from "mongoose";
import Student from "../models/Student.js";
import Class from "../models/Classes.model.js";
import Attendance from "../models/Attendance.js";
import FeeAccount from "../models/FeeAccount.js";
import StudentLeaveRequest from "../models/StudentLeaveRequest.js";
import AdmissionApplication from "../models/AdmissionApplication.js";
import { Subject } from "../models/Subject.model.js";
import { getClassAccessScope } from "../utils/classAccess.js";
import AppError from "../utils/AppError.js";
import {
  destroyStudentPhoto,
  uploadStudentPhoto,
} from "../services/studentPhoto.service.js";
import {
  releaseActivePlanUsage,
  releasePlanUsage,
  reservePlanUsage,
} from "../services/subscription.service.js";

export const getStudents = async (req, res, next) => {
  try {
    const classAccessScope = await getClassAccessScope(req.user);
    const filter = {
      schoolId: req.user.schoolId._id,
    };
    if (classAccessScope !== null) {
      filter.classId = { $in: classAccessScope };
    }
    if (req.query.classId) {
      if (!mongoose.isValidObjectId(req.query.classId)) {
        return res.status(400).json({
          success: false,
          message: "A valid class is required",
        });
      }
      if (
        classAccessScope !== null &&
        !classAccessScope.some((id) => String(id) === String(req.query.classId))
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this class",
        });
      }
      filter.classId = req.query.classId;
    }

    const students = await Student.find(filter)
      .populate("classId", "name section course")
      .sort({ name: 1 })
      .lean();
    return res.status(200).json({ success: true, students });
  } catch (error) {
    return next(error);
  }
};

export const createStudent = async (req, res, next) => {
  let usageReservation;
  let studentCreated = false;
  let uploadedPhoto;
  try {
    const {
      name,
      classId,
      admissionNumber,
      rollNumber,
      dateOfBirth,
      gender,
      phone,
      email,
      guardianName,
      guardianPhone,
      address,
    } = req.body;
    if (
      !name?.trim() ||
      !admissionNumber?.trim() ||
      !mongoose.isValidObjectId(classId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Student name, admission number, and a valid class are required",
      });
    }

    const schoolId = req.user.schoolId._id;
    const classAccessScope = await getClassAccessScope(req.user);
    if (
      classAccessScope !== null &&
      !classAccessScope.some((id) => String(id) === String(classId))
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this class",
      });
    }
    const schoolClass = await Class.findOne({
      _id: classId,
      schoolId,
      isActive: true,
    }).select("_id");
    if (!schoolClass) {
      return res.status(400).json({
        success: false,
        message: "The selected class is not available in this school",
      });
    }

    usageReservation = await reservePlanUsage(schoolId, "student");
    if (req.file) {
      uploadedPhoto = await uploadStudentPhoto(req.file, schoolId);
    }
    const student = await Student.create({
      schoolId,
      classId,
      name: name.trim(),
      admissionNumber: admissionNumber.trim(),
      rollNumber: rollNumber?.trim() || undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || undefined,
      phone: phone?.trim() || undefined,
      email: email?.trim().toLowerCase() || undefined,
      guardianName: guardianName?.trim() || undefined,
      guardianPhone: guardianPhone?.trim() || undefined,
      address: address?.trim() || undefined,
      photo: uploadedPhoto,
    });
    studentCreated = true;
    await student.populate("classId", "name section course");

    return res.status(201).json({
      success: true,
      message: "Student created successfully",
      student,
    });
  } catch (error) {
    if (uploadedPhoto && !studentCreated) {
      try {
        await destroyStudentPhoto(uploadedPhoto.publicId);
      } catch (cleanupError) {
        console.error("Could not delete an unlinked student photo:", cleanupError);
      }
    }
    if (usageReservation && !studentCreated) {
      try {
        await releasePlanUsage(usageReservation);
      } catch (cleanupError) {
        console.error("Could not release failed student capacity reservation:", cleanupError);
      }
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "That admission number is already in use in this school",
      });
    }
    return next(error);
  }
};

export const updateStudent = async (req, res, next) => {
  let activationReservation;
  let usageWarning;
  let uploadedPhoto;
  let photoPersisted = false;
  try {
    const { id } = req.params;
    const {
      name,
      classId,
      admissionNumber,
      rollNumber,
      dateOfBirth,
      gender,
      phone,
      email,
      guardianName,
      guardianPhone,
      address,
    } = req.body;
    const rawIsActive = req.body.isActive;
    const isActive = rawIsActive === true || rawIsActive === "true";
    const isActiveValid =
      typeof rawIsActive === "boolean" ||
      rawIsActive === "true" ||
      rawIsActive === "false";
    const removePhoto = req.body.removePhoto === true || req.body.removePhoto === "true";

    if (
      !mongoose.isValidObjectId(id) ||
      !mongoose.isValidObjectId(classId) ||
      typeof name !== "string" ||
      !name.trim() ||
      typeof admissionNumber !== "string" ||
      !admissionNumber.trim() ||
      !isActiveValid
    ) {
      return res.status(400).json({
        success: false,
        message: "Student name, admission number, status, and a valid class are required",
      });
    }

    if (
      gender != null &&
      gender !== "" &&
      !["Male", "Female", "Other"].includes(gender)
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a valid gender",
      });
    }

    let parsedDateOfBirth;
    if (dateOfBirth) {
      parsedDateOfBirth = new Date(dateOfBirth);
      if (Number.isNaN(parsedDateOfBirth.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid date of birth",
        });
      }
    }

    const schoolId = req.user.schoolId._id;
    const existingStudent = await Student.findOne({ _id: id, schoolId })
      .select("classId isActive photo")
      .lean();
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found in this school",
      });
    }

    const classAccessScope = await getClassAccessScope(req.user);
    if (
      classAccessScope !== null &&
      !classAccessScope.some(
        (classObjectId) => String(classObjectId) === String(existingStudent.classId),
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this student",
      });
    }
    if (
      classAccessScope !== null &&
      !classAccessScope.some((classObjectId) => String(classObjectId) === String(classId))
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this class",
      });
    }

    const schoolClass = await Class.findOne({
      _id: classId,
      schoolId,
      isActive: true,
    }).select("_id");
    if (!schoolClass) {
      return res.status(400).json({
        success: false,
        message: "The selected class is not available in this school",
      });
    }

    if (!existingStudent.isActive && isActive) {
      activationReservation = await reservePlanUsage(schoolId, "student");
    }
    if (req.file) {
      uploadedPhoto = await uploadStudentPhoto(req.file, schoolId);
    }
    const photoUpdate = req.file
      ? uploadedPhoto
      : removePhoto
        ? null
        : undefined;
    const student = await Student.findOneAndUpdate(
      { _id: id, schoolId, classId: existingStudent.classId },
      {
        $set: {
          name: name.trim(),
          classId: schoolClass._id,
          admissionNumber: admissionNumber.trim(),
          rollNumber: typeof rollNumber === "string" ? rollNumber.trim() : "",
          dateOfBirth: parsedDateOfBirth || null,
          gender: gender || null,
          phone: typeof phone === "string" ? phone.trim() : "",
          email: typeof email === "string" ? email.trim().toLowerCase() : "",
          guardianName:
            typeof guardianName === "string" ? guardianName.trim() : "",
          guardianPhone:
            typeof guardianPhone === "string" ? guardianPhone.trim() : "",
          address: typeof address === "string" ? address.trim() : "",
          isActive,
          ...(photoUpdate !== undefined ? { photo: photoUpdate } : {}),
        },
      },
      { new: true, runValidators: true },
    );

    if (!student) {
      if (uploadedPhoto) {
        await destroyStudentPhoto(uploadedPhoto.publicId);
        uploadedPhoto = null;
      }
      if (activationReservation) {
        await releasePlanUsage(activationReservation);
        activationReservation = null;
      }
      return res.status(404).json({
        success: false,
        message: "Student not found in this school",
      });
    }
    photoPersisted = Boolean(uploadedPhoto);
    activationReservation = null;
    await student.populate("classId", "name section course");

    if (existingStudent.isActive && !isActive) {
      try {
        await releaseActivePlanUsage(schoolId, "student");
      } catch (usageError) {
        console.error("Could not release deactivated student plan usage:", usageError);
        usageWarning =
          "Student status changed, but plan usage could not be synchronized. Run the subscription usage migration.";
      }
    }
    const previousPublicId = existingStudent.photo?.publicId;
    if (previousPublicId && photoUpdate !== undefined) {
      await destroyStudentPhoto(previousPublicId);
    }
    return res.status(200).json({
      success: true,
      message: "Student updated successfully",
      student,
      warning: usageWarning,
    });
  } catch (error) {
    if (uploadedPhoto && !photoPersisted) {
      try {
        await destroyStudentPhoto(uploadedPhoto.publicId);
      } catch (cleanupError) {
        console.error("Could not delete an unlinked student photo:", cleanupError);
      }
    }
    if (activationReservation) {
      try {
        await releasePlanUsage(activationReservation);
      } catch (cleanupError) {
        console.error("Could not release failed student activation reservation:", cleanupError);
      }
    }
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "That admission number is already in use in this school",
      });
    }
    return next(error);
  }
};

export const studentAllDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "A valid student is required",
      });
    }

    const schoolId = req.user.schoolId._id;
    const student = await Student.findOne({ _id: id, schoolId })
      .populate("classId", "name section course")
      .lean();
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found in this school",
      });
    }

    const classAccessScope = await getClassAccessScope(req.user);
    if (
      classAccessScope !== null &&
      !classAccessScope.some(
        (classId) => String(classId) === String(student.classId?._id),
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this class",
      });
    }

    const [attendanceRecords, feeAccounts, leaveRequests, admissionApplications, subjects] =
      await Promise.all([
        Attendance.find({ schoolId, studentId: student._id })
          .sort({ date: -1 })
          .lean(),
        FeeAccount.find({ schoolId, studentId: student._id })
          .populate("payments.receivedBy", "name")
          .sort({ academicSession: -1 })
          .lean(),
        StudentLeaveRequest.find({ schoolId, studentId: student._id })
          .populate("reviewedBy", "name")
          .sort({ fromDate: -1 })
          .lean(),
        AdmissionApplication.find({ schoolId, studentId: student._id })
          .populate("reviewedBy", "name")
          .sort({ createdAt: -1 })
          .lean(),
        Subject.find({
          schoolId,
          classIds: student.classId?._id,
        })
          .select("name")
          .sort({ name: 1 })
          .lean(),
      ]);

    const attendance = attendanceRecords.reduce(
      (summary, record) => {
        summary.total += 1;
        summary[record.status.toLowerCase()] += 1;
        return summary;
      },
      { present: 0, absent: 0, late: 0, leave: 0, total: 0 },
    );

    const fees = feeAccounts.reduce(
      (summary, account) => {
        summary.total += account.totalAmount;
        summary.paid += account.paidAmount;
        summary.pending += Math.max(account.totalAmount - account.paidAmount, 0);
        return summary;
      },
      { total: 0, paid: 0, pending: 0, nextDue: null },
    );
    fees.nextDue =
      feeAccounts
        .filter(
          (account) =>
            account.dueDate &&
            account.totalAmount > account.paidAmount,
        )
        .sort((left, right) => left.dueDate - right.dueDate)[0]?.dueDate || null;

    const activities = [
      ...attendanceRecords.map((record) => ({
        title: "Attendance marked",
        description: `Attendance recorded as ${record.status}.`,
        date: record.date,
        type: "attendance",
      })),
      ...feeAccounts.flatMap((account) =>
        account.payments.map((payment) => ({
          title: "Fee payment received",
          description: `${payment.amount} paid by ${payment.method} for ${account.academicSession}${payment.reference ? ` (Reference: ${payment.reference})` : ""}.`,
          date: payment.paidAt,
          type: "fee",
        })),
      ),
      ...leaveRequests.map((request) => ({
        title: `Leave request ${request.status.toLowerCase()}`,
        description: `${request.reason} (${request.fromDate.toISOString().slice(0, 10)} to ${request.toDate.toISOString().slice(0, 10)}).`,
        date: request.updatedAt || request.createdAt,
        type: "profile",
      })),
      ...admissionApplications.map((application) => ({
        title: `Admission application ${application.status.toLowerCase()}`,
        description: `Application for ${application.requestedClass}.`,
        date: application.updatedAt || application.createdAt,
        type: "profile",
      })),
    ].sort((left, right) => new Date(right.date) - new Date(left.date));

    return res.status(200).json({
      success: true,
      student,
      academicSession: req.user.schoolId.academicSession || null,
      attendance: {
        ...attendance,
        records: attendanceRecords,
      },
      fees: {
        ...fees,
        accounts: feeAccounts,
      },
      leaveRequests,
      admissionApplications,
      subjects,
      activities,
    });
  } catch (error) {
    return next(error);
  }
};
