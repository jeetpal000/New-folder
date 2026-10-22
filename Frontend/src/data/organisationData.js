import {
  GraduationCap,
  Hospital,
  Library,
  ShoppingBag,
  UsersRound,
  Building2,
  ArrowRight,
} from "lucide-react";

export const managementTypes = [
  {
    id: "school",
    title: "School Management",
    shortTitle: "School",
    description:
      "Manage students, teachers, attendance, fees, admissions and academic records.",
    icon: GraduationCap,
    color: "blue",
    features: [
      "Student Management",
      "Teacher Management",
      "Attendance",
      "Fee Management",
      "Admissions",
      "Academic Records",
    ],
    roles: ["Admin", "Teacher", "Viewer"],
    route: "/create/school",
  },

  {
    id: "hospital",
    title: "Hospital Management",
    shortTitle: "Hospital",
    description:
      "Manage patients, doctors, appointments, staff and medical records efficiently.",
    icon: Hospital,
    color: "red",
    features: [
      "Patient Management",
      "Doctor Management",
      "Appointments",
      "Staff Management",
      "Medical Records",
      "Billing",
    ],
    roles: ["Admin", "Doctor", "Staff", "Viewer"],
    route: "/create/hospital",
  },

  {
    id: "library",
    title: "Library Management",
    shortTitle: "Library",
    description:
      "Manage books, members, issue-return records, fines and library inventory.",
    icon: Library,
    color: "purple",
    features: [
      "Book Management",
      "Member Management",
      "Issue & Return",
      "Due Dates",
      "Fine Management",
      "Inventory",
    ],
    roles: ["Admin", "Librarian", "Viewer"],
    route: "/create/library",
  },

  {
    id: "shop",
    title: "Shop Management",
    shortTitle: "Shop",
    description:
      "Manage products, inventory, customers, sales, purchases and business records.",
    icon: ShoppingBag,
    color: "green",
    features: [
      "Product Management",
      "Inventory",
      "Sales",
      "Purchases",
      "Customer Management",
      "Reports",
    ],
    roles: ["Admin", "Manager", "Staff"],
    route: "/create/shop",
  },

  {
    id: "employee",
    title: "Employee Management",
    shortTitle: "Employees",
    description:
      "Manage employees, attendance, departments, salaries, leave and performance.",
    icon: UsersRound,
    color: "orange",
    features: [
      "Employee Records",
      "Attendance",
      "Departments",
      "Leave Management",
      "Salary Management",
      "Performance",
    ],
    roles: ["Admin", "Manager", "Employee"],
    route: "/create/employee",
  },

  {
    id: "business",
    title: "Business Management",
    shortTitle: "Business",
    description:
      "Manage your organization, teams, tasks, records and day-to-day operations.",
    icon: Building2,
    color: "indigo",
    features: [
      "Team Management",
      "Task Management",
      "Reports",
      "Operations",
      "Records",
      "Analytics",
    ],
    roles: ["Admin", "Manager", "Staff"],
    route: "/create/business",
  },
];