import mongoose from "mongoose";
import FeeAccount from "../models/FeeAccount.js";
import Student from "../models/Student.js";
import { getClassAccessScope } from "../utils/classAccess.js";

const getSchoolId = (req) => req.user.schoolId._id;

const formatFee = (account) => {
  const fee = account.toObject ? account.toObject() : account;
  return {
    ...fee,
    dueAmount: Math.max(fee.totalAmount - fee.paidAmount, 0),
    student: fee.studentId,
    studentId: fee.studentId?._id || fee.studentId,
  };
};

export const getFeeAccounts = async (req, res, next) => {
  try {
    const schoolId = getSchoolId(req);
    const classAccessScope = await getClassAccessScope(req.user);
    const filter = { schoolId };
    if (classAccessScope !== null) {
      const studentIds = await Student.distinct("_id", {
        schoolId,
        classId: { $in: classAccessScope },
      });
      filter.studentId = { $in: studentIds };
    }
    const accounts = await FeeAccount.find(filter)
      .populate({
        path: "studentId",
        select: "name admissionNumber classId",
        populate: { path: "classId", select: "name section" },
      })
      .populate("payments.receivedBy", "name")
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      accounts: accounts.map(formatFee),
    });
  } catch (error) {
    return next(error);
  }
};

export const createFeeAccount = async (req, res, next) => {
  try {
    const { studentId, academicSession, totalAmount, dueDate } = req.body;
    const amount = Number(totalAmount);
    if (
      !mongoose.isValidObjectId(studentId) ||
      typeof academicSession !== "string" ||
      !academicSession.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      (dueDate && Number.isNaN(new Date(dueDate).getTime()))
    ) {
      return res.status(400).json({
        success: false,
        message: "Student, academic session, positive fee amount and valid due date are required",
      });
    }

    const schoolId = getSchoolId(req);
    const student = await Student.findOne({
      _id: studentId,
      schoolId,
      isActive: true,
    }).select("_id classId");
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
        (classId) => String(classId) === String(student.classId),
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this student's class",
      });
    }

    const account = await FeeAccount.create({
      schoolId,
      studentId,
      academicSession: academicSession.trim(),
      totalAmount: amount,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    });
    await account.populate("studentId", "name admissionNumber classId");

    return res.status(201).json({
      success: true,
      account: formatFee(account),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A fee account already exists for this student and session",
      });
    }
    return next(error);
  }
};

export const recordFeePayment = async (req, res, next) => {
  try {
    const { amount, method, reference, paidAt } = req.body;
    const paymentAmount = Number(amount);
    const methods = ["Cash", "UPI", "Bank Transfer", "Card", "Other"];
    if (
      !mongoose.isValidObjectId(req.params.accountId) ||
      !Number.isFinite(paymentAmount) ||
      paymentAmount <= 0 ||
      !methods.includes(method) ||
      (paidAt && Number.isNaN(new Date(paidAt).getTime()))
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid payment amount, method and payment date are required",
      });
    }

    const schoolId = getSchoolId(req);
    const existingAccount = await FeeAccount.findOne({
      _id: req.params.accountId,
      schoolId,
    }).select("studentId");
    if (!existingAccount) {
      return res.status(404).json({
        success: false,
        message: "Fee account not found",
      });
    }
    const classAccessScope = await getClassAccessScope(req.user);
    if (classAccessScope !== null) {
      const student = await Student.findOne({
        _id: existingAccount.studentId,
        schoolId,
      })
        .select("classId")
        .lean();
      if (
        !student ||
        !classAccessScope.some(
          (classId) => String(classId) === String(student.classId),
        )
      ) {
        return res.status(403).json({
          success: false,
          message: "You do not have access to this student's class",
        });
      }
    }

    const account = await FeeAccount.findOneAndUpdate(
      {
        _id: req.params.accountId,
        schoolId,
        $expr: {
          $lte: [
            { $add: ["$paidAmount", paymentAmount] },
            "$totalAmount",
          ],
        },
      },
      {
        $inc: { paidAmount: paymentAmount },
        $push: {
          payments: {
            amount: paymentAmount,
            method,
            reference: reference?.trim() || undefined,
            paidAt: paidAt ? new Date(paidAt) : new Date(),
            receivedBy: req.user._id,
          },
        },
      },
      { new: true, runValidators: true },
    )
      .populate("studentId", "name admissionNumber")
      .populate("payments.receivedBy", "name");

    if (!account) {
      const exists = await FeeAccount.exists({
        _id: req.params.accountId,
        schoolId,
      });
      return res.status(exists ? 400 : 404).json({
        success: false,
        message: exists
          ? "Payment exceeds the remaining balance"
          : "Fee account not found",
      });
    }

    return res.status(200).json({
      success: true,
      account: formatFee(account),
    });
  } catch (error) {
    return next(error);
  }
};
