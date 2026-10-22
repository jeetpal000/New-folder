import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import AttendanceHoliday from "../models/AttendanceHoliday.js";
import AttendanceMonth from "../models/AttendanceMonth.js";
import Class from "../models/Classes.model.js";
import Student from "../models/Student.js";
import StudentLeaveRequest from "../models/StudentLeaveRequest.js";
import { getClassAccessScope } from "../utils/classAccess.js";

const getDayRange = (dateValue) => {
  if (typeof dateValue !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return null;
  }
  const start = new Date(`${dateValue}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime()) || start.toISOString().slice(0, 10) !== dateValue) {
    return null;
  }
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

const getMonthRange = (monthValue) => {
  if (typeof monthValue !== "string" || !/^\d{4}-\d{2}$/.test(monthValue)) {
    return null;
  }
  const start = new Date(`${monthValue}-01T00:00:00.000Z`);
  if (
    Number.isNaN(start.getTime()) ||
    start.toISOString().slice(0, 7) !== monthValue
  ) {
    return null;
  }
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end, month: monthValue };
};

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

const isMonthLocked = async (schoolId, classId, month) =>
  Boolean(
    await AttendanceMonth.exists({
      schoolId,
      classId,
      month,
    }),
  );

const hasClassAccess = async (user, classId) => {
  const classAccessScope = await getClassAccessScope(user);
  return (
    classAccessScope === null ||
    classAccessScope.some((id) => String(id) === String(classId))
  );
};

const getActiveClass = async (classId, schoolId) =>
  Class.findOne({ _id: classId, schoolId, isActive: true }).select("_id");

export const getMonthlyAttendance = async (req, res, next) => {
  try {
    const { classId } = req.query;
    const month = getMonthRange(req.query.month);
    if (!mongoose.isValidObjectId(classId) || !month) {
      return res.status(400).json({
        success: false,
        message: "A valid class and month are required",
      });
    }
    if (month.month > getCurrentMonth()) {
      return res.status(400).json({
        success: false,
        message: "Future attendance months are not available",
      });
    }

    const schoolId = req.user.schoolId._id;
    if (!(await hasClassAccess(req.user, classId))) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this class",
      });
    }
    const schoolClass = await Class.findOne({
      _id: classId,
      schoolId,
      isActive: true,
    }).select("_id name section");
    if (!schoolClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found in this school",
      });
    }

    const [students, attendance, approvedLeaves, holidays, locked] =
      await Promise.all([
      Student.find({ schoolId, classId, isActive: true })
        .select("_id name rollNumber admissionNumber")
        .sort({ rollNumber: 1, name: 1 })
        .lean(),
      Attendance.find({
        schoolId,
        classId,
        date: { $gte: month.start, $lt: month.end },
      })
        .select("studentId date status")
        .lean(),
      StudentLeaveRequest.find({
        schoolId,
        classId,
        status: "Approved",
        fromDate: { $lt: month.end },
        toDate: { $gte: month.start },
      })
        .select("studentId fromDate toDate")
        .lean(),
      AttendanceHoliday.find({
        schoolId,
        classId,
        date: { $gte: month.start, $lt: month.end },
      })
        .select("_id date name")
        .lean(),
      AttendanceMonth.exists({ schoolId, classId, month: month.month }),
    ]);

    const attendanceByStudentDate = new Map(
      attendance.map((record) => [
        `${record.studentId}:${record.date.toISOString().slice(0, 10)}`,
        {
          studentId: String(record.studentId),
          date: record.date.toISOString().slice(0, 10),
          status: record.status,
          source: "marked",
        },
      ]),
    );
    const activeStudentIds = new Set(
      students.map((student) => String(student._id)),
    );
    approvedLeaves.forEach((leave) => {
      const studentId = String(leave.studentId);
      if (!activeStudentIds.has(studentId)) return;
      const start = new Date(
        Math.max(leave.fromDate.getTime(), month.start.getTime()),
      );
      const end = new Date(
        Math.min(leave.toDate.getTime(), month.end.getTime() - 1),
      );
      for (
        let date = new Date(
          Date.UTC(
            start.getUTCFullYear(),
            start.getUTCMonth(),
            start.getUTCDate(),
          ),
        );
        date <= end;
        date.setUTCDate(date.getUTCDate() + 1)
      ) {
        const dateValue = date.toISOString().slice(0, 10);
        const key = `${studentId}:${dateValue}`;
        if (!attendanceByStudentDate.has(key)) {
          attendanceByStudentDate.set(key, {
            studentId,
            date: dateValue,
            status: "Leave",
            source: "approved-leave",
          });
        }
      }
    });

    const dayCount = new Date(
      Date.UTC(month.start.getUTCFullYear(), month.start.getUTCMonth() + 1, 0),
    ).getUTCDate();
    const holidayByDate = new Map(
      holidays.map((holiday) => [
        holiday.date.toISOString().slice(0, 10),
        { id: holiday._id, name: holiday.name },
      ]),
    );

    return res.status(200).json({
      success: true,
      class: schoolClass,
      month: month.month,
      locked: Boolean(locked),
      days: Array.from({ length: dayCount }, (_, index) => {
        const date = new Date(
          Date.UTC(
            month.start.getUTCFullYear(),
            month.start.getUTCMonth(),
            index + 1,
          ),
        );
        const dateValue = date.toISOString().slice(0, 10);
        return {
          date: dateValue,
          day: index + 1,
          weekday: date.getUTCDay(),
          isSunday: date.getUTCDay() === 0,
          holiday: holidayByDate.get(dateValue) || null,
        };
      }),
      students: students.map((student) => ({
        ...student,
        id: String(student._id),
        rollNo: student.rollNumber || student.admissionNumber || "—",
      })),
      records: Array.from(attendanceByStudentDate.values()),
    });
  } catch (error) {
    return next(error);
  }
};

export const saveMonthlyAttendance = async (req, res, next) => {
  try {
    const { classId, month: monthValue, records } = req.body;
    const month = getMonthRange(monthValue);
    if (
      !mongoose.isValidObjectId(classId) ||
      !month ||
      !Array.isArray(records) ||
      records.some(
        (record) =>
          !record ||
          typeof record !== "object" ||
          !mongoose.isValidObjectId(record.studentId) ||
          !getDayRange(record.date) ||
          !record.date.startsWith(`${monthValue}-`) ||
          ![null, "", "Present", "Absent", "Late", "Leave"].includes(
            record.status,
          ),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid class, month, and attendance list are required",
      });
    }
    const uniqueKeys = records.map(
      (record) => `${record.studentId}:${record.date}`,
    );
    if (new Set(uniqueKeys).size !== uniqueKeys.length) {
      return res.status(400).json({
        success: false,
        message: "Attendance contains duplicate student dates",
      });
    }

    const schoolId = req.user.schoolId._id;
    if (!(await hasClassAccess(req.user, classId))) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this class",
      });
    }
    if (!(await getActiveClass(classId, schoolId))) {
      return res.status(404).json({
        success: false,
        message: "Class not found in this school",
      });
    }
    if (
      monthValue !== getCurrentMonth() ||
      (await isMonthLocked(schoolId, classId, monthValue))
    ) {
      return res.status(409).json({
        success: false,
        message: "Only the current, unlocked month can be edited",
      });
    }

    const studentIds = [
      ...new Set(records.map((record) => String(record.studentId))),
    ];
    const validCount = studentIds.length
      ? await Student.countDocuments({
          _id: { $in: studentIds },
          schoolId,
          classId,
          isActive: true,
        })
      : 0;
    if (validCount !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: "Every attendance record must belong to the selected class",
      });
    }

    const activeHolidays = await AttendanceHoliday.find({
      schoolId,
      classId,
      date: {
        $in: records
          .filter((record) => record.status !== null && record.status !== "")
          .map((record) => getDayRange(record.date).start),
      },
    })
      .select("date")
      .lean();
    const holidayDates = new Set(
      activeHolidays.map((holiday) => holiday.date.toISOString().slice(0, 10)),
    );
    if (records.some((record) => holidayDates.has(record.date) && record.status)) {
      return res.status(400).json({
        success: false,
        message: "Attendance cannot be marked on a holiday",
      });
    }

    const operations = records.map(({ studentId, date, status }) => {
      const day = getDayRange(date);
      if (!status) {
        return {
          deleteOne: {
            filter: { schoolId, classId, studentId, date: day.start },
          },
        };
      }
      return {
        updateOne: {
          filter: { schoolId, classId, studentId, date: day.start },
          update: {
            $set: { status },
            $setOnInsert: { schoolId, classId, studentId, date: day.start },
          },
          upsert: true,
        },
      };
    });
    if (operations.length) await Attendance.bulkWrite(operations);

    return res.status(200).json({
      success: true,
      message: "Monthly attendance saved successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export const saveAttendanceHoliday = async (req, res, next) => {
  try {
    const { classId, date, name } = req.body;
    const day = getDayRange(date);
    if (
      !mongoose.isValidObjectId(classId) ||
      !day ||
      (typeof name !== "string" && name !== null)
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid class, date, and holiday name are required",
      });
    }
    const holidayName = typeof name === "string" ? name.trim() : "";
    if (holidayName.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Holiday name cannot exceed 100 characters",
      });
    }

    const schoolId = req.user.schoolId._id;
    if (!(await hasClassAccess(req.user, classId))) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this class",
      });
    }
    if (!(await getActiveClass(classId, schoolId))) {
      return res.status(404).json({
        success: false,
        message: "Class not found in this school",
      });
    }
    if (
      day.start.toISOString().slice(0, 7) !== getCurrentMonth() ||
      (await isMonthLocked(
        schoolId,
        classId,
        day.start.toISOString().slice(0, 7),
      ))
    ) {
      return res.status(409).json({
        success: false,
        message: "Only the current, unlocked month can be edited",
      });
    }

    if (!holidayName) {
      await AttendanceHoliday.deleteOne({
        schoolId,
        classId,
        date: day.start,
      });
      return res.status(200).json({
        success: true,
        message: "Holiday removed successfully",
      });
    }

    await AttendanceHoliday.findOneAndUpdate(
      { schoolId, classId, date: day.start },
      {
        $set: { name: holidayName, createdBy: req.user._id },
        $setOnInsert: { schoolId, classId, date: day.start },
      },
      { upsert: true, new: true, runValidators: true },
    );
    return res.status(200).json({
      success: true,
      message: "Holiday saved successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export const lockAttendanceMonth = async (req, res, next) => {
  try {
    const { classId, month: monthValue } = req.body;
    const month = getMonthRange(monthValue);
    if (!mongoose.isValidObjectId(classId) || !month) {
      return res.status(400).json({
        success: false,
        message: "A valid class and month are required",
      });
    }
    if (monthValue >= getCurrentMonth()) {
      return res.status(400).json({
        success: false,
        message: "A month can only be locked after it has ended",
      });
    }

    const schoolId = req.user.schoolId._id;
    if (!(await hasClassAccess(req.user, classId))) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this class",
      });
    }
    if (!(await getActiveClass(classId, schoolId))) {
      return res.status(404).json({
        success: false,
        message: "Class not found in this school",
      });
    }

    await AttendanceMonth.findOneAndUpdate(
      { schoolId, classId, month: monthValue },
      {
        $setOnInsert: {
          schoolId,
          classId,
          month: monthValue,
          lockedAt: new Date(),
          lockedBy: req.user._id,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );
    return res.status(200).json({
      success: true,
      message: "Monthly attendance is locked",
    });
  } catch (error) {
    return next(error);
  }
};

export const getAttendanceRoster = async (req, res, next) => {
  try {
    const { classId } = req.query;
    const day = getDayRange(req.query.date);
    if (!mongoose.isValidObjectId(classId) || !day) {
      return res.status(400).json({
        success: false,
        message: "A valid class and date are required",
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
    }).select("_id name section course");
    if (!schoolClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found in this school",
      });
    }

    const [students, attendance] = await Promise.all([
      Student.find({ schoolId, classId, isActive: true })
        .select("_id name rollNumber admissionNumber")
        .sort({ rollNumber: 1, name: 1 })
        .lean(),
      Attendance.find({
        schoolId,
        classId,
        date: { $gte: day.start, $lt: day.end },
      })
        .select("studentId status")
        .lean(),
    ]);
    const byStudent = new Map(
      attendance.map((record) => [String(record.studentId), record.status]),
    );

    return res.status(200).json({
      success: true,
      class: schoolClass,
      students: students.map((student) => ({
        ...student,
        status: byStudent.get(String(student._id)) || "Absent",
      })),
    });
  } catch (error) {
    return next(error);
  }
};

export const saveAttendance = async (req, res, next) => {
  try {
    const { classId, date, students } = req.body;
    const day = getDayRange(date);
    if (
      !mongoose.isValidObjectId(classId) ||
      !day ||
      !Array.isArray(students) ||
      students.length === 0 ||
      students.some(
        (record) =>
          !mongoose.isValidObjectId(record.studentId) ||
          !["Present", "Absent", "Late", "Leave"].includes(record.status),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid class, date, and attendance list are required",
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
      return res.status(404).json({
        success: false,
        message: "Class not found in this school",
      });
    }
    if (day.start.toISOString().slice(0, 7) !== getCurrentMonth()) {
      return res.status(409).json({
        success: false,
        message: "Only the current month can be edited",
      });
    }
    if (
      await isMonthLocked(
        schoolId,
        classId,
        day.start.toISOString().slice(0, 7),
      )
    ) {
      return res.status(409).json({
        success: false,
        message: "This attendance month is locked",
      });
    }

    const studentIds = students.map((record) => String(record.studentId));
    if (new Set(studentIds).size !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: "Attendance contains duplicate students",
      });
    }
    const validCount = await Student.countDocuments({
      _id: { $in: studentIds },
      schoolId,
      classId,
      isActive: true,
    });
    if (validCount !== students.length) {
      return res.status(400).json({
        success: false,
        message: "Every attendance record must belong to the selected class",
      });
    }

    await Attendance.bulkWrite(
      students.map(({ studentId, status }) => ({
        updateOne: {
          filter: {
            schoolId,
            classId,
            studentId,
            date: day.start,
          },
          update: {
            $set: { status },
            $setOnInsert: { schoolId, classId, studentId, date: day.start },
          },
          upsert: true,
        },
      })),
    );
    return res.status(200).json({
      success: true,
      message: "Attendance saved successfully",
    });
  } catch (error) {
    return next(error);
  }
};
