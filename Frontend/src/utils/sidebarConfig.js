import {
  BookOpen,
  ClipboardPen,
  GraduationCap,
  Home,
  IndianRupee,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Settings,
  ShieldCheck,
  School,
  UserRound,
} from "lucide-react";

export const sidebarConfig = {
  common: [
    { label: "Overview", path: "/dashboard", icon: Home },
    { label: "Leave approvals", path: "/leave-approvals", icon: ClipboardCheck },
  ],
  school: [
    {
      label: "Attendance",
      path: "/attendance",
      icon: ClipboardPen,
      permission: "attendance.view",
      markPermission: "attendance.mark",
    },
    {
      label: "Teachers",
      path: "/teachers",
      icon: UserRound,
      permission: "teacher.view",
      createPermission: "teacher.create",
    },
    {
      label: "Students",
      path: "/students",
      icon: GraduationCap,
      permission: "student.view",
      createPermission: "student.create",
    },
    {
      label: "Fees handling",
      path: "/fees",
      icon: IndianRupee,
      permission: "fees.view",
    },
    {
      label: "Assessments",
      path: "/assessments",
      icon: BookOpen,
      permission: "assessment.view",
    },
  ],
  admin: [
    {
      label: "Subscription & billing",
      path: "/billing",
      icon: CreditCard,
    },
    {
      label: "Public school profile",
      path: "/public-profile-settings",
      icon: School,
    },
    {
      label: "Admissions",
      path: "/admission-applications",
      icon: ClipboardList,
    },
    {
      label: "Staff access",
      path: "/staff-access",
      icon: ShieldCheck,
    },
  ],
 
};
