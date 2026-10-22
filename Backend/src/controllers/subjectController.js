import mongoose from "mongoose";
import { Subject } from "../models/Subject.model.js";
import Class from "../models/Classes.model.js";
import { Teacher } from "../models/Teacher.js";
import { getClassAccessScope } from "../utils/classAccess.js";

export const addSubjectController = async (req, res) => {
  try {
    const { subjects, classId } = req.body;

    const schoolId = req.user.schoolId._id;

    if (
      !Array.isArray(subjects) ||
      subjects.length === 0 ||
      !mongoose.isValidObjectId(classId)
    ) {
      return res.status(400).json({
        success: false,
        message: "A class and at least one subject are required",
      });
    }

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

    const classRecord = await Class.findOne({ _id: classId, schoolId });
    if (!classRecord) {
      return res.status(404).json({ success: false, message: "Class not found" });
    }

    const names = [...new Set(subjects.map((name) => String(name).trim()).filter(Boolean))];
    if (names.length === 0) {
      return res.status(400).json({ success: false, message: "Subject names cannot be empty" });
    }

    const result = await Promise.all(
      names.map((name) =>
        Subject.findOneAndUpdate(
          { schoolId, name },
          { $setOnInsert: { schoolId, name }, $addToSet: { classIds: classRecord._id } },
          { new: true, upsert: true, runValidators: true },
        ),
      ),
    );

    return res.status(201).json({
      success: true,
      message: "Subjects added successfully",
      subjects: result,
    });
  } catch (error) {
    console.error("Add subject error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add subjects",
    });
  }
};


export const getSubjectController = async (req, res) => {
  try {
    const schoolId = req.user.schoolId._id;
    const classAccessScope = await getClassAccessScope(req.user);
    const filter = { schoolId };
    if (classAccessScope !== null) {
      filter.classIds = { $in: classAccessScope };
    }
    if (req.query.classId) {
      if (!mongoose.isValidObjectId(req.query.classId)) {
        return res.status(400).json({ success: false, message: "Invalid class ID" });
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
      const classRecord = await Class.findOne({
        _id: req.query.classId,
        schoolId,
      });
      if (!classRecord) {
        return res.status(404).json({ success: false, message: "Class not found" });
      }
      filter.classIds = classRecord._id;
    }

    const subjects = await Subject.find(filter)
      .select("_id name classIds")
      .sort({ name: 1 })
      .lean();
    const getSubject =
      classAccessScope === null
        ? subjects
        : subjects.map((subject) => ({
            ...subject,
            classIds: subject.classIds.filter((id) =>
              classAccessScope.some(
                (accessibleId) => String(accessibleId) === String(id),
              ),
            ),
          }));

    return res.status(200).json({
      success: true,
      getSubject,
    });
  } catch (error) {
    console.error("Get subject error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get subjects",
    });
  }
};

export const deleteSubjectController = async(req, res)=>{
  try {
   const {id} = req.params;
   const schoolId = req.user.schoolId._id;
   const classId = req.query.classId;
   if (!mongoose.isValidObjectId(id) || (classId && !mongoose.isValidObjectId(classId))) {
     return res.status(400).json({ success: false, message: "Invalid subject or class ID" });
   }
   const classAccessScope = await getClassAccessScope(req.user);
   if (
     classAccessScope !== null &&
     (!classId ||
       !classAccessScope.some((accessibleId) => String(accessibleId) === String(classId)))
   ) {
     return res.status(403).json({
       success: false,
       message: "You do not have access to this class",
     });
   }
   const teacherAssignmentFilter = classId
     ? {
         schoolId,
         teachingAssignments: {
           $elemMatch: { classId, subjectIds: id },
         },
       }
     : { schoolId, "teachingAssignments.subjectIds": id };
   if (await Teacher.exists(teacherAssignmentFilter)) {
     return res.status(409).json({
       success: false,
       message: "This subject is assigned to a teacher and cannot be removed yet",
     });
   }
   const subject = classId
     ? await Subject.findOneAndUpdate(
         { _id: id, schoolId },
         { $pull: { classIds: classId } },
         { new: true },
       )
     : await Subject.findOneAndDelete({ _id: id, schoolId });

   if(!subject) {
    return res.status(404).json({
      success: false,
      message: "Subject not found",
    });
   }
   if (classId && subject.classIds.length === 0) {
     await Subject.deleteOne({ _id: subject._id, schoolId });
   }
    // console.log(findSubjects);
    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Deleted Subject Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

export const getClassesController = async (req, res) => {
  try {
    const schoolId = req.user.schoolId._id;
    const classAccessScope = await getClassAccessScope(req.user);
    const filter = { schoolId, isActive: true };
    if (classAccessScope !== null) {
      filter._id = { $in: classAccessScope };
    }
    const classes = await Class.find(filter)
      .select("_id name section course")
      .sort({ name: 1, section: 1 });
    return res.status(200).json({ success: true, classes });
  } catch (error) {
    console.error("Get classes error:", error);
    return res.status(500).json({ success: false, message: "Failed to get classes" });
  }
};

export const addClassController = async (req, res) => {
  try {
    const classAccessScope = await getClassAccessScope(req.user);
    if (classAccessScope !== null) {
      return res.status(403).json({
        success: false,
        message: "Only school administrators can create classes",
      });
    }

    const schoolId = req.user.schoolId._id;
    const name = String(req.body.name || "").trim();
    const section = String(req.body.section || "").trim().toUpperCase();
    const course = String(req.body.course || "").trim();
    if (!name || !section || !course) {
      return res.status(400).json({
        success: false,
        message: "Class name, section, and course are required",
      });
    }

    const classRecord = await Class.create({ schoolId, name, section, course });
    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      class: classRecord,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This class and section already exist",
      });
    }
    console.error("Add class error:", error);
    return res.status(500).json({ success: false, message: "Failed to create class" });
  }
};