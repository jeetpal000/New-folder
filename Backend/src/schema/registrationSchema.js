import { z } from "zod";

const phoneSchema = z.string().regex(/^[0-9]{10}$/, "Phone number must be exactly 10 digits");
const emailSchema = z.string().trim().email().transform((email) => email.toLowerCase());

export const registrationSchema = z.object({
  admin: z.object({
    name: z.string().trim().min(2).max(100),
    email: emailSchema,
    phone: phoneSchema,
    password: z.string()
      .min(8)
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/[0-9]/, "Password must contain a number")
      .regex(/[@$!%*?&]/, "Password must contain a special character"),
  }),
  organisation: z.object({
    name: z.string().trim().min(2).max(150),
    address: z.object({
      street: z.string().trim().min(1),
      city: z.string().trim().min(1),
      state: z.string().trim().min(1),
      pincode: z.string().regex(/^\d{6}$/),
    }),
    contact: z.object({
      email: emailSchema,
      phone: phoneSchema,
      website: z.string().trim().optional(),
    }),
  }),
  profile: z.object({
    schoolType: z.enum(["PRIVATE", "GOVERNMENT", "PRIVATE_AIDED"]),
    board: z.enum(["ICSE", "CBSE", "UP-BOARD"]),
    principalName: z.string().trim().min(1),
    affiliationNumber: z.string().trim().min(1),
    academicSession: z.string().trim().min(1),
    establishedYear: z.coerce.number().int().min(1800).max(new Date().getFullYear()),
  }),
});