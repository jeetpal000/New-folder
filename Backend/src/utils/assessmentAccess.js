export const hasAssessmentSubjectAccess = (
  scope,
  classId,
  subjectId,
) => {
  if (scope === null) return true;
  if (!scope?.teacher) return false;

  const assignment = (scope.teacher.teachingAssignments || []).find(
    (item) => String(item.classId) === String(classId),
  );
  if (assignment) {
    return (assignment.subjectIds || []).some(
      (id) => String(id) === String(subjectId),
    );
  }

  return (scope.classTeacherClassIds || []).some(
    (id) => String(id) === String(classId),
  );
};
