import test from "node:test";
import assert from "node:assert/strict";
import {
  areAssessmentMarksWithinLimit,
  hasCompleteAssessmentResults,
  isValidAssessmentResult,
} from "../src/utils/assessmentRules.js";
import { hasAssessmentSubjectAccess } from "../src/utils/assessmentAccess.js";
import { hashRefreshToken } from "../src/utils/token.js";
import { isWithinSubscriptionLimit } from "../src/utils/subscriptionRules.js";

test("validates numeric and absent results without accepting blank marks", () => {
  assert.equal(
    isValidAssessmentResult({
      isAbsent: false,
      marks: "0",
      remark: "",
    }),
    true,
  );
  assert.equal(isValidAssessmentResult({ isAbsent: false, marks: "" }), false);
  assert.equal(isValidAssessmentResult({ isAbsent: true, marks: null }), true);
  assert.equal(isValidAssessmentResult({ isAbsent: true, marks: 0 }), false);
});

test("rejects marks above the assessment maximum", () => {
  assert.equal(
    areAssessmentMarksWithinLimit(
      [
        { isAbsent: false, marks: 80 },
        { isAbsent: true, marks: null },
      ],
      100,
    ),
    true,
  );
  assert.equal(
    areAssessmentMarksWithinLimit([{ isAbsent: false, marks: 101 }], 100),
    false,
  );
});

test("requires a result for every active student before publishing", () => {
  assert.equal(
    hasCompleteAssessmentResults(
      ["s1", "s2"],
      [{ studentId: "s1" }, { studentId: "s2" }],
    ),
    true,
  );
  assert.equal(
    hasCompleteAssessmentResults(["s1", "s2"], [{ studentId: "s1" }]),
    false,
  );
  assert.equal(hasCompleteAssessmentResults([], []), false);
});

test("limits teacher assessment access to assigned subjects", () => {
  const scope = {
    teacher: {
      teachingAssignments: [
        { classId: "class-1", subjectIds: ["math", "science"] },
      ],
    },
    classTeacherClassIds: ["class-2"],
  };

  assert.equal(hasAssessmentSubjectAccess(null, "class-1", "unassigned"), true);
  assert.equal(hasAssessmentSubjectAccess(scope, "class-1", "math"), true);
  assert.equal(hasAssessmentSubjectAccess(scope, "class-1", "english"), false);
  assert.equal(hasAssessmentSubjectAccess(scope, "class-2", "english"), true);
  assert.equal(hasAssessmentSubjectAccess(scope, "class-3", "math"), false);
});

test("stores a deterministic digest instead of a raw refresh token", () => {
  const token = "refresh-token-for-test";
  const digest = hashRefreshToken(token);

  assert.equal(digest, hashRefreshToken(token));
  assert.equal(digest.length, 64);
  assert.notEqual(digest, token);
});

test("enforces inclusive usage caps while supporting the unlimited sentinel", () => {
  assert.equal(isWithinSubscriptionLimit(0, 1), true);
  assert.equal(isWithinSubscriptionLimit(1, 1), false);
  assert.equal(isWithinSubscriptionLimit(100000, -1), true);
  assert.equal(isWithinSubscriptionLimit(undefined, 500), false);
});
