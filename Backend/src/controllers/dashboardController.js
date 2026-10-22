import Attendance from "../models/Attendance.js";
import Class from "../models/Classes.model.js";
import { Teacher } from "../models/Teacher.js";
import { User } from "../models/User.js";
import Student from "../models/Student.js";
import { Role } from "../models/Role.js";
import { getRoleName } from "../utils/role.js";
import FeeAccount from "../models/FeeAccount.js";
import { getClassAccessScope } from "../utils/classAccess.js";

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const getSchoolDashboardData = async (
  schoolId,
  { includeFees = false, classIds = null } = {},
) => {
  const { start, end } = getTodayRange();
  const classFilter =
    classIds === null ? {} : { _id: { $in: classIds } };
  const studentFilter =
    classIds === null
      ? { schoolId, isActive: true }
      : { schoolId, isActive: true, classId: { $in: classIds } };
  const attendanceMatch =
    classIds === null
      ? { schoolId, date: { $gte: start, $lt: end } }
      : {
          schoolId,
          classId: { $in: classIds },
          date: { $gte: start, $lt: end },
        };
  const [
    classes,
    studentTotal,
    teacherTotal,
    schoolRoles,
    attendanceRecords,
    studentsByClass,
    feeTotals,
    dueFeeAccounts,
  ] =
    await Promise.all([
      Class.find({ schoolId, isActive: true, ...classFilter })
        .select("name section")
        .sort({ name: 1, section: 1 })
        .lean(),
      Student.countDocuments(studentFilter),
      Teacher.countDocuments({ schoolId, isActive: true }),
      Role.find({ schoolId })
        .populate("permission", "key name")
        .select("role name permission")
        .lean(),
      Attendance.aggregate([
        { $match: attendanceMatch },
        {
          $group: {
            _id: { classId: "$classId", status: "$status" },
            count: { $sum: 1 },
          },
        },
      ]),
      Student.aggregate([
        { $match: studentFilter },
        { $group: { _id: "$classId", count: { $sum: 1 } } },
      ]),
      includeFees
        ? FeeAccount.aggregate([
            { $match: { schoolId } },
            {
              $group: {
                _id: null,
                totalBilled: { $sum: "$totalAmount" },
                totalCollected: { $sum: "$paidAmount" },
                accountsWithDue: {
                  $sum: {
                    $cond: [{ $gt: ["$totalAmount", "$paidAmount"] }, 1, 0],
                  },
                },
                overdueAccounts: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $gt: ["$totalAmount", "$paidAmount"] },
                          { $ne: [{ $ifNull: ["$dueDate", null] }, null] },
                          { $lt: ["$dueDate", start] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ])
        : Promise.resolve([]),
      includeFees
        ? FeeAccount.find({
            schoolId,
            $expr: { $gt: ["$totalAmount", "$paidAmount"] },
          })
            .populate({
              path: "studentId",
              select: "name admissionNumber classId",
              populate: { path: "classId", select: "name section" },
            })
            .sort({ dueDate: 1, updatedAt: -1 })
            .lean()
        : Promise.resolve([]),
    ]);

  const adminRoleIds = schoolRoles
    .filter((role) => getRoleName(role) === "Admin")
    .map((role) => role._id);
  const staffTotal = await User.countDocuments({
    schoolId,
    isActive: true,
    roleId: { $nin: adminRoleIds },
  });

  const studentCounts = new Map(
    studentsByClass.map(({ _id, count }) => [String(_id), count]),
  );
  const attendanceByClass = new Map();
  const attendanceTotals = { Present: 0, Absent: 0, Late: 0, Leave: 0 };

  attendanceRecords.forEach(({ _id, count }) => {
    const classId = String(_id.classId);
    const counts = attendanceByClass.get(classId) || {
      Present: 0,
      Absent: 0,
      Late: 0,
      Leave: 0,
    };
    counts[_id.status] = count;
    attendanceByClass.set(classId, counts);
    attendanceTotals[_id.status] += count;
  });

  const classAttendance = classes.map((schoolClass) => {
    const counts = attendanceByClass.get(String(schoolClass._id)) || {
      Present: 0,
      Absent: 0,
      Late: 0,
      Leave: 0,
    };
    const totalStudents = studentCounts.get(String(schoolClass._id)) || 0;
    const marked = counts.Present + counts.Absent + counts.Late + counts.Leave;

    return {
      classId: schoolClass._id,
      className: schoolClass.name,
      section: schoolClass.section,
      totalStudents,
      present: counts.Present,
      absent: counts.Absent,
      late: counts.Late,
      leave: counts.Leave,
      attendanceRate: totalStudents
        ? Math.min(
            Math.round(((counts.Present + counts.Late) / totalStudents) * 100),
            100,
          )
        : 0,
    };
  });

  const attendanceTotal = Object.values(attendanceTotals).reduce(
    (total, count) => total + count,
    0,
  );
  const feeSummary = feeTotals[0] || {
    totalBilled: 0,
    totalCollected: 0,
    accountsWithDue: 0,
    overdueAccounts: 0,
  };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fees = {
    totalBilled: feeSummary.totalBilled,
    totalCollected: feeSummary.totalCollected,
    outstandingBalance: Math.max(
      feeSummary.totalBilled - feeSummary.totalCollected,
      0,
    ),
    accountsWithDue: feeSummary.accountsWithDue,
    overdueAccounts: feeSummary.overdueAccounts,
    dues: dueFeeAccounts
      .filter((account) => account.studentId)
      .map((account) => ({
        id: account._id,
        studentName: account.studentId.name,
        admissionNumber: account.studentId.admissionNumber,
        className: account.studentId.classId?.name || "",
        section: account.studentId.classId?.section || "",
        academicSession: account.academicSession,
        totalAmount: account.totalAmount,
        paidAmount: account.paidAmount,
        dueAmount: Math.max(account.totalAmount - account.paidAmount, 0),
        dueDate: account.dueDate,
        overdue: Boolean(account.dueDate && account.dueDate < today),
      })),
  };

  return {
    studentTotal,
    teacherTotal,
    staffTotal,
    classTotal: classes.length,
    todayAttendance: {
      ...attendanceTotals,
      marked: attendanceTotal,
      rate: studentTotal
        ? Math.min(
            Math.round(
              ((attendanceTotals.Present + attendanceTotals.Late) /
                studentTotal) *
                100,
            ),
            100,
          )
        : 0,
    },
    classAttendance,
    fees,
  };
};

const getSchoolId = (req) => req.user.schoolId._id;

export const getAdminDashboard = async (req, res, next) => {
  try {
    const data = await getSchoolDashboardData(getSchoolId(req), {
      includeFees: true,
    });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const getStaffDashboard = async (req, res, next) => {
  try {
    const classIds = await getClassAccessScope(req.user);
    const { studentTotal, todayAttendance, classAttendance } =
      await getSchoolDashboardData(getSchoolId(req), { classIds });
    return res.status(200).json({
      success: true,
      data: { studentTotal, todayAttendance, classAttendance },
    });
  } catch (error) {
    return next(error);
  }
};
