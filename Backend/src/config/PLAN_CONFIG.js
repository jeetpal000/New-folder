const PLAN_CONFIG = {
  free: {
    plan: "free",
    maxStudents: 500,
    maxTeachers: 50,
    maxAdmin: 5,
    durationDays: 365,
    storageLimit: 5,
    amount: 0,

  },
  basic: {
    plan: "basic",
    maxStudents: 2000,
    maxTeachers: 200,
    maxAdmin: 20,
    storageLimit: 50,
    amount: 1999,
    durationDays: 365
  },
  premium: {
    plan: "premium",
    maxStudents: -1,
    maxTeachers: -1,
    maxAdmin: -1,
    storageLimit: -1,
    amount: 3999, 
    durationDays: 365,
  }
};

export default PLAN_CONFIG;