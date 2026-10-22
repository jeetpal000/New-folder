export const getRoleName = (role) => {
  if (role?.role || role?.name) return role.role || role.name;
  return undefined;
};
