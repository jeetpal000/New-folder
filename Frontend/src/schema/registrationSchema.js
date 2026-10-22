import {z} from "zod";

export const adminSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
   email: z
    .string()
    .trim()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter valid email address")
    .toLowerCase(),
  phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactaly 10 digits"),
  password: z.string()
  .trim()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "At least one uppercase letter required")
  .regex(/[a-z]/, "At least one lowercase letter required")
  .regex(/[0-9]/, "At least one number required")
  .regex(/[@$!%*?&]/, "At least one special character required"),
  confirmPassword: z.string().trim()
}).refine((data)=>data.password === data.confirmPassword, {
  message: "Password is not matched",
  path: ["confirmPassword"]
});




export const organisationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Organisation name is required"),

  // type: z.enum([
  //   "SCHOOL",
  //   "LIBRARY",
  //   "HOSPITAL",
  //   "SHOP",
  //   "COMPANY",
  // ]),

  description: z
    .string()
    .max(500, "Maximum 500 characters")
    .optional(),

  address: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z
      .string()
      .regex(/^\d{6}$/, "Enter valid pincode"),
  }),
  contact: z.object({
     email: z
    .string()
    .trim()
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter valid email address")
    .toLowerCase(),
    phone: z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits"),
    website: z.string().trim().optional(),
  }),

});

export const schoolProfileSchema =  z.object({
    schoolType: z.enum(["PRIVATE", "GOVERNMENT", "PRIVATE_AIDED"]),
    board: z.enum(["ICSE", "CBSE", "UP-BOARD"]),
    principalName: z.string().trim().min(1, "Principal name is required"),
    affiliationNumber: z.string().trim().min(1, "Affiliation number is required"),
    academicSession: z.string().trim().min(1, "Academic session is required"),
    facilities: z.array(z.string().trim()).default([]),
    establishedYear: z.coerce.number().int().min(1800, "Invalid year"),
  });