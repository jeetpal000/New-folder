export const isWithinSubscriptionLimit = (currentCount, limit) =>
  Number.isInteger(currentCount) &&
  Number.isInteger(limit) &&
  (limit === -1 || currentCount < limit);
