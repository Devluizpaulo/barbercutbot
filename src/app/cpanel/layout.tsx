import React from 'react';

// This root layout allows the (cpanel) route group to handle the actual layout.
export default function CPanelRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
