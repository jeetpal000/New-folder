import { Permission } from "../models/Permission.js";

export const permissions = [
  {
    key: "student.view",
    module: "student",
    action: "view",
    description: "View students",
  },
  {
    key: "student.create",
    module: "student",
    action: "create",
    description: "Create student",
  },
  {
    key: "student.update",
    module: "student",
    action: "update",
    description: "Update student",
  },
  {
    key: "student.delete",
    module: "student",
    action: "delete",
    description: "Delete student",
  },

  {
    key: "teacher.view",
    module: "teacher",
    action: "view",
    description: "View teachers",
  },
  {
    key: "teacher.create",
    module: "teacher",
    action: "create",
    description: "Create teacher",
  },
  {
    key: "teacher.update",
    module: "teacher",
    action: "update",
    description: "Update teacher",
  },
  {
    key: "teacher.delete",
    module: "teacher",
    action: "delete",
    description: "Delete teacher",
  },

  {
    key: "attendance.view",
    module: "attendance",
    action: "view",
    description: "View attendance",
  },
  {
    key: "attendance.mark",
    module: "attendance",
    action: "mark",
    description: "Mark attendance",
  },
  {
    key: "attendance.update",
    module: "attendance",
    action: "update",
    description: "Update attendance",
  },
  {
    key: "subject.view",
    module: "subject",
    action: "view",
    description: "View class subjects",
  },
  {
    key: "subject.create",
    module: "subject",
    action: "create",
    description: "Add subjects to assigned classes",
  },
  {
    key: "subject.delete",
    module: "subject",
    action: "delete",
    description: "Remove subjects from assigned classes",
  },
  {
    key: "fees.view",
    module: "fees",
    action: "view",
    description: "View school fee accounts",
  },
  {
    key: "fees.account.create",
    module: "fees",
    action: "create",
    description: "Create student fee accounts",
  },
  {
    key: "fees.payment.record",
    module: "fees",
    action: "record",
    description: "Record fee payments",
  },
  {
    key: "assessment.view",
    module: "assessment",
    action: "view",
    description: "View class assessments and results",
  },
  {
    key: "assessment.create",
    module: "assessment",
    action: "create",
    description: "Create class assessments",
  },
  {
    key: "assessment.mark",
    module: "assessment",
    action: "mark",
    description: "Enter and update draft assessment results",
  },
  {
    key: "assessment.publish",
    module: "assessment",
    action: "publish",
    description: "Publish final assessment results",
  },

  {
    key: "report.view",
    module: "report",
    action: "view",
    description: "View reports",
  },
  {
    key: "report.export",
    module: "report",
    action: "export",
    description: "Export reports",
  },
  {
    key: "dashboard.view",
    module: "dashboard",
    action: "view",
    description: "View the role-specific dashboard",
  },
];

export const seedPermissions = async () => {
  for (const permission of permissions) {
    await Permission.updateOne(
      { key: permission.key },
      {
        $set: { ...permission, name: permission.key },
      },
      {
        upsert: true,
      }
    );
  }

};