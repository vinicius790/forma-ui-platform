export interface BreadcrumbOptions { label?: string; current?: boolean }
export function getBreadcrumbNavProps(label = 'Breadcrumb') { return { 'aria-label': label }; }
export function getBreadcrumbItemProps(options: BreadcrumbOptions = {}) { return { 'aria-current': options.current ? 'page' as const : undefined, 'data-current': options.current ? '' : undefined }; }
