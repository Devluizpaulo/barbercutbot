
import React from 'react';

export default function SetupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      {children}
    </div>
  );
}
