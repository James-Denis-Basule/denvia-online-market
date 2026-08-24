export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 50;

export function getPagination(page: number, limit: number) {
  const safePage = Number.isFinite(page) ? Math.max(1, Math.floor(page)) : DEFAULT_PAGE;
  const safeLimit = Number.isFinite(limit)
    ? Math.min(MAX_LIMIT, Math.max(1, Math.floor(limit)))
    : DEFAULT_LIMIT;

  return {
    page: safePage,
    limit: safeLimit,
    skip: (safePage - 1) * safeLimit,
  };
}
