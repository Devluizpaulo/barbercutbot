
'use client';

/**
 * This layout is responsible for rendering the authentication pages (login, signup, setup).
 * It NO LONGER contains any redirection logic, as that caused conflicts.
 * It simply provides a wrapper for its children.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Render children directly. The routing and protection logic is handled
  // by the (app) layout and the page components themselves.
  return <>{children}</>;
}
