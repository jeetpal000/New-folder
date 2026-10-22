import mongoose from "mongoose";
import Assessment from "../models/Assessment.js";
import Class from "../models/Classes.model.js";
import Student from "../models/Student.js";
import { Teacher } from "../models/Teacher.js";
import { Subject } from "../models/Subject.model.js";
import { getClassAccessScope } from "../utils/classAccess.js";
import { getRoleName } from "../utils/role.js";
import { hasAssessmentSubjectAccess } from "../utils/assessmentAccess.js";
import {
  areAssessmentMarksWithinLimit,
  hasCompleteAssessmentResults,
  isValidAssessmentResult,
} from "../utils/assessmentRules.js";

const assessmentTypes = ["Quiz", "Unit Test", "Mid Term", "Final", "Other"];

const getAccessibleClass = async (req, classId) => {
  const schoolId = req.user.schoolId._id;
  const classAccessScope = await getClassAccessScope(req.user);
  if (
    classAccessScope !== null &&
    !classAccessScope.some((accessibleId) => String(accessibleId) === String(classId))
  ) {
    return { denied: true };
  }

  const schoolClass = await Class.findOne({
    _id: classId,
    schoolId,
    isActive: true,
  }).select("_id name section classTeacherId");
  return { schoolClass };
};

const getAssessmentSubjectScope = async (user) => {
  if (getRoleName(user.roleId) === "Admin") return null;
  const schoolId = user.schoolId._id;
  const teacher = await Teacher.findOne({
    schoolId,
    userId: user._id,
    isActive: true,
  })
    .select("_id teachingAssignments.classId teachingAssignments.subjectIds")
    .lean();
  if (!teacher) return { teacher: null, classTeacherClassIds: [] };
  const classTeacherClassIds = await Class.distinct("_id", {
    schoolId,
    isActive: true,
    classTeacherId: teacher._id,
  });
  return { teacher, classTeacherClassIds };
};

export const listAssessments = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId._id;
    const classAccessScope = await getClassAccessScope(req.user);
    const subjectScope = await getAssessmentSubjectScope(req.user);
    const filter = { schoolId };

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
    if (subjectScope !== null) {
      const subjectAssignments = (subjectScope.teacher?.teachingAssignments || [])
        .filter((assignment) => assignment.subjectIds?.length)
        .map((assignment) => ({
          classId: assignment.classId,
          subjectId: { $in: assignment.subjectIds },
        }));
      const accessibleSubjectConditions = [
        ...(subjectScope.classTeacherClassIds.length
          ? [{ classId: { $in: subjectScope.classTeacherClassIds } }]
          : []),
        ...subjectAssignments,
      ];
      filter.$and = [
        {
          $or: accessibleSubjectConditions.length
            ? accessibleSubjectConditions
            : [{ _id: null }],
        },
      ];
    }

    const assessments = await Assessment.find(filter)
      .populate("classId", "name section")
      .populate("subjectId", "name")
      .populate("createdBy", "name")
      .sort({ scheduledAt: -1, createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, assessments });
  } catch (error) {
    return next(error);
  }
};

export const createAssessment = async (req, res, next) => {
  try {
    const {
      title,
      classId,
      subjectId,
      type,
      academicSession,
      scheduledAt,
      maxMarks,
      passMarks,
    } = req.body;
    const maximum = Number(maxMarks);
    const pass = Number(passMarks);

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 120 ||
      !mongoose.isValidObjectId(classId) ||
      !mongoose.isValidObjectId(subjectId) ||
      !assessmentTypes.includes(type) ||
      typeof academicSession !== "string" ||
      !academicSession.trim() ||
      academicSession.trim().length > 30 ||
      !scheduledAt ||
      Number.isNaN(new Date(scheduledAt).getTime()) ||
      !Number.isFinite(maximum) ||
      maximum <= 0 ||
      !Number.isFinite(pass) ||
      pass < 0 ||
      pass > maximum
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid title, class, subject, session, date, and marks range",
      });
    }

    const schoolId = req.user.schoolId._id;
    const { schoolClass, denied } = await getAccessibleClass(req, classId);
    if (denied) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this class",
      });
    }
    if (!schoolClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found in this school",
      });
    }
    const subject = await Subject.findOne({
      _id: subjectId,
      schoolId,
      classIds: classId,
    }).select("_id");
    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Select a subject assigned to this class",
      });
    }
    const subjectScope = await getAssessmentSubjectScope(req.user);
    if (!hasAssessmentSubjectAccess(subjectScope, classId, subjectId)) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to assessments for this subject",
      });
    }

    const assessment = await Assessment.create({
      schoolId,
      classId: schoolClass._id,
      subjectId: subject._id,
      title: title.trim(),
      type,
      academicSession: academicSession.trim(),
      scheduledAt: new Date(scheduledAt),
      maxMarks: maximum,
      passMarks: pass,
      createdBy: req.user._id,
    });
    await assessment.populate([
      { path: "classId", select: "name section" },
      { path: "subjectId", select: "name" },
      { path: "createdBy", select: "name" },
    ]);

    return res.status(201).json({
      success: true,
      message: "Assessment created successfully",
      assessment,
    });
  } catch (error) {
    return next(error);
  }
};

export const getAssessmentResults = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.assessmentId)) {
      return res.status(400).json({
        success: false,
        message: "A valid assessment is required",
      });
    }

    const assessment = await Assessment.findOne({
      _id: req.params.assessmentId,
      schoolId: req.user.schoolId._id,
    })
      .populate("classId", "name section")
      .populate("subjectId", "name")
      .lean();
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found in this school",
      });
    }

    const { denied } = await getAccessibleClass(req, assessment.classId._id);
    if (denied) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this class",
      });
    }
    const subjectScope = await getAssessmentSubjectScope(req.user);
    if (
      !hasAssessmentSubjectAccess(
        subjectScope,
        assessment.classId._id,
        assessment.subjectId._id,
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to results for this subject",
      });
    }

    const [students, classSize] = await Promise.all([
      Student.find({
        schoolId: req.user.schoolId._id,
        classId: assessment.classId._id,
        isActive: true,
      })
        .select("_id name admissionNumber rollNumber")
        .sort({ rollNumber: 1, name: 1 })
        .lean(),
      Student.countDocuments({
        schoolId: req.user.schoolId._id,
        classId: assessment.classId._id,
        isActive: true,
      }),
    ]);
    const resultByStudent = new Map(
      assessment.results.map((result) => [String(result.studentId), result]),
    );

    return res.status(200).json({
      success: true,
      assessment: {
        ...assessment,
        studentCount: classSize,
      },
      students: students.map((student) => ({
        ...student,
        result: resultByStudent.get(String(student._id)) || null,
      })),
    });
  } catch (error) {
    return next(error);
  }
};

export const saveAssessmentResults = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const { results } = req.body;
    if (
      !mongoose.isValidObjectId(assessmentId) ||
      !Array.isArray(results) ||
      results.length === 0 ||
      results.some(
        (result) =>
          !result ||
          !mongoose.isValidObjectId(result.studentId) ||
          !isValidAssessmentResult(result),
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid marks entry for each student",
      });
    }

    const studentIds = results.map((result) => String(result.studentId));
    if (new Set(studentIds).size !== studentIds.length) {
      return res.status(400).json({
        success: false,
        message: "Results contain duplicate students",
      });
    }

    const schoolId = req.user.schoolId._id;
    const assessment = await Assessment.findOne({
      _id: assessmentId,
      schoolId,
    });
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found in this school",
      });
    }
    if (assessment.status !== "Draft") {
      return res.status(409).json({
        success: false,
        message: "Published assessment results cannot be changed",
      });
    }

    const { denied } = await getAccessibleClass(req, assessment.classId);
    if (denied) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this class",
      });
    }
    const subjectScope = await getAssessmentSubjectScope(req.user);
    if (
      !hasAssessmentSubjectAccess(
        subjectScope,
        assessment.classId,
        assessment.subjectId,
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to results for this subject",
      });
    }

    const activeStudentIds = await Student.distinct("_id", {
      schoolId,
      classId: assessment.classId,
      isActive: true,
    });
    const allowedIds = new Set(activeStudentIds.map(String));
    if (studentIds.some((studentId) => !allowedIds.has(studentId))) {
      return res.status(400).json({
        success: false,
        message: "Every result must belong to an active student in this class",
      });
    }
    if (!areAssessmentMarksWithinLimit(results, assessment.maxMarks)) {
      return res.status(400).json({
        success: false,
        message: `Marks cannot exceed ${assessment.maxMarks}`,
      });
    }

    const updateResult = await Assessment.updateOne(
      {
        _id: assessment._id,
        schoolId,
        status: "Draft",
        updatedAt: assessment.updatedAt,
      },
      {
        $set: {
          results: results.map((result) => ({
            studentId: result.studentId,
            marks: result.isAbsent ? null : Number(result.marks),
            isAbsent: result.isAbsent,
            remark: result.remark?.trim() || "",
          })),
        },
      },
      { runValidators: true },
    );
    if (updateResult.matchedCount === 0) {
      return res.status(409).json({
        success: false,
        message: "Assessment results changed elsewhere; reload before saving",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assessment results saved successfully",
      resultCount: results.length,
    });
  } catch (error) {
    return next(error);
  }
};

export const publishAssessmentResults = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    if (!mongoose.isValidObjectId(assessmentId)) {
      return res.status(400).json({
        success: false,
        message: "A valid assessment is required",
      });
    }

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      schoolId: req.user.schoolId._id,
    });
    if (!assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found in this school",
      });
    }
    if (assessment.status !== "Draft") {
      return res.status(409).json({
        success: false,
        message: "Assessment results have already been published",
      });
    }

    const { denied } = await getAccessibleClass(req, assessment.classId);
    if (denied) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this class",
      });
    }
    const subjectScope = await getAssessmentSubjectScope(req.user);
    if (
      !hasAssessmentSubjectAccess(
        subjectScope,
        assessment.classId,
        assessment.subjectId,
      )
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to publish results for this subject",
      });
    }

    const activeStudentIds = await Student.distinct("_id", {
      schoolId: req.user.schoolId._id,
      classId: assessment.classId,
      isActive: true,
    });
    if (!hasCompleteAssessmentResults(activeStudentIds, assessment.results)) {
      return res.status(400).json({
        success: false,
        message: "Enter results for every active student before publishing",
      });
    }

    const publishedAssessment = await Assessment.findOneAndUpdate(
      {
        _id: assessment._id,
        schoolId: req.user.schoolId._id,
        status: "Draft",
        updatedAt: assessment.updatedAt,
      },
      {
        $set: {
          status: "Published",
          publishedAt: new Date(),
          publishedBy: req.user._id,
        },
      },
      { new: true, runValidators: true },
    );
    if (!publishedAssessment) {
      return res.status(409).json({
        success: false,
        message: "Assessment results were published by another user",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Assessment results published successfully",
      assessment: publishedAssessment,
    });
  } catch (error) {
    return next(error);
  }
};
