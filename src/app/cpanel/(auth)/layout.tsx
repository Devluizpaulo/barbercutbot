
'use client';

// This is a public layout for the admin authentication pages (login, signup).
// It does not contain any redirection logic itself. The pages within this
// layout are responsible for handling their own authentication state.
export default function CPanelAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
