
import Link from "next/link";
import { Logo } from "@/components/logo";
import { UserNav } from "@/components/user-nav";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-50">
          <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            <Link
              href="/dashboard/shops"
              className="flex items-center gap-2 text-lg font-semibold md:text-base"
            >
              <Logo />
              <span className="sr-only">Barbearia SaaS</span>
            </Link>
          </nav>
          <div className="md:hidden">
              <SidebarTrigger />
          </div>
          <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
            <div className="ml-auto flex-1 sm:flex-initial">
            </div>
            <UserNav />
          </div>
        </header>
        <main className="flex flex-1">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
