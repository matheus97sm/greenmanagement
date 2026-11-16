export function isCurrentPage(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`);
}
