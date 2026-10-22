import test from "node:test";
import assert from "node:assert/strict";
import { getRoleName } from "../src/utils/role.js";

test("resolves a named Admin role", () => {
  assert.equal(getRoleName({ role: "Admin" }), "Admin");
});

test("supports legacy named roles", () => {
  assert.equal(getRoleName({ name: "Staff" }), "Staff");
});

test("does not infer Admin from a permission combination", () => {
  assert.equal(
    getRoleName({
      permission: [
        { key: "student.delete" },
        { key: "teacher.delete" },
        { key: "attendance.update" },
        { key: "report.export" },
      ],
    }),
    undefined,
  );
});
