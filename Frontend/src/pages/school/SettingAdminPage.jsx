import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  LucideSettings,
  Mail,
  Moon,
  NotebookPen,
  NotebookTabs,
  Palette,
  Plus,
  Save,
  School,
  Settings2,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  User,
  X,
} from "lucide-react";

import FloatingParticles from "../../components/FloatingParticles/FloatingPartcles";
import { useAuthStore } from "../../store/authStore";
import { Input, Select, ThemeOption, themes } from "../../components/UI";
import { useThemeStore } from "../../store/themeStore";
import { api } from "../../services/api";
import AlertPage from "../../components/AlertPage";

const Settings = () => {
  useEffect(() => {
    document.title = "NexaManage | Settings";
  }, []);

  const user = useAuthStore((state) => state.user);
  const isAdmin =
    (user?.roleId?.role || user?.roleId?.name) === "Admin";

  const [activeSection, setActiveSection] = useState(() =>
    isAdmin ? "school" : "appearance",
  );
  useEffect(() => {
    if (!isAdmin && ["school", "subject"].includes(activeSection)) {
      setActiveSection("appearance");
    }
  }, [activeSection, isAdmin]);

  const [schoolData, setSchoolData] = useState({
    schoolName: user?.schoolId?.schoolName || "JEET PAL2",
    schoolCode: user?.schoolId?.schoolCode || "SCH-8F9EB176",
    schoolEmail: user?.schoolId?.schoolEmail || "chandrajeetcare2019@gmail.com",
    schoolPhone: user?.schoolId?.schoolPhone || "0872615649",
    board: user?.schoolId?.board || "CBSE",
    academicSession: user?.schoolId?.academicSession || "2026-27",
    principalName: user?.schoolId?.principalName || "Atul",
    affiliationNumber: user?.schoolId?.affiliationNumber || "123cbse",
    establishedYear: user?.schoolId?.establishedYear || 2017,
    address: user?.schoolId?.address || "kamasin",
    city: user?.schoolId?.city || "Jaunpur",
    state: user?.schoolId?.state || "Uttar Pradesh",
    pincode: user?.schoolId?.pincode || "222165",
  });

  const [accountData, setAccountData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [notifications, setNotifications] = useState({
    attendance: true,
    fees: true,
    admissions: true,
    announcements: true,
    email: true,
    sms: false,
  });

  const [appearance, setAppearance] = useState("system");

  const [saved, setSaved] = useState(false);

  const handleSchoolChange = (field, value) => {
    setSchoolData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAccountChange = (field, value) => {
    setAccountData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-(--primary-soft-hover)">
      <FloatingParticles />

      <div className="relative z-10 mx-auto max-w-7xl space-y-6 ">
        {/* Header */}
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <LucideSettings size={21} className="text-(--primary)" />
            Settings
          </h1>

          <p className="mt-1 text-sm text-(--text-muted)">
            {isAdmin
              ? "Manage school administration and your personal preferences."
              : "Manage your account, security, notifications and appearance."}
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <SettingsSidebar
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            isAdmin={isAdmin}
          />

          {/* Content */}
          <div className="min-w-0 ">
            {isAdmin && activeSection === "school" && (
              <SchoolSettings
                schoolData={schoolData}
                onChange={handleSchoolChange}
                onSave={handleSave}
                saved={saved}
              />
            )}

            {activeSection === "account" && (
              <AccountSettings
                accountData={accountData}
                onChange={handleAccountChange}
                onSave={handleSave}
                saved={saved}
              />
            )}
            {isAdmin && activeSection === "subject" && (
              <AddSubjectSettings />
            )}

            {activeSection === "security" && (
              <SecuritySettings onSave={handleSave} saved={saved} />
            )}

            {activeSection === "notifications" && (
              <NotificationSettings
                notifications={notifications}
                setNotifications={setNotifications}
                onSave={handleSave}
                saved={saved}
              />
            )}

            {activeSection === "appearance" && (
              <AppearanceSettings
                appearance={appearance}
                setAppearance={setAppearance}
                onSave={handleSave}
                saved={saved}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Settings Sidebar                                                            */
/* -------------------------------------------------------------------------- */

const SettingsSidebar = ({ activeSection, setActiveSection, isAdmin }) => {
  const personalItems = [
    {
      id: "account",
      label: "My Account",
      icon: User,
    },
    {
      id: "security",
      label: "Security",
      icon: ShieldCheck,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: Palette,
    },
  ];
  const adminItems = [
    {
      id: "school",
      label: "School Profile",
      icon: School,
    },
    {
      id: "subject",
      label: "Add Subject & Classes",
      icon: NotebookTabs,
    },
  ];
  const items = isAdmin
    ? [...adminItems, ...personalItems]
    : personalItems;

  return (
    <div className="h-fit overflow-x-auto scrollbar-none rounded-2xl border border-(--border) bg-linear-125 backdrop-blur-sm from-(--card-gradient-1)/50 to-(--card-gradient-2)/10 p-2 shadow-sm">
      <div className="mb-2 hidden px-3 py-2 lg:block">
        <p className="text-xs font-semibold uppercase tracking-wider text-(--text-muted)">
          Settings
        </p>
      </div>

      <div className="flex gap-1 lg:block lg:overflow-hidden">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activeSection === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex min-w-max items-center gap-3 rounded-xl px-2 py-2.5 text-sm font-medium transition lg:mb-1 lg:w-full ${
                active
                  ? "bg-(--primary-soft-hover) text-(--primary)"
                  : " hover:bg-(--glass-bg-hover) hover:text-(--text)"
              }`}
            >
              <Icon size={18} className="shrink-0" />

              <span className="">{item.label}</span>

              <ChevronRight
                size={15}
                className={`ml-auto hidden lg:block shrink-0 ${
                  active ? "opacity-100" : "opacity-0"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* School Settings                                                             */
/* -------------------------------------------------------------------------- */

const SchoolSettings = ({ schoolData, onChange, onSave, saved }) => {
  return (
    <SettingsCard
      icon={School}
      title="School Profile"
      description="Update your school's basic information and contact details."
    >
      <SectionTitle icon={Building2} title="Basic Information" />

      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsInput
          label="School Name"
          value={schoolData.schoolName}
          onChange={(e) => onChange("schoolName", e.target.value)}
        />

        <SettingsInput
          label="School Code"
          value={schoolData.schoolCode}
          disabled
          hint="School code cannot be changed."
        />

        <SettingsInput
          label="School Email"
          type="email"
          value={schoolData.schoolEmail}
          onChange={(e) => onChange("schoolEmail", e.target.value)}
        />

        <SettingsInput
          label="School Phone"
          value={schoolData.schoolPhone}
          onChange={(e) => onChange("schoolPhone", e.target.value)}
        />

        <SettingsInput
          label="Board"
          value={schoolData.board}
          onChange={(e) => onChange("board", e.target.value)}
        />

        <SettingsInput
          label="Academic Session"
          value={schoolData.academicSession}
          onChange={(e) => onChange("academicSession", e.target.value)}
        />
      </div>

      <SectionTitle icon={School} title="Academic Information" />

      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsInput
          label="Principal Name"
          value={schoolData.principalName}
          onChange={(e) => onChange("principalName", e.target.value)}
        />

        <SettingsInput
          label="Affiliation Number"
          value={schoolData.affiliationNumber}
          onChange={(e) => onChange("affiliationNumber", e.target.value)}
        />

        <SettingsInput
          label="Established Year"
          type="number"
          value={schoolData.establishedYear}
          onChange={(e) => onChange("establishedYear", e.target.value)}
        />
      </div>

      <SectionTitle icon={Building2} title="Address" />

      <div className="space-y-4">
        <SettingsInput
          label="Address"
          value={schoolData.address}
          onChange={(e) => onChange("address", e.target.value)}
        />

        <div className="grid gap-4 sm:grid-cols-3">
          <SettingsInput
            label="City"
            value={schoolData.city}
            onChange={(e) => onChange("city", e.target.value)}
          />

          <SettingsInput
            label="State"
            value={schoolData.state}
            onChange={(e) => onChange("state", e.target.value)}
          />

          <SettingsInput
            label="Pincode"
            value={schoolData.pincode}
            onChange={(e) => onChange("pincode", e.target.value)}
          />
        </div>
      </div>

      <SaveBar onSave={onSave} saved={saved} />
    </SettingsCard>
  );
};

/* -------------------------------------------------------------------------- */
/* Account Settings                                                            */
/* -------------------------------------------------------------------------- */

const AccountSettings = ({ accountData, onChange, onSave, saved }) => {
  return (
    <SettingsCard
      icon={User}
      title="My Account"
      description="Manage your personal profile information."
    >
      <div className="flex items-center gap-4 rounded-xl border border-(--border) bg-linear-135 backdrop-blur-sm from-(--card-gradient-2)/70 via-(--card-gradient-1)/30 to-(--card-gradient-2)/70 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--primary-soft) text-lg font-bold text-(--primary)]">
          {accountData.name
            ?.split(" ")
            .map((item) => item[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "U"}
        </div>

        <div>
          <p className="font-semibold text-(--foreground)]">
            {accountData.name || "User"}
          </p>

          <p className="text-sm text-(--muted-foreground)]">
            School Administrator
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SettingsInput
          label="Full Name"
          value={accountData.name}
          onChange={(e) => onChange("name", e.target.value)}
        />

        <SettingsInput
          label="Email"
          type="email"
          value={accountData.email}
          disabled
          hint="Contact administrator to change email."
        />

        <SettingsInput
          label="Phone"
          value={accountData.phone}
          onChange={(e) => onChange("phone", e.target.value)}
        />
      </div>

      <SaveBar onSave={onSave} saved={saved} />
    </SettingsCard>
  );
};

/* -------------------------------------------------------------------------- */
/* Security                                                                    */
/* -------------------------------------------------------------------------- */

const SecuritySettings = ({ onSave, saved }) => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <SettingsCard
      icon={ShieldCheck}
      title="Security"
      description="Manage your password and account security."
    >
      <SectionTitle icon={KeyRound} title="Change Password" />

      <div className="max-w-xl space-y-4">
        <PasswordInput
          label="Current Password"
          show={showCurrent}
          setShow={setShowCurrent}
        />

        <PasswordInput
          label="New Password"
          show={showNew}
          setShow={setShowNew}
        />

        <PasswordInput
          label="Confirm New Password"
          show={showConfirm}
          setShow={setShowConfirm}
        />
      </div>

      <div className="rounded-xl border border-(--border) bg-linear-125 backdrop-blur-sm from-(--card-gradient-1)/50 to-(--card-gradient-2)/10 p-4">
        <div className="flex gap-3">
          <Lock size={20} className="mt-0.5 shrink-0 text-(--primary)]" />

          <div>
            <p className="text-sm font-semibold text-(--foreground)]">
              Password security
            </p>

            <p className="mt-1 text-xs leading-5 text-(--muted-foreground)]">
              Use at least 8 characters with a combination of uppercase letters,
              lowercase letters, numbers and special characters.
            </p>
          </div>
        </div>
      </div>

      <SectionTitle icon={Smartphone} title="Active Sessions" />

      <div className="flex items-center justify-between rounded-xl border border-(--border) p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-(--primary-soft) p-2.5 text-(--primary)">
            <Smartphone size={19} />
          </div>

          <div>
            <p className="text-sm font-semibold text-(--text)">
              Current Device
            </p>

            <p className="text-xs text-(--text-muted)">
              This device • Active now
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
          Active
        </span>
      </div>

      <button className="text-sm font-medium text-red-500 hover:underline">
        Sign out from all other devices
      </button>

      <SaveBar onSave={onSave} saved={saved} />
    </SettingsCard>
  );
};

/* -------------------------------------------------------------------------- */
/* Notifications                                                               */
/* -------------------------------------------------------------------------- */

const NotificationSettings = ({
  notifications,
  setNotifications,
  onSave,
  saved,
}) => {
  const toggle = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <SettingsCard
      icon={Bell}
      title="Notifications"
      description="Choose which notifications you want to receive."
    >
      <SectionTitle icon={Bell} title="School Notifications" />

      <div className="divide-y divide-(--border) rounded-xl border border-(--border)">
        <ToggleRow
          title="Attendance"
          description="Get notified about attendance updates."
          enabled={notifications.attendance}
          onToggle={() => toggle("attendance")}
        />

        <ToggleRow
          title="Fee Collection"
          description="Receive notifications about fee payments and dues."
          enabled={notifications.fees}
          onToggle={() => toggle("fees")}
        />

        <ToggleRow
          title="Admissions"
          description="Get updates about new student admissions."
          enabled={notifications.admissions}
          onToggle={() => toggle("admissions")}
        />

        <ToggleRow
          title="Announcements"
          description="Receive important school announcements."
          enabled={notifications.announcements}
          onToggle={() => toggle("announcements")}
        />
      </div>

      <SectionTitle icon={Mail} title="Notification Channels" />

      <div className="divide-y divide-(--border) rounded-xl border border-(--border)">
        <ToggleRow
          title="Email Notifications"
          description="Receive notifications through email."
          enabled={notifications.email}
          onToggle={() => toggle("email")}
        />

        <ToggleRow
          title="SMS Notifications"
          description="Receive important alerts through SMS."
          enabled={notifications.sms}
          onToggle={() => toggle("sms")}
        />
      </div>

      <SaveBar onSave={onSave} saved={saved} />
    </SettingsCard>
  );
};

/* -------------------------------------------------------------------------- */
/* Appearance                                                                  */
/* -------------------------------------------------------------------------- */

const AppearanceSettings = ({ onSave, saved }) => {
  const { theme, setTheme } = useThemeStore();

  const changeTheme = (nextTheme) => {
    setTheme(nextTheme);
  };

  return (
    <SettingsCard
      icon={Palette}
      title="Appearance"
      description="Customize how NexaManage looks on your device."
    >
      <SectionTitle icon={Palette} title="Theme" />

      <div className="grid gap-4 sm:grid-cols-3">
        {themes.map((item) => (
          <ThemeOption
            key={item.id}
            active={theme === item.id}
            title={item.title}
            text={item.text}
            swatch={item.swatch}
            onClick={() => changeTheme(item.id)}
          />
        ))}
      </div>

      <SaveBar onSave={onSave} saved={saved} />
    </SettingsCard>
  );
};

const AddSubjectSettings = () => {
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [course, setCourse] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [savedSubjects, setSavedSubjects] = useState([]);
  const [pendingSubjects, setPendingSubjects] = useState([]);
  const [showAlertPage, setShowAlertPage] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const getAllClasses = async () => {
    try {
      const response = await api.get("/get-classes");
      const records = response.data.classes || [];
      setClasses(records);
      setSelectedClassId((current) =>
        records.some((record) => record._id === current)
          ? current
          : records[0]?._id || "",
      );
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Could not load classes.");
    }
  };

  const getAllSubject = async (classId = selectedClassId) => {
    if (!classId) {
      setSavedSubjects([]);
      return;
    }
    try {
      const response = await api.get("/get-subject", { params: { classId } });
      setSavedSubjects(
        (response.data.getSubject || []).map((item) => ({
          id: item._id,
          name: item.name,
        })),
      );
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Could not load subjects.");
    }
  };

  useEffect(() => {
    getAllClasses();
  }, []);

  useEffect(() => {
    setPendingSubjects([]);
    getAllSubject(selectedClassId);
  }, [selectedClassId]);

  const handleAddClass = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    try {
      const response = await api.post("/add-class", {
        name: className,
        section,
        course,
      });
      await getAllClasses();
      setSelectedClassId(response.data.class._id);
      setClassName("");
      setSection("");
      setCourse("");
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Could not create class.");
    }
  };

  const handleQueueSubject = (event) => {
    event.preventDefault();
    const name = subjectName.trim();
    if (!name) return;
    if (
      savedSubjects.some((subject) => subject.name.toLowerCase() === name.toLowerCase()) ||
      pendingSubjects.some((subject) => subject.toLowerCase() === name.toLowerCase())
    ) {
      setErrorMessage("This subject is already added to the selected class.");
      return;
    }
    setErrorMessage("");
    setPendingSubjects((current) => [...current, name]);
    setSubjectName("");
  };

  const handleSaveSubjects = async () => {
    if (!selectedClassId || pendingSubjects.length === 0) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      await api.post(
        "/add-subject",
        {
          classId: selectedClassId,
          subjects: pendingSubjects,
        },
      );
      setPendingSubjects([]);
      await getAllSubject(selectedClassId);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Could not save subjects.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      await api.delete(`/delete-subject/${id}`, {
        params: { classId: selectedClassId },
      });
      await getAllSubject(selectedClassId);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Could not remove subject.");
    } finally {
      setShowAlertPage(false);
    }
  };

  return (
    <SettingsCard
      icon={NotebookTabs}
      title="Classes & Subjects"
      description="Create classes by section and course, then add subjects to each class."
    >
      <SectionTitle icon={School} title="1. Create class by section and course" />
      <form onSubmit={handleAddClass} className="grid gap-3 sm:grid-cols-4">
        <Input
          required
          value={className}
          placeholder="Class (e.g. Class 9)"
          onChange={(event) => setClassName(event.target.value)}
        />
        <Input
          required
          value={section}
          placeholder="Section (e.g. A)"
          onChange={(event) => setSection(event.target.value)}
        />
        <Input
          required
          value={course}
          placeholder="Course / stream (e.g. Science)"
          onChange={(event) => setCourse(event.target.value)}
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--primary) px-4 py-2.5 text-sm font-medium text-white"
        >
          <Plus size={17} /> Create Class
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {classes.map((record) => (
          <button
            type="button"
            key={record._id}
            onClick={() => setSelectedClassId(record._id)}
            className={`rounded-lg border px-3 py-2 text-left text-sm ${
              selectedClassId === record._id
                ? "border-(--primary) bg-(--primary-soft) text-(--primary)"
                : "border-(--border) bg-(--primary-soft-hover)"
            }`}
          >
            <span className="font-semibold">{record.name} - {record.section}</span>
            <span className="ml-2 text-xs text-(--text-muted)">{record.course}</span>
          </button>
        ))}
        {classes.length === 0 && (
          <p className="text-sm text-(--text-muted)">Create a class to start adding subjects.</p>
        )}
      </div>

      <SectionTitle icon={NotebookPen} title="2. Add subjects to selected class" />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Select
          value={selectedClassId}
          onChange={(event) => setSelectedClassId(event.target.value)}
          disabled={classes.length === 0}
          className="rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5 text-sm"
        >
          <option value="">Select a class</option>
          {classes.map((record) => (
            <option key={record._id} value={record._id}>
              {record.name} - {record.section} ({record.course})
            </option>
          ))}
        </Select>
      </div>
      {selectedClassId && (
        <form onSubmit={handleQueueSubject} className="flex gap-2">
          <Input
            value={subjectName}
            placeholder="Subject name"
            onChange={(event) => setSubjectName(event.target.value)}
          />
          <button
            type="submit"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-(--primary-soft) px-4 text-sm font-medium text-(--primary)"
          >
            <Plus size={17} /> Add
          </button>
        </form>
      )}

      {pendingSubjects.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium">Subjects to save</p>
          <ul className="flex flex-wrap gap-2">
            {pendingSubjects.map((name) => (
              <li key={name} className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--primary-soft) px-3 py-2 text-sm">
                {name}
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() => setPendingSubjects((items) => items.filter((item) => item !== name))}
                >
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveSubjects}
            className="rounded-xl bg-(--primary) px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save Subjects"}
          </button>
        </div>
      )}

      <SectionTitle icon={Check} title="Subjects available for selected class" />
      <div className="mt-3">
        {!selectedClassId ? (
          <p className="text-sm text-(--text-muted)">Select a class to view its subjects.</p>
        ) : savedSubjects.length === 0 ? (
          <p className="text-sm text-(--text-muted)">No subjects added to this class yet.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {savedSubjects.map((subject) => (
              <li
                key={subject.id}
                className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--primary-soft) px-3 py-2"
              >
                <span className="text-sm">{subject.name}</span>
                <button
                  type="button"
                  aria-label={`Remove ${subject.name} from class`}
                  className="rounded p-1 text-(--danger) hover:bg-(--danger)/10"
                  onClick={() => {
                    setSelectedSubjectId(subject.id);
                    setShowAlertPage(true);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      {showAlertPage && (
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-2xl flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAlertPage(false);
            }
          }}
        >
          <AlertPage
            title="Remove subject from this class?"
            description="This subject will no longer be available for this class."
            handleDeleteSubject={handleDeleteSubject}
            id={selectedSubjectId}
            setShowAlertPage={setShowAlertPage}
          />
        </div>
      )}
    </SettingsCard>
  );
};

/* -------------------------------------------------------------------------- */
/* Reusable Components                                                         */
/* -------------------------------------------------------------------------- */

const SettingsCard = ({ icon: Icon, title, description, children }) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-(--border) bg-linear-120 from-(--gradient-1) via-(--gradient-2) to-(--gradient-3) shadow-sm">
      <div className="border-b border-(--border) p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-(--primary-soft) p-2.5 text-(--primary)]">
            <Icon size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-(--text)">{title}</h2>

            <p className="mt-1 text-sm text-(--text-muted)">{description}</p>
          </div>
        </div>
      </div>

      <div className="space-y-7 p-5 sm:p-6">{children}</div>
    </div>
  );
};

const SectionTitle = ({ icon: Icon, title }) => {
  return (
    <div className="flex items-center gap-2 border-b border-(--border) pb-2">
      <Icon size={17} className="text-(--primary)" />

      <h3 className="text-sm font-semibold text-(--text)">{title}</h3>
    </div>
  );
};

const SettingsInput = ({
  label,
  placeholder,
  // icon: Icon,
  value,
  onChange,
  type = "text",
  disabled = false,
  hint,
}) => {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-(--text)">
        {label}
      </label>
      <div className="relative">
        {/* <Icon
          size={21}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-(--text-muted)"
        /> */}
        <Input
          type={type}
          placeholder={placeholder}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          className={`w-full rounded-xl border border-(--border) px-3 py-2.5 text-sm text-(--text) bg-(--primary-soft) outline-none transition ${
            disabled
              ? "cursor-not-allowed  opacity-60"
              : "focus:border-(--primary)]"
          }`}
        />
      </div>

      {hint && (
        <p className="mt-1 text-xs text-(--muted-foreground)]">{hint}</p>
      )}
    </div>
  );
};

const PasswordInput = ({ label, show, setShow }) => {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-(--text)">
        {label}
      </label>

      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          placeholder="••••••••"
          className="w-full rounded-xl border border-(--border) bg-(--primary-soft) px-3 py-2.5 pr-11 text-sm text-(--text) outline-none focus:border-(--primary)"
        />

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-(--muted-foreground)]"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

const ToggleRow = ({ title, description, enabled, onToggle }) => {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div>
        <p className="text-sm font-medium text-(--textol)">{title}</p>

        <p className="mt-0.5 text-xs text-(--text-muted)">{description}</p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full border border-(--border-focus) transition-all duration-300 ${
          enabled
            ? "bg-(--primary-soft)"
            : "bg-(--primary) dark:bg-(--text-muted)"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-(--primary) shadow-sm transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
};

const SaveBar = ({ onSave, saved }) => {
  return (
    <div className="flex flex-col gap-3 border-t border-(--border) pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-(--text-muted)">
        Changes are not saved until you click Save Changes.
      </p>

      <button
        onClick={onSave}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--primary) px-5 py-2.5 text-sm font-semibold text-(--surface) transition hover:opacity-90"
      >
        {saved ? (
          <>
            <Check size={17} />
            Saved
          </>
        ) : (
          <>
            <Save size={17} />
            Save Changes
          </>
        )}
      </button>
    </div>
  );
};

export default Settings;
