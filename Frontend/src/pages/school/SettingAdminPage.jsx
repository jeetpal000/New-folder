import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  ImagePlus,
  KeyRound,
  Laptop,
  Laptop2,
  Lock,
  LucideSettings,
  Mail,
  Moon,
  NotebookPen,
  NotebookTabs,
  Palette,
  Pencil,
  Plus,
  Save,
  School,
  Settings2,
  ShieldCheck,
  ShieldHalf,
  Smartphone,
  Sun,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";

import FloatingParticles from "../../components/FloatingParticles/FloatingPartcles";
import { useAuthStore } from "../../store/authStore";
import { Input, Select, ThemeOption, themes } from "../../components/UI";
import { useThemeStore } from "../../store/themeStore";
import { api } from "../../services/api";
import AlertPage from "../../components/AlertPage";

const getSchoolSettings = (school = {}) => ({
  schoolName: school.schoolName || "",
  schoolCode: school.schoolCode || "",
  schoolEmail: school.schoolEmail || "",
  schoolPhone: school.schoolPhone || "",
  board: school.board || "",
  academicSession: school.academicSession || "",
  principalName: school.principalName || "",
  affiliationNumber: school.affiliationNumber || "",
  establishedYear: school.establishedYear ?? "",
  address: school.address || "",
  city: school.city || "",
  state: school.state || "",
  pincode: school.pincode || "",
  schoolType: school.schoolType || "",
  logo: school.logo || "",
  bannerImage: school.bannerImage || "",
});

const Settings = () => {
  useEffect(() => {
    document.title = "NexaManage | Settings";
  }, []);

  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const isAdmin = (user?.roleId?.role || user?.roleId?.name) === "Admin";

  const [activeSection, setActiveSection] = useState(() =>
    isAdmin ? "school" : "appearance",
  );
  useEffect(() => {
    if (!isAdmin && ["school", "subject"].includes(activeSection)) {
      setActiveSection("appearance");
    }
  }, [activeSection, isAdmin]);

  const [schoolData, setSchoolData] = useState(() =>
    getSchoolSettings(user?.schoolId),
  );
  const [schoolError, setSchoolError] = useState("");
  const [schoolSaving, setSchoolSaving] = useState(false);
  const [accountData, setAccountData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [accountError, setAccountError] = useState("");
  const [accountSaving, setAccountSaving] = useState(false);

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

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    api.get("/admin/school-profile")
      .then(({ data }) => {
        if (active) setSchoolData(getSchoolSettings(data.school));
      })
      .catch((error) => {
        if (active) {
          setSchoolError(
            error.response?.data?.message || "Could not load school details.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    setAccountData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  }, [user?.name, user?.email, user?.phone]);

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

  const handleSaveSchool = async () => {
    setSchoolError("");
    setSchoolSaving(true);
    try {
      const { data } = await api.put("/admin/school-profile", {
        schoolName: schoolData.schoolName,
        schoolPhone: schoolData.schoolPhone,
        board: schoolData.board,
        academicSession: schoolData.academicSession,
        principalName: schoolData.principalName,
        affiliationNumber: schoolData.affiliationNumber,
        address: schoolData.address,
        city: schoolData.city,
        state: schoolData.state,
        pincode: schoolData.pincode,
        schoolType: schoolData.schoolType,
        establishedYear: schoolData.establishedYear === ""
          ? null
          : Number(schoolData.establishedYear),
      });
      setSchoolData(getSchoolSettings(data.school));
      setUser({
        ...user,
        schoolId: { ...user.schoolId, ...data.school },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      setSchoolError(
        error.response?.data?.message || "School details could not be saved.",
      );
    } finally {
      setSchoolSaving(false);
    }
  };

  const handleSchoolImageUploaded = (school) => {
    setSchoolData((current) => ({ ...current, ...school }));
    setUser({
      ...user,
      schoolId: { ...user.schoolId, ...school },
    });
  };

  const handleSaveAccount = async () => {
    setAccountError("");
    setAccountSaving(true);
    try {
      const { data } = await api.put("/profile/me", {
        name: accountData.name,
        phone: accountData.phone,
      });
      setAccountData((current) => ({ ...current, ...data.user }));
      setUser({ ...user, ...data.user });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      setAccountError(
        error.response?.data?.message || "Account details could not be saved.",
      );
    } finally {
      setAccountSaving(false);
    }
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
                onSave={handleSaveSchool}
                saved={saved}
                saving={schoolSaving}
                error={schoolError}
                onImageUploaded={handleSchoolImageUploaded}
              />
            )}

            {activeSection === "account" && (
              <AccountSettings
                accountData={accountData}
                onChange={handleAccountChange}
                onSave={handleSaveAccount}
                saved={saved}
                saving={accountSaving}
                error={accountError}
              />
            )}
            {isAdmin && activeSection === "subject" && <AddSubjectSettings />}

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
      label: "Security check in",
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
  const items = isAdmin ? [...adminItems, ...personalItems] : personalItems;

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

const SchoolSettings = ({
  schoolData,
  onChange,
  onSave,
  saved,
  saving,
  error,
  onImageUploaded,
}) => {
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
          required
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
          disabled
          hint="School email cannot be changed."
        />

        <SettingsInput
          label="School Phone"
          value={schoolData.schoolPhone}
          onChange={(e) => onChange("schoolPhone", e.target.value)}
        />

        <SettingsInput
          label="School Type"
          value={schoolData.schoolType}
          onChange={(e) => onChange("schoolType", e.target.value)}
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
          min="1800"
          max={new Date().getFullYear()}
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

      <SectionTitle icon={ImagePlus} title="School images" />
      <div className="grid gap-5 lg:grid-cols-2">
        <SchoolImageUploader
          title="School logo"
          description="Upload the school's logo. This is shown beside its name."
          image={schoolData.logo}
          imageType="logo"
          onUploaded={onImageUploaded}
        />
        <SchoolImageUploader
          title="Overview banner"
          description="Upload a wide image for the top of the public school overview."
          image={schoolData.bannerImage}
          imageType="banner"
          onUploaded={onImageUploaded}
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <SaveBar onSave={onSave} saved={saved} disabled={saving} />
    </SettingsCard>
  );
};

const SchoolImageUploader = ({
  title,
  description,
  image,
  imageType,
  onUploaded,
}) => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const uploadImage = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("type", imageType);
      formData.append("image", file);
      const { data } = await api.post("/admin/school-profile/image", formData);
      onUploaded(data.school);
      setFile(null);
      setMessage(data.message || "Image uploaded.");
    } catch (uploadError) {
      setError(
        uploadError.response?.data?.message || "Image could not be uploaded.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="space-y-3 rounded-xl border border-(--border) p-4">
      <div>
        <h4 className="font-semibold text-(--text)">{title}</h4>
        <p className="mt-1 text-xs text-(--text-muted)">{description}</p>
      </div>
      <div
        className={`grid place-items-center overflow-hidden rounded-lg bg-(--primary-soft-hover) ${
          imageType === "banner" ? "aspect-[16/6]" : "aspect-square max-h-52"
        }`}
      >
        {(previewUrl || image) ? (
          <img
            src={previewUrl || image}
            alt={`${title} preview`}
            className={`h-full w-full ${
              imageType === "banner" ? "object-cover" : "object-contain"
            }`}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-(--text-muted)">
            <ImagePlus size={28} />
            <span className="text-xs">No image uploaded</span>
          </div>
        )}
      </div>
      <label className="block text-sm font-medium text-(--text)">
        Choose image
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(event) => {
            const selectedFile = event.target.files?.[0] || null;
            if (
              selectedFile &&
              !["image/jpeg", "image/png", "image/webp"].includes(
                selectedFile.type,
              )
            ) {
              setFile(null);
              setError("Choose a JPG, PNG or WebP image.");
            } else if (selectedFile && selectedFile.size > 5 * 1024 * 1024) {
              setFile(null);
              setError("Image must be 5 MB or smaller.");
            } else {
              setFile(selectedFile);
              setError("");
            }
            setMessage("");
          }}
          className="mt-1.5 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-(--primary-soft) file:px-3 file:py-2 file:font-semibold file:text-(--primary)"
        />
      </label>
      <p className="text-xs text-(--text-muted)">
        JPG, PNG or WebP; maximum file size 5 MB. Uploads separately from school details.
      </p>
      <button
        type="button"
        onClick={uploadImage}
        disabled={!file || uploading}
        className="inline-flex items-center gap-2 rounded-lg bg-(--primary) px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Upload size={16} />
        {uploading ? "Uploading..." : `Upload ${imageType}`}
      </button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {message && <p role="status" className="text-sm text-emerald-700">{message}</p>}
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* Account Settings                                                            */
/* -------------------------------------------------------------------------- */

const AccountSettings = ({
  accountData,
  onChange,
  onSave,
  saved,
  saving,
  error,
}) => {
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
          required
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
          required
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <SaveBar onSave={onSave} saved={saved} disabled={saving} />
    </SettingsCard>
  );
};

/* -------------------------------------------------------------------------- */
/* Security                                                                    */
/* -------------------------------------------------------------------------- */

const SecuritySettings = ({ onSave, saved }) => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showAlertPage, setShowAlertPage] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [sessions, setSessions] = useState(null);

  const allSessionData = async () => {
    const res = await api.get("/get-all-session");
    const data = res.data.sessions || [];
    setSessions(data);
  };

  useEffect(() => {
    allSessionData();
  }, []);
  console.log(sessions);

  useEffect(() => {
    if (!showAlertPage) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showAlertPage]);

  const handleDeleteSession = async (id) => {
    try {
      await api.delete(`/delete-session/${id}`, {
        params: { sessionId: selectedSessionId },
      });
      await allSessionData();
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Could not logout from that device.",
      );
    } finally {
      setShowAlertPage(false);
    }
  };

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

      <div className="flex flex-col  gap-4 items-center justify-between rounded-xl border border-(--border) p-4">
        {sessions &&
          sessions.map((session) => (
            <div
              key={session._id}
              className="flex items-center justify-between w-full gap-3"
            >
              <div className="flex gap-2 items-center">
                <div className="rounded-xl bg-(--primary-soft) p-2.5 text-(--primary)">
                  {session.deviceInfo.device === "Desktop" ? (
                    <Laptop size={19} />
                  ) : (
                    <Smartphone size={19} className="shrink-0" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-semibold text-(--text)">
                    {`${session.deviceInfo.os}  ${session.deviceInfo.device}`}
                  </p>

                  <p className="text-xs text-(--text-muted)">
                    {session.isCurrentDevice === true && "This device"}•{" "}
                    {new Date(session.lastActive).toLocaleString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: true,
                    })}
                  </p>
                </div>
              </div>

              <span className="">
                {session.isCurrentDevice === true ? (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                    Active Device
                  </span>
                ) : (
                  <button
                    className="flex gap-1 items-center border border-(--danger) px-2.5 py-1 text-(--danger) rounded-full hover:bg-(--danger)/50 hover:text-(--surface) hover:-translate-y-0.5 transition-all duration-300 "
                    onClick={() => {
                      setShowAlertPage(true);
                      setSelectedSessionId(session._id);
                    }}
                  >
                    {" "}
                    <Trash2 size={18} /> Delete
                  </button>
                )}
              </span>
            </div>
          ))}
      </div>

      <button className="text-sm font-medium text-red-500 hover:underline">
        Sign out from all other devices
      </button>

      {showAlertPage && (
        <div
          className="absolute inset-0  z-99999  bg-black/30 backdrop-blur-2xl flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAlertPage(false);
            }
          }}
        >
          <AlertPage
            title="Logout form device"
            description="This device will no longer be available for this organisation."
            setShowAlertPage={setShowAlertPage}
            id={selectedSessionId}
            handleDeleteItem={handleDeleteSession}
          />
        </div>
      )}
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
  const [editingClassId, setEditingClassId] = useState("");
  const [isClassSaving, setIsClassSaving] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [editingSubject, setEditingSubject] = useState(null);
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
      setErrorMessage(
        error.response?.data?.message || "Could not load classes.",
      );
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
      setErrorMessage(
        error.response?.data?.message || "Could not load subjects.",
      );
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
    setIsClassSaving(true);
    try {
      const payload = {
        name: className,
        section,
        course,
      };
      const response = editingClassId
        ? await api.put(`/classes/${editingClassId}`, payload)
        : await api.post("/add-class", payload);
      await getAllClasses();
      setSelectedClassId(response.data.class._id);
      setClassName("");
      setSection("");
      setCourse("");
      setEditingClassId("");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Could not create class.",
      );
    } finally {
      setIsClassSaving(false);
    }
  };

  const handleEditClass = (record) => {
    setEditingClassId(record._id);
    setClassName(record.name);
    setSection(record.section);
    setCourse(record.course);
    setErrorMessage("");
  };

  const cancelEditClass = () => {
    setEditingClassId("");
    setClassName("");
    setSection("");
    setCourse("");
  };

  const handleUpdateSubject = async (event) => {
    event.preventDefault();
    if (!editingSubject?.name.trim()) return;
    setErrorMessage("");
    setIsSaving(true);
    try {
      await api.put(`/subjects/${editingSubject.id}`, {
        name: editingSubject.name.trim(),
      });
      setEditingSubject(null);
      await getAllSubject(selectedClassId);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Could not update subject.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleQueueSubject = (event) => {
    event.preventDefault();
    const name = subjectName.trim();
    if (!name) return;
    if (
      savedSubjects.some(
        (subject) => subject.name.toLowerCase() === name.toLowerCase(),
      ) ||
      pendingSubjects.some(
        (subject) => subject.toLowerCase() === name.toLowerCase(),
      )
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
      await api.post("/add-subject", {
        classId: selectedClassId,
        subjects: pendingSubjects,
      });
      setPendingSubjects([]);
      await getAllSubject(selectedClassId);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || "Could not save subjects.",
      );
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
      setErrorMessage(
        error.response?.data?.message || "Could not remove subject.",
      );
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
      <SectionTitle
        icon={School}
        title="1. Create class by section and course"
      />
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
          disabled={isClassSaving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--primary) px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {isClassSaving ? (
            "Saving..."
          ) : (
            <>
              {editingClassId ? <Save size={17} /> : <Plus size={17} />}
              {editingClassId ? "Save Class" : "Create Class"}
            </>
          )}
        </button>
        {editingClassId && (
          <button
            type="button"
            onClick={cancelEditClass}
            disabled={isClassSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-(--border) px-4 py-2.5 text-sm"
          >
            <X size={17} /> Cancel
          </button>
        )}
      </form>

      <div className="flex flex-wrap gap-2">
        {classes.map((record) => (
          <div
            key={record._id}
            className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${
              selectedClassId === record._id
                ? "border-(--primary) bg-(--primary-soft) text-(--primary)"
                : "border-(--border) bg-(--primary-soft-hover)"
            }`}
          >
            <button
              type="button"
              onClick={() => setSelectedClassId(record._id)}
              className="px-1 py-1 text-left text-sm"
            >
              <span className="font-semibold">
                {record.name} - {record.section}
              </span>
              <span className="ml-2 text-xs text-(--text-muted)">
                {record.course}
              </span>
            </button>
            <button
              type="button"
              aria-label={`Edit ${record.name} ${record.section}`}
              onClick={() => handleEditClass(record)}
              className="rounded p-1.5 hover:bg-(--primary-soft-hover)"
            >
              <Pencil size={14} />
            </button>
          </div>
        ))}
        {classes.length === 0 && (
          <p className="text-sm text-(--text-muted)">
            Create a class to start adding subjects.
          </p>
        )}
      </div>

      <SectionTitle
        icon={NotebookPen}
        title="2. Add subjects to selected class"
      />
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
              <li
                key={name}
                className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--primary-soft) px-3 py-2 text-sm"
              >
                {name}
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  onClick={() =>
                    setPendingSubjects((items) =>
                      items.filter((item) => item !== name),
                    )
                  }
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

      <SectionTitle
        icon={Check}
        title="Subjects available for selected class"
      />
      <div className="mt-3">
        {!selectedClassId ? (
          <p className="text-sm text-(--text-muted)">
            Select a class to view its subjects.
          </p>
        ) : savedSubjects.length === 0 ? (
          <p className="text-sm text-(--text-muted)">
            No subjects added to this class yet.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {savedSubjects.map((subject) => (
              <li
                key={subject.id}
                className="flex items-center gap-2 rounded-lg border border-(--border) bg-(--primary-soft) px-3 py-2"
              >
                {editingSubject?.id === subject.id ? (
                  <form
                    onSubmit={handleUpdateSubject}
                    className="flex items-center gap-2"
                  >
                    <Input
                      autoFocus
                      required
                      maxLength={100}
                      value={editingSubject.name}
                      onChange={(event) =>
                        setEditingSubject((current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                      className="w-40 text-sm"
                    />
                    <button
                      type="submit"
                      aria-label="Save subject name"
                      disabled={isSaving}
                      className="rounded p-1 text-(--primary) disabled:opacity-60"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Cancel subject edit"
                      onClick={() => setEditingSubject(null)}
                      className="rounded p-1"
                    >
                      <X size={16} />
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="text-sm">{subject.name}</span>
                    <button
                      type="button"
                      aria-label={`Edit ${subject.name}`}
                      className="rounded p-1 text-(--text-muted) hover:text-(--primary)"
                      onClick={() =>
                        setEditingSubject({ id: subject.id, name: subject.name })
                      }
                    >
                      <Pencil size={14} />
                    </button>
                  </>
                )}
                  <button
                    type="button"
                    aria-label={`Remove ${subject.name} from class`}
                  className="rounded p-1 text-(--danger) hover:bg-(--danger)/10"
                  disabled={editingSubject?.id === subject.id}
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
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600"
        >
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
            handleDeleteItem={handleDeleteSubject}
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
  required = false,
  min,
  max,
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
          required={required}
          min={min}
          max={max}
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

const SaveBar = ({ onSave, saved, disabled = false }) => {
  return (
    <div className="flex flex-col gap-3 border-t border-(--border) pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-(--text-muted)">
        Changes are not saved until you click Save Changes.
      </p>

      <button
        type="button"
        onClick={onSave}
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-(--primary) px-5 py-2.5 text-sm font-semibold text-(--surface) transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {disabled ? (
          "Saving..."
        ) : saved ? (
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
