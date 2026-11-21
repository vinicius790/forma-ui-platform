export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
}

export interface BreadcrumbOverflowResult {
  leading: BreadcrumbItem[];
  collapsed: BreadcrumbItem[];
  trailing: BreadcrumbItem[];
  hasOverflow: boolean;
}

/** Partitions long breadcrumb trails into leading, collapsed overflow menu, and trailing visible items. */
export function partitionBreadcrumbs(
  items: readonly BreadcrumbItem[],
  maxVisible = 4,
  itemsBeforeCollapse = 1,
): BreadcrumbOverflowResult {
  const limit = Math.max(2, Math.trunc(maxVisible));
  if (items.length <= limit) {
    return { leading: [...items], collapsed: [], trailing: [], hasOverflow: false };
  }
  const leadCount = Math.max(1, Math.min(limit - 1, Math.trunc(itemsBeforeCollapse)));
  const trailCount = Math.max(1, limit - leadCount);
  const leading = items.slice(0, leadCount);
  const trailing = items.slice(items.length - trailCount);
  const collapsed = items.slice(leadCount, items.length - trailCount);
  return { leading, collapsed, trailing, hasOverflow: collapsed.length > 0 };
}
