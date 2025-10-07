import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'barber-hero');

  return (
    <div className="flex flex-col min-h-screen">
      <header className="fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-sm z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />
          <Button asChild variant="outline">
            <Link href="/dashboard">Login</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center text-center">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 container mx-auto px-4 md:px-6">
            <h1 className="text-4xl font-bold tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-7xl font-headline">
              Elevate Your Barber Shop
            </h1>
            <p className="mx-auto mt-4 max-w-[700px] text-gray-200 md:text-xl">
              The all-in-one SaaS platform to manage appointments, clients, and financials. Focus on your craft, we'll handle the rest.
            </p>
            <div className="mt-8">
              <Button asChild size="lg">
                <Link href="/dashboard">Get Started</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-24 lg:py-32 bg-white dark:bg-card">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
              <div className="text-center">
                <h3 className="text-2xl font-bold font-headline">Smart Scheduling</h3>
                <p className="mt-2 text-muted-foreground">
                  Effortless appointment management with a real-time calendar view.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold font-headline">Client Management</h3>
                <p className="mt-2 text-muted-foreground">
                  Keep track of customer preferences, history, and contact information.
                </p>
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-bold font-headline">Financial Tracking</h3>
                <p className="mt-2 text-muted-foreground">
                  Monitor your income and expenses with insightful financial reports.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-6 border-t">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
          <Logo />
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Barbearia SaaS. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
