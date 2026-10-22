export const isValidAssessmentResult = (result) => {
  if (
    !result ||
    typeof result.isAbsent !== "boolean" ||
    (result.remark != null &&
      (typeof result.remark !== "string" || result.remark.length > 500))
  ) {
    return false;
  }

  if (result.isAbsent) {
    return result.marks === null;
  }

  if (
    !["number", "string"].includes(typeof result.marks) ||
    (typeof result.marks === "string" && result.marks.trim() === "")
  ) {
    return false;
  }
  return Number.isFinite(Number(result.marks)) && Number(result.marks) >= 0;
};

export const hasCompleteAssessmentResults = (activeStudentIds, results) => {
  if (activeStudentIds.length === 0 || results.length !== activeStudentIds.length) {
    return false;
  }
  const resultIds = new Set(results.map((result) => String(result.studentId)));
  return activeStudentIds.every((studentId) => resultIds.has(String(studentId)));
};

export const areAssessmentMarksWithinLimit = (results, maxMarks) =>
  results.every(
    (result) => result.isAbsent || Number(result.marks) <= maxMarks,
  );
