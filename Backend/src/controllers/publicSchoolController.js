import mongoose from "mongoose";
import { School } from "../models/School.js";
import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { Teacher } from "../models/Teacher.js";
import Class from "../models/Classes.model.js";
import Student from "../models/Student.js";
import AdmissionApplication from "../models/AdmissionApplication.js";
import StudentLeaveRequest from "../models/StudentLeaveRequest.js";
import Feedback from "../models/Feedback.js";
import { Subject } from "../models/Subject.model.js";
import { getRoleName } from "../utils/role.js";
import { getClassTeacherAccessScope } from "../utils/classAccess.js";
import { sendEmail } from "../lib/nodeMailer.js";
import AppError from "../utils/AppError.js";
import {
  releasePlanUsage,
  reservePlanUsage,
} from "../services/subscription.service.js";
import {
  destroyStudentPhoto,
  uploadStudentPhoto,
} from "../services/studentPhoto.service.js";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const startOfDay = (value) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value
    ? null
    : date;
};

export const submitWebsiteFeedback = async (req, res, next) => {
  try {
    const { name, email, phone, topic, message, website } = req.body || {};
    if (typeof website === "string" && website.trim()) {
      return res.status(201).json({
        success: true,
        message: "Thanks for getting in touch. Your message has been received.",
      });
    }

    const normalizedEmail =
      typeof email === "string" ? email.trim().toLowerCase() : "";
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.trim().length > 100 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ||
      normalizedEmail.length > 254 ||
      (typeof phone === "string" && phone.trim().length > 30) ||
      (typeof topic === "string" && topic.trim().length > 100) ||
      typeof message !== "string" ||
      !message.trim() ||
      message.trim().length > 3000
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid name, email, and message to submit feedback",
      });
    }

    await Feedback.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: typeof phone === "string" ? phone.trim() : "",
      topic:
        typeof topic === "string" && topic.trim()
          ? topic.trim()
          : "General feedback",
      message: message.trim(),
    });
    return res.status(201).json({
      success: true,
      message: "Thanks for getting in touch. Your message has been received.",
    });
  } catch (error) {
    return next(error);
  }
};

export const getWebsiteFeedback = async (req, res, next) => {
  try {
    const filter = {};
    if (["New", "Reviewed", "Resolved"].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    const feedback = await Feedback.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return res.status(200).json({ success: true, feedback });
  } catch (error) {
    return next(error);
  }
};

export const updateWebsiteFeedback = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "A valid feedback record is required",
      });
    }
    const status = req.body?.status;
    if (!["New", "Reviewed", "Resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Select a valid feedback status",
      });
    }
    const feedback = await Feedback.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true },
    ).lean();
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback record was not found",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Feedback status updated",
      feedback,
    });
  } catch (error) {
    return next(error);
  }
};

const getPublicCounts = async (schools) => {
  const schoolIds = schools.map((school) => school._id);
  if (!schoolIds.length) return new Map();

  const [teacherCounts, classCounts, roles] = await Promise.all([
    Teacher.aggregate([
      { $match: { schoolId: { $in: schoolIds }, isActive: true } },
      { $group: { _id: "$schoolId", count: { $sum: 1 } } },
    ]),
    Class.aggregate([
      { $match: { schoolId: { $in: schoolIds }, isActive: true } },
      { $group: { _id: "$schoolId", count: { $sum: 1 } } },
    ]),
    Role.find({ schoolId: { $in: schoolIds } })
      .select("_id schoolId role name")
      .lean(),
  ]);
  const adminRoleIds = new Set(
    roles
      .filter((role) => (role.role || role.name) === "Admin")
      .map((role) => String(role._id)),
  );
  const adminRolesBySchool = new Map();
  roles.forEach((role) => {
    if (!adminRoleIds.has(String(role._id))) return;
    const key = String(role.schoolId);
    const ids = adminRolesBySchool.get(key) || [];
    ids.push(role._id);
    adminRolesBySchool.set(key, ids);
  });
  const staffCounts = await Promise.all(
    schoolIds.map(async (schoolId) => {
      const schoolKey = String(schoolId);
      const count = await User.countDocuments({
        schoolId,
        isActive: true,
        roleId: { $nin: adminRolesBySchool.get(schoolKey) || [] },
      });
      return [schoolKey, count];
    }),
  );
  const teachersBySchool = new Map(
    teacherCounts.map(({ _id, count }) => [String(_id), count]),
  );
  const classesBySchool = new Map(
    classCounts.map(({ _id, count }) => [String(_id), count]),
  );
  const staffBySchool = new Map(staffCounts);

  return new Map(
    schoolIds.map((id) => [
      String(id),
      {
        teacherCount: teachersBySchool.get(String(id)) || 0,
        classCount: classesBySchool.get(String(id)) || 0,
        staffCount: staffBySchool.get(String(id)) || 0,
      },
    ]),
  );
};

const getSchoolForPublic = async (slug) =>
  School.findOne({ slug, isActive: true }).lean();

export const getAdminPublicSchoolProfile = async (req, res, next) => {
  try {
    const school = await School.findById(req.user.schoolId._id)
      .select("schoolName slug admissionOpen facilities publicHighlights")
      .lean();
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }
    return res.status(200).json({ success: true, school });
  } catch (error) {
    return next(error);
  }
};

export const getAdminSchoolProfile = async (req, res, next) => {
  try {
    const school = await School.findById(req.user.schoolId._id)
      .select(
        "schoolName slug schoolCode board city address pincode schoolEmail schoolPhone state schoolType principalName affiliationNumber academicSession establishedYear logo bannerImage",
      )
      .lean();
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }
    return res.status(200).json({ success: true, school });
  } catch (error) {
    return next(error);
  }
};

export const updateAdminSchoolProfile = async (req, res, next) => {
  try {
    const body = req.body || {};
    const stringFields = {
      schoolName: 150,
      board: 100,
      city: 100,
      address: 300,
      pincode: 20,
      schoolPhone: 30,
      state: 100,
      schoolType: 80,
      principalName: 120,
      affiliationNumber: 100,
      academicSession: 30,
    };
    const updates = {};

    for (const [field, maxLength] of Object.entries(stringFields)) {
      if (body[field] === undefined) continue;
      if (typeof body[field] !== "string") {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string`,
        });
      }
      const value = body[field].trim();
      if (value.length > maxLength || (field === "schoolName" && !value)) {
        return res.status(400).json({
          success: false,
          message: `Enter a valid ${field}`,
        });
      }
      updates[field] = value;
    }

    if (body.establishedYear !== undefined) {
      if (
        body.establishedYear !== null &&
        body.establishedYear !== "" &&
        (!Number.isInteger(Number(body.establishedYear)) ||
          Number(body.establishedYear) < 1800 ||
          Number(body.establishedYear) > new Date().getFullYear())
      ) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid established year",
        });
      }
      updates.establishedYear =
        body.establishedYear === null || body.establishedYear === ""
          ? null
          : Number(body.establishedYear);
    }

    const school = await School.findByIdAndUpdate(
      req.user.schoolId._id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select(
      "schoolName slug schoolCode board city address pincode schoolEmail schoolPhone state schoolType principalName affiliationNumber academicSession establishedYear logo bannerImage",
    );
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }
    return res.status(200).json({
      success: true,
      message: "School profile updated",
      school,
    });
  } catch (error) {
    return next(error);
  }
};

export const uploadAdminSchoolImage = async (req, res, next) => {
  let uploadedImage;
  let imagePersisted = false;
  try {
    const imageType = req.body?.type;
    if (!["logo", "banner"].includes(imageType)) {
      return res.status(400).json({
        success: false,
        message: "Choose whether this image is the school logo or overview banner",
      });
    }
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Select an image to upload",
      });
    }

    const school = await School.findById(req.user.schoolId._id);
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }

    uploadedImage = await uploadStudentPhoto(
      req.file,
      school._id,
      `schools/${imageType}`,
    );
    const urlField = imageType === "logo" ? "logo" : "bannerImage";
    const publicIdField =
      imageType === "logo" ? "logoPublicId" : "bannerImagePublicId";
    const previousPublicId = school[publicIdField];

    school[urlField] = uploadedImage.url;
    school[publicIdField] = uploadedImage.publicId;
    await school.save();
    imagePersisted = true;

    if (previousPublicId) {
      try {
        await destroyStudentPhoto(previousPublicId);
      } catch (cleanupError) {
        console.error("Could not delete the replaced school image:", cleanupError);
      }
    }

    return res.status(200).json({
      success: true,
      message: imageType === "logo" ? "School logo uploaded" : "Overview banner uploaded",
      school: {
        _id: school._id,
        logo: school.logo,
        bannerImage: school.bannerImage,
      },
    });
  } catch (error) {
    if (uploadedImage && !imagePersisted) {
      try {
        await destroyStudentPhoto(uploadedImage.publicId);
      } catch (cleanupError) {
        console.error("Could not delete an unlinked school image:", cleanupError);
      }
    }
    return next(error);
  }
};

export const updateAdminPublicSchoolProfile = async (req, res, next) => {
  try {
    const { admissionOpen, facilities, publicHighlights } = req.body;
    if (
      typeof admissionOpen !== "boolean" ||
      !Array.isArray(facilities) ||
      facilities.length > 100 ||
      facilities.some((item) => typeof item !== "string") ||
      !Array.isArray(publicHighlights) ||
      publicHighlights.length > 50
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid admission status, facilities list and profile sections",
      });
    }

    const cleanFacilities = [...new Set(facilities
      .map((item) => item.trim())
      .filter(Boolean))];
    if (cleanFacilities.some((item) => item.length > 100)) {
      return res.status(400).json({
        success: false,
        message: "Facility names must be 100 characters or fewer",
      });
    }

    const allowedCategories = new Set([
      "feature",
      "award",
      "picnic",
      "tour",
      "function",
    ]);
    const cleanHighlights = [];
    for (const item of publicHighlights) {
      if (
        !item ||
        !allowedCategories.has(item.category) ||
        typeof item.title !== "string" ||
        !item.title.trim() ||
        item.title.trim().length > 100 ||
        (item.description != null &&
          (typeof item.description !== "string" ||
            item.description.length > 1000)) ||
        (item.imageUrl != null &&
          (typeof item.imageUrl !== "string" || item.imageUrl.length > 2000))
      ) {
        return res.status(400).json({
          success: false,
          message: "Each profile section needs a valid type and title",
        });
      }
      const imageUrl = String(item.imageUrl || "").trim();
      if (imageUrl) {
        let parsedUrl;
        try {
          parsedUrl = new URL(imageUrl);
        } catch {
          return res.status(400).json({
            success: false,
            message: "Photo links must be valid HTTPS URLs",
          });
        }
        if (parsedUrl.protocol !== "https:") {
          return res.status(400).json({
            success: false,
            message: "Photo links must use HTTPS",
          });
        }
      }
      cleanHighlights.push({
        category: item.category,
        title: item.title.trim(),
        description: String(item.description || "").trim(),
        imageUrl,
      });
    }

    const school = await School.findByIdAndUpdate(
      req.user.schoolId._id,
      {
        $set: {
          admissionOpen,
          facilities: cleanFacilities,
          publicHighlights: cleanHighlights,
        },
      },
      { new: true, runValidators: true },
    ).select("schoolName slug admissionOpen facilities publicHighlights");
    if (!school) {
      return res.status(404).json({ success: false, message: "School not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Public school profile updated",
      school,
    });
  } catch (error) {
    return next(error);
  }
};

export const searchPublicSchools = async (req, res, next) => {
  try {
    const query = String(req.query.q || "").trim();
    if (query.length > 100) {
      return res.status(400).json({
        success: false,
        message: "Search text must be 100 characters or fewer",
      });
    }
    const filter = { isActive: true };
    if (query) {
      const pattern = new RegExp(escapeRegExp(query), "i");
      filter.$or = [
        { schoolName: pattern },
        { city: pattern },
        { state: pattern },
        { board: pattern },
      ];
    }

    const schools = await School.find(filter)
      .select("schoolName slug board schoolType city state logo facilities admissionOpen")
      .sort({ schoolName: 1 })
      .limit(50)
      .lean();
    const counts = await getPublicCounts(schools);
    return res.status(200).json({
      success: true,
      schools: schools.map((school) => ({
        ...school,
        ...(counts.get(String(school._id)) || {}),
      })),
    });
  } catch (error) {
    return next(error);
  }
};

export const getPublicSchoolProfile = async (req, res, next) => {
  try {
    const school = await getSchoolForPublic(req.params.slug);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }
    const [counts] = await Promise.all([
      getPublicCounts([school]).then((result) =>
        result.get(String(school._id)),
      ),
    ]);
    const classes = await Class.find({
      schoolId: school._id,
      isActive: true,
    })
      .select("name section course")
      .sort({ name: 1, section: 1 })
      .lean();
    const subjects = await Subject.find({
      schoolId: school._id,
      classIds: { $in: classes.map((item) => item._id) },
    })
      .select("name classIds")
      .lean();
    const subjectsByClass = new Map();
    subjects.forEach((subject) => {
      subject.classIds.forEach((classId) => {
        const key = String(classId);
        const names = subjectsByClass.get(key) || [];
        names.push(subject.name);
        subjectsByClass.set(key, names);
      });
    });
    return res.status(200).json({
      success: true,
      school: {
        id: school._id,
        schoolName: school.schoolName,
        slug: school.slug,
        board: school.board,
        schoolType: school.schoolType,
        city: school.city,
        state: school.state,
        address: school.address,
        pincode: school.pincode,
        schoolEmail: school.schoolEmail,
        schoolPhone: school.schoolPhone,
        principalName: school.principalName,
        academicSession: school.academicSession,
        establishedYear: school.establishedYear,
        logo: school.logo,
        bannerImage: school.bannerImage,
        facilities: school.facilities || [],
        publicHighlights: school.publicHighlights || [],
        admissionOpen: school.admissionOpen,
        classes: classes.map((item) => ({
          ...item,
          subjects: subjectsByClass.get(String(item._id)) || [],
        })),
        ...counts,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const submitAdmissionApplication = async (req, res, next) => {
  try {
    const school = await getSchoolForPublic(req.params.slug);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }
    if (!school.admissionOpen) {
      return res.status(403).json({
        success: false,
        message: "Admissions are currently closed for this school",
      });
    }
    const {
      applicantName,
      dateOfBirth,
      gender,
      guardianName,
      guardianPhone,
      email,
      address,
      requestedClass,
    } = req.body;
    const normalizedEmail =
      typeof email === "string" && email.trim()
        ? email.trim().toLowerCase()
        : undefined;
    if (
      typeof applicantName !== "string" ||
      !applicantName.trim() ||
      applicantName.trim().length > 100 ||
      !startOfDay(String(dateOfBirth || "").slice(0, 10)) ||
      typeof guardianName !== "string" ||
      !guardianName.trim() ||
      guardianName.trim().length > 100 ||
      typeof guardianPhone !== "string" ||
      !/^\+?[0-9 -]{7,16}$/.test(guardianPhone.trim()) ||
      typeof requestedClass !== "string" ||
      !requestedClass.trim() ||
      requestedClass.trim().length > 100 ||
      (normalizedEmail &&
        (normalizedEmail.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))) ||
      (typeof address === "string" && address.trim().length > 500) ||
      (gender != null && !["Male", "Female", "Other"].includes(gender))
    ) {
      return res.status(400).json({
        success: false,
        message: "Student, date of birth, guardian contact and requested class are required",
      });
    }

    const application = await AdmissionApplication.create({
      schoolId: school._id,
      applicantName: applicantName.trim(),
      dateOfBirth: startOfDay(String(dateOfBirth).slice(0, 10)),
      gender,
      guardianName: guardianName.trim(),
      guardianPhone: guardianPhone.trim(),
      email: normalizedEmail,
      address: typeof address === "string" ? address.trim() : undefined,
      requestedClass: requestedClass.trim(),
    });
    return res.status(201).json({
      success: true,
      message: "Admission application submitted for school review",
      applicationId: application._id,
    });
  } catch (error) {
    return next(error);
  }
};

export const lookupPublicStudent = async (req, res, next) => {
  try {
    const school = await getSchoolForPublic(req.params.slug);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }
    const rollNumber = String(req.body.rollNumber || "").trim();
    const classId = String(req.body.classId || "");
    const dateOfBirth = String(req.body.dateOfBirth || "").slice(0, 10);
    if (
      !rollNumber ||
      rollNumber.length > 50 ||
      !mongoose.isValidObjectId(classId) ||
      !startOfDay(dateOfBirth) ||
      Number.isNaN(startOfDay(dateOfBirth).getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Roll/admission number and date of birth are required",
      });
    }

    const birthStart = startOfDay(dateOfBirth);
    const birthEnd = new Date(birthStart);
    birthEnd.setUTCDate(birthEnd.getUTCDate() + 1);
    const student = await Student.findOne({
      schoolId: school._id,
      classId,
      isActive: true,
      $or: [{ rollNumber }, { admissionNumber: rollNumber }],
      dateOfBirth: { $gte: birthStart, $lt: birthEnd },
    })
      .select("_id name rollNumber admissionNumber classId")
      .populate("classId", "name section")
      .lean();
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student could not be verified. Check the school, roll number and date of birth.",
      });
    }

    return res.status(200).json({
      success: true,
      student: {
        id: student._id,
        name: student.name,
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber,
        classId: student.classId?._id,
        className: student.classId?.name,
        section: student.classId?.section,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const submitPublicLeaveRequest = async (req, res, next) => {
  try {
    const school = await getSchoolForPublic(req.params.slug);
    if (!school) {
      return res.status(404).json({
        success: false,
        message: "School not found",
      });
    }
    const rollNumber = String(req.body.rollNumber || "").trim();
    const classId = String(req.body.classId || "");
    const dateOfBirth = String(req.body.dateOfBirth || "").slice(0, 10);
    const fromDateValue = String(req.body.fromDate || "").slice(0, 10);
    const toDateValue = String(req.body.toDate || "").slice(0, 10);
    const reason = String(req.body.reason || "").trim();
    const guardianPhone = String(req.body.guardianPhone || "").trim();
    if (
      !rollNumber ||
      rollNumber.length > 50 ||
      !mongoose.isValidObjectId(classId) ||
      !startOfDay(dateOfBirth) ||
      !startOfDay(fromDateValue) ||
      !startOfDay(toDateValue) ||
      !reason ||
      reason.length > 1000 ||
      !/^\+?[0-9 -]{7,16}$/.test(guardianPhone)
    ) {
      return res.status(400).json({
        success: false,
        message: "Student verification, leave dates, reason and guardian phone are required",
      });
    }

    const [fromDate, toDate] = [startOfDay(fromDateValue), startOfDay(toDateValue)];
    const birthStart = startOfDay(dateOfBirth);
    const birthEnd = new Date(birthStart);
    birthEnd.setUTCDate(birthEnd.getUTCDate() + 1);
    if (
      [fromDate, toDate, birthStart].some((date) => !date) ||
      fromDate < startOfDay(new Date().toISOString().slice(0, 10)) ||
      toDate < fromDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Leave dates must be valid and the end date must not be before the start date",
      });
    }

    const student = await Student.findOne({
      schoolId: school._id,
      classId,
      isActive: true,
      $or: [{ rollNumber }, { admissionNumber: rollNumber }],
      dateOfBirth: { $gte: birthStart, $lt: birthEnd },
    }).select("_id classId");
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student could not be verified. Check the school, roll number and date of birth.",
      });
    }

    const overlap = await StudentLeaveRequest.exists({
      schoolId: school._id,
      studentId: student._id,
      status: "Pending",
      fromDate: { $lte: toDate },
      toDate: { $gte: fromDate },
    });
    if (overlap) {
      return res.status(409).json({
        success: false,
        message: "A pending leave request already covers these dates",
      });
    }
    const request = await StudentLeaveRequest.create({
      schoolId: school._id,
      studentId: student._id,
      classId: student.classId,
      fromDate,
      toDate,
      reason,
      guardianPhone,
    });
    return res.status(201).json({
      success: true,
      message: "Leave request submitted for approval",
      requestId: request._id,
    });
  } catch (error) {
    return next(error);
  }
};

export const listLeaveRequests = async (req, res, next) => {

  try {
     
    const schoolId = req.user.schoolId._id;
    const admin = getRoleName(req.user.roleId) === "Admin";
    const classIds = admin
      ? null
      : await getClassTeacherAccessScope(req.user);
    if (classIds && !classIds.length) {
      return res.status(200).json({ success: true, requests: [] });
    }
    const filter = { schoolId };
    if (classIds) filter.classId = { $in: classIds };
    if (req.query.status && ["Pending", "Approved", "Rejected"].includes(req.query.status)) {
      filter.status = req.query.status;
    }
    const requests = await StudentLeaveRequest.find(filter)
      .populate("studentId", "name rollNumber admissionNumber")
      .populate("classId", "name section classTeacherId")
      .populate("reviewedBy", "name")
      .sort({ fromDate: 1, createdAt: -1 })
      .lean();
    return res.status(200).json({ success: true, requests });
  } catch (error) {
    return next(error);
  }
};

export const reviewLeaveRequest = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.requestId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave request",
      });
    }
    const schoolId = req.user.schoolId._id;
    const request = await StudentLeaveRequest.findOne({
      _id: req.params.requestId,
      schoolId,
      status: "Pending",
    }).select("classId");
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Pending leave request not found",
      });
    }

    const admin = getRoleName(req.user.roleId) === "Admin";
    if (!admin) {
      const classIds = await getClassTeacherAccessScope(req.user);
      const classTeacherAssigned =
        classIds.some((id) => String(id) === String(request.classId));
      if (!classTeacherAssigned) {
        return res.status(403).json({
          success: false,
          message:
            "Only the class teacher assigned to this class or a school admin can review this leave",
        });
      }
    }

    const { status, reviewNote } = req.body;
    if (!["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Approved or Rejected",
      });
    }
    const updated = await StudentLeaveRequest.findOneAndUpdate(
      { _id: request._id, schoolId, status: "Pending" },
      {
        $set: {
          status,
          reviewedBy: req.user._id,
          reviewedAt: new Date(),
          reviewNote: typeof reviewNote === "string" ? reviewNote.trim() : "",
        },
      },
      { new: true },
    )
      .populate("studentId", "name rollNumber email admissionNumber")
      .populate("classId", "name section")
      .populate("reviewedBy", "name");
    if (!updated) {
      return res.status(409).json({
        success: false,
        message: "This leave request has already been reviewed",
      });
    }
    let notificationSent = false;
    if (updated.studentId?.email) {
      const statusLabel =
        status === "Approved" ? "approved" : "rejected";
      const color = status === "Approved" ? "#16a34a" : "#dc2626";
      const studentName = escapeHtml(updated.studentId.name || "Student");
      const rollNumber = escapeHtml(
        updated.studentId.rollNumber || updated.studentId.admissionNumber || "N/A",
      );
      const className = escapeHtml(
        `${updated.classId?.name || ""} ${updated.classId?.section || ""}`.trim(),
      );
      const fromDate = escapeHtml(
        new Date(updated.fromDate).toLocaleDateString("en-IN"),
      );
      const toDate = escapeHtml(
        new Date(updated.toDate).toLocaleDateString("en-IN"),
      );
      try {
        await sendEmail({
          to: updated.studentId.email,
          subject: `Your leave request has been ${statusLabel}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
              <h2 style="color: ${color};">Leave request ${statusLabel}</h2>
              <p>Dear <strong>${studentName}</strong>,</p>
              <p>Your leave request has been <strong style="color: ${color};">${statusLabel}</strong> by the school.</p>
              <p>Student number: ${rollNumber}<br />
              Class: ${className}<br />
              From: ${fromDate}<br />
              To: ${toDate}</p>
              <p>Regards,<br />School Administration</p>
            </div>
          `,
        });
        notificationSent = true;
      } catch (emailError) {
        console.error(
          `Leave review email failed for request ${updated._id}:`,
          emailError,
        );
      }
    }
    return res.status(200).json({
      success: true,
      request: updated,
      notificationSent,
    });
  } catch (error) {
    return next(error);
  }
};

export const listAdmissionApplications = async (req, res, next) => {
  try {
    const applications = await AdmissionApplication.find({
      schoolId: req.user.schoolId._id,
    })
      .populate("studentId", "name admissionNumber rollNumber")
      .populate("reviewedBy", "name")
      .sort({ createdAt: -1 })
      .lean();
    const classes = await Class.find({
      schoolId: req.user.schoolId._id,
      isActive: true,
    })
      .select("name section")
      .sort({ name: 1, section: 1 })
      .lean();
    return res.status(200).json({ success: true, applications, classes });
  } catch (error) {
    return next(error);
  }
};

export const getClassTeacherAssignments = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId._id;
    const [classes, teachers] = await Promise.all([
      Class.find({ schoolId, isActive: true })
        .populate({
          path: "classTeacherId",
          select: "_id employeeId designation userId",
          populate: { path: "userId", select: "name email" },
        })
        .select("_id name section classTeacherId")
        .sort({ name: 1, section: 1 })
        .lean(),
      Teacher.find({ schoolId, isActive: true })
        .populate("userId", "name email")
        .select("_id employeeId designation userId")
        .sort({ employeeId: 1 })
        .lean(),
    ]);
    return res.status(200).json({ success: true, classes, teachers });
  } catch (error) {
    return next(error);
  }
};

export const assignClassTeacher = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { teacherId } = req.body;
    if (
      !mongoose.isValidObjectId(classId) ||
      (teacherId && !mongoose.isValidObjectId(teacherId))
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid class and teacher are required",
      });
    }
    const schoolId = req.user.schoolId._id;
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
    if (teacherId) {
      const teacher = await Teacher.findOne({
        _id: teacherId,
        schoolId,
        isActive: true,
      }).select("_id");
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Teacher not found in this school",
        });
      }
    }
    await Class.updateOne(
      { _id: classId, schoolId },
      { $set: { classTeacherId: teacherId || null } },
    );
    return res.status(200).json({
      success: true,
      message: teacherId
        ? "Class teacher assigned successfully"
        : "Class teacher assignment removed",
    });
  } catch (error) {
    return next(error);
  }
};

export const reviewAdmissionApplication = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.applicationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admission application",
      });
    }
    const schoolId = req.user.schoolId._id;
    const { status, classId, admissionNumber, rollNumber, reviewNote } =
      req.body;
    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Accepted or Rejected",
      });
    }
    if (status === "Rejected") {
      const rejected = await AdmissionApplication.findOneAndUpdate(
        {
          _id: req.params.applicationId,
          schoolId,
          status: "Pending",
        },
        {
          $set: {
            status: "Rejected",
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
            reviewNote: typeof reviewNote === "string" ? reviewNote.trim() : "",
          },
        },
        { new: true },
      );
      if (!rejected) {
        return res.status(404).json({
          success: false,
          message: "Pending admission application not found",
        });
      }
      return res.status(200).json({ success: true, application: rejected });
    }

    if (
      !mongoose.isValidObjectId(classId) ||
      typeof admissionNumber !== "string" ||
      !admissionNumber.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Select a class and assign an admission number to accept",
      });
    }
    const schoolClass = await Class.findOne({
      _id: classId,
      schoolId,
      isActive: true,
    }).select("_id name");
    if (!schoolClass) {
      return res.status(400).json({
        success: false,
        message: "Selected class is not available",
      });
    }
    const claimed = await AdmissionApplication.findOneAndUpdate(
      {
        _id: req.params.applicationId,
        schoolId,
        status: "Pending",
      },
      { $set: { status: "Reviewing" } },
      { new: true },
    );
    if (!claimed) {
      return res.status(404).json({
        success: false,
        message: "Pending admission application not found",
      });
    }
    let student;
    let usageReservation;
    try {
      usageReservation = await reservePlanUsage(schoolId, "student");
      student = await Student.create({
        schoolId,
        classId: schoolClass._id,
        name: claimed.applicantName,
        dateOfBirth: claimed.dateOfBirth,
        gender: claimed.gender,
        admissionNumber: admissionNumber.trim(),
        rollNumber:
          typeof rollNumber === "string" ? rollNumber.trim() || undefined : undefined,
        email: claimed.email,
        guardianName: claimed.guardianName,
        guardianPhone: claimed.guardianPhone,
        address: claimed.address,
      });
      const accepted = await AdmissionApplication.findOneAndUpdate(
        { _id: claimed._id, status: "Reviewing" },
        {
          $set: {
            status: "Accepted",
            reviewedBy: req.user._id,
            reviewedAt: new Date(),
            reviewNote: typeof reviewNote === "string" ? reviewNote.trim() : "",
            studentId: student._id,
          },
        },
        { new: true },
      );
      if (!accepted) {
        throw new AppError("Admission application changed during review", 409);
      }
      return res.status(200).json({
        success: true,
        application: accepted,
        student,
      });
    } catch (error) {
      let studentRemains = Boolean(student);
      if (student) {
        try {
          await Student.deleteOne({ _id: student._id, schoolId });
          studentRemains = false;
        } catch (cleanupError) {
          console.error(
            `Failed to remove partial admission student ${student._id}:`,
            cleanupError,
          );
        }
      }
      if (usageReservation && !studentRemains) {
        try {
          await releasePlanUsage(usageReservation);
        } catch (cleanupError) {
          console.error("Could not release failed admission capacity reservation:", cleanupError);
        }
      }
      try {
        await AdmissionApplication.updateOne(
          { _id: claimed._id, status: "Reviewing" },
          { $set: { status: "Pending" } },
        );
      } catch (cleanupError) {
        console.error(
          `Failed to restore admission application ${claimed._id}:`,
          cleanupError,
        );
      }
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "That admission number or roll number is already in use",
        });
      }
      if (error.statusCode) return next(error);
      throw error;
    }
  } catch (error) {
    return next(error);
  }
};
