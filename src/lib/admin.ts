const ADMIN_EMAILS = new Set(['egeohub101@gmail.com', 'ngfilho@gmail.com']);

export function isAdminEmail(email: string | null | undefined) {
  return Boolean(email && ADMIN_EMAILS.has(email.trim().toLowerCase()));
}
