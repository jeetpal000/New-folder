import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/school/Dashboard";
import Students from "./pages/school/Student";
import Teachers from "./pages/school/Teacher";
import PageNotFound from "./components/PageNotFound";
import CreatePage from "./pages/CreateWorkspace";
import ProtectedRoute from "./components/ProtectedRoute";
import Settings from "./pages/school/SettingAdminPage.jsx";
import AttendancePage from "./pages/school/Attendance.jsx";
import StaffAccess from "./pages/school/StaffAccess.jsx";
import PermissionRoute from "./components/PermissionRoute.jsx";
import Fees from "./pages/school/Fees.jsx";
import PublicSchoolProfile from "./pages/PublicSchoolProfile.jsx";
import LeaveApprovals from "./pages/school/LeaveApprovals.jsx";
import AdmissionApplications from "./pages/school/AdmissionApplications.jsx";
import PublicProfileSettings from "./pages/school/PublicProfileSettings.jsx";
import StudentDetailsPage from "./pages/school/StudentDetailsPage.jsx";
import StudentEditDetailsPage from "./pages/school/StudentEditDetailsPage.jsx";
import Assessments from "./pages/school/Assessments.jsx";
import Billing from "./pages/school/Billing.jsx";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/schools/:slug" element={<PublicSchoolProfile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create/organisation" element={<CreatePage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/students"
              element={
                <PermissionRoute
                  permission={["student.view", "student.create"]}
                >
                  <Students />
                </PermissionRoute>
              }
            />
            <Route
              path="/teachers"
              element={
                <PermissionRoute
                  permission={["teacher.view", "teacher.create"]}
                >
                  <Teachers />
                </PermissionRoute>
              }
            />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="/billing"
              element={
                <PermissionRoute adminOnly>
                  <Billing />
                </PermissionRoute>
              }
            />
            <Route path="/leave-approvals" element={<LeaveApprovals />} />
            <Route
              path="/assessments"
              element={
                <PermissionRoute permission="assessment.view">
                  <Assessments />
                </PermissionRoute>
              }
            />
            <Route
              path="/fees"
              element={
                <PermissionRoute permission="fees.view">
                  <Fees />
                </PermissionRoute>
              }
            />
            <Route
              path="/students/details/:id"
              element={
                <PermissionRoute adminOnly>
                  <StudentDetailsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/students/edit/:id"
              element={
                <PermissionRoute adminOnly>
                  <StudentEditDetailsPage />
                </PermissionRoute>
              }
            />
            <Route
              path="/admission-applications"
              element={
                <PermissionRoute adminOnly>
                  <AdmissionApplications />
                </PermissionRoute>
              }
            />
            <Route
              path="/public-profile-settings"
              element={
                <PermissionRoute adminOnly>
                  <PublicProfileSettings />
                </PermissionRoute>
              }
            />
            <Route
              path="/attendance"
              element={
                <PermissionRoute
                  permission={["attendance.view", "attendance.mark"]}
                >
                  <AttendancePage />
                </PermissionRoute>
              }
            />
            <Route
              path="/staff-access"
              element={
                <PermissionRoute adminOnly>
                  <StaffAccess />
                </PermissionRoute>
              }
            />
            {/*<Route path="/students/new" element={<StudentForm />} />
          <Route path="/students/:id/edit" element={<StudentForm edit />} />
          <Route path="/teachers/new" element={<TeacherForm />} />
          <Route path="/teachers/:id/edit" element={<TeacherForm edit />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} /> */}
          </Route>
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
