
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Star, CheckCircle, TrendingUp, Users, Lock, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'hero-new');
  const avatar1 = PlaceHolderImages.find(p => p.id === 'avatar-1');
  const avatar2 = PlaceHolderImages.find(p => p.id === 'avatar-2');
  const avatar3 = PlaceHolderImages.find(p => p.id === 'avatar-3');


  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-background">
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-background/80 backdrop-blur-sm z-20 border-b">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <Link href="/" aria-label="Página Inicial da FlowCuts Pro">
              <Logo />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Funcionalidades</Link>
            <Link href="#testimonials" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Depoimentos</Link>
            <Link href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Preços</Link>
          </nav>
          <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild>
                <Link href="/login">
                    <Lock className="mr-2 h-4 w-4" />
                    Login
                </Link>
            </Button>
            <Button asChild>
                <Link href="/signup">Começar Teste Grátis</Link>
            </Button>
          </div>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Abrir Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b">
                     <Link href="/" aria-label="Página Inicial da FlowCuts Pro">
                        <Logo />
                     </Link>
                  </div>
                  <nav className="flex-1 grid gap-4 p-4">
                    <Link href="#features" className="flex items-center py-2 text-lg font-semibold hover:text-primary transition-colors">Funcionalidades</Link>
                    <Link href="#testimonials" className="flex items-center py-2 text-lg font-semibold hover:text-primary transition-colors">Depoimentos</Link>
                    <Link href="#pricing" className="flex items-center py-2 text-lg font-semibold hover:text-primary transition-colors">Preços</Link>
                  </nav>
                  <div className="p-4 border-t mt-auto flex flex-col gap-4">
                     <Button variant="ghost" asChild className="w-full">
                          <Link href="/login">
                              <Lock className="mr-2 h-4 w-4" />
                              Login
                          </Link>
                      </Button>
                      <Button asChild className="w-full">
                          <Link href="/signup">Começar Teste Grátis</Link>
                      </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 pt-20">
        <section className="relative w-full h-[90vh] flex items-center">
          {heroImage && (
            <Image
              src={heroImage.imageUrl}
              alt={heroImage.description}
              fill
              className="object-cover object-right"
              data-ai-hint={heroImage.imageHint}
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
          <div className="relative z-10 container mx-auto px-4 md:px-6 text-white">
            <div className="max-w-xl">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-7xl font-headline leading-tight">
                Eleve seu Negócio a Outro Nível.
                </h1>
                <p className="mt-6 text-lg md:text-xl text-gray-300">
                Otimize agendamentos, gerencie clientes e controle suas finanças com a ferramenta definitiva para negócios modernos.
                </p>
                <div className="mt-8">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 transform hover:scale-105 transition-transform duration-300 ease-in-out">
                    <Link href="/signup">Descubra como</Link>
                </Button>
                </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
                 <h2 className="text-3xl md:text-4xl font-bold font-headline">Tudo que seu negócio precisa</h2>
                 <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                    Ferramentas poderosas para otimizar seu tempo, aumentar seus lucros e fidelizar seus clientes.
                 </p>
            </div>
            <div className="grid gap-12 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="h-12 w-12 text-primary mb-4"/>
                <h3 className="text-2xl font-bold font-headline mb-2">Agendamento Inteligente</h3>
                <p className="text-muted-foreground">
                  Otimize sua agenda com um sistema online 24/7. Menos tempo no telefone, mais tempo com seus clientes.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <Users className="h-12 w-12 text-primary mb-4"/>
                <h3 className="text-2xl font-bold font-headline mb-2">CRM para Negócios</h3>
                <p className="text-muted-foreground">
                  Conheça seus clientes como nunca antes. Histórico, preferências e contato em um só lugar para um serviço personalizado.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <TrendingUp className="h-12 w-12 text-primary mb-4"/>
                <h3 className="text-2xl font-bold font-headline mb-2">Financeiro Descomplicado</h3>
                <p className="text-muted-foreground">
                  Acompanhe receitas, despesas e o crescimento do seu negócio com relatórios claros e automáticos.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-16 md:py-24 lg:py-32 bg-secondary">
          <div className="container mx-auto px-4 md:px-6">
             <div className="text-center mb-12">
                 <h2 className="text-3xl md:text-4xl font-bold font-headline">Como Funciona</h2>
                 <p className="text-muted-foreground mt-2">Em 3 passos simples, seu negócio em outro nível.</p>
            </div>
            <div className="grid gap-10 md:grid-cols-3 md:gap-16 items-start">
              <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center bg-primary text-white rounded-full h-16 w-16 text-2xl font-bold font-headline mb-4">1</div>
                  <h3 className="text-xl font-bold mb-2">Cadastre-se</h3>
                  <p className="text-muted-foreground">Crie sua conta em menos de 2 minutos. Sem complicação.</p>
              </div>
               <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center bg-primary text-white rounded-full h-16 w-16 text-2xl font-bold font-headline mb-4">2</div>
                  <h3 className="text-xl font-bold mb-2">Configure sua Loja</h3>
                  <p className="text-muted-foreground">Adicione seus serviços, profissionais e horários de funcionamento.</p>
              </div>
               <div className="flex flex-col items-center text-center">
                  <div className="flex items-center justify-center bg-primary text-white rounded-full h-16 w-16 text-2xl font-bold font-headline mb-4">3</div>
                  <h3 className="text-xl font-bold mb-2">Comece a Crescer</h3>
                  <p className="text-muted-foreground">Divulgue seu link de agendamento e veja sua agenda lotar!</p>
              </div>
            </div>
          </div>
        </section>
        
        <section id="testimonials" className="py-16 md:py-24 lg:py-32">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold font-headline">Amado por Empreendedores de Todo o Brasil</h2>
                    <p className="text-muted-foreground mt-2">Veja o que nossos parceiros estão dizendo.</p>
                </div>
                <div className="grid gap-8 md:grid-cols-3">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex mb-4">
                                {[...Array(5)].map((_, i) => <Star key={i} className="text-yellow-400 fill-current" />)}
                            </div>
                            <p className="mb-4 italic">"Mudou o jogo para o meu negócio. A organização dos agendamentos é outra e os clientes adoraram a facilidade."</p>
                            <div className="flex items-center gap-4">
                                {avatar1 && <Avatar>
                                    <AvatarImage src={avatar1.imageUrl} alt="Avatar Cliente 1" data-ai-hint={avatar1.imageHint} />
                                    <AvatarFallback>JS</AvatarFallback>
                                </Avatar>}
                                <div>
                                    <p className="font-bold">Jonas Schmidt</p>
                                    <p className="text-sm text-muted-foreground">Barbearia Clássica</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardContent className="pt-6">
                            <div className="flex mb-4">
                                {[...Array(5)].map((_, i) => <Star key={i} className="text-yellow-400 fill-current" />)}
                            </div>
                            <p className="mb-4 italic">"O controle financeiro ficou muito mais simples e visual. Agora sei exatamente para onde meu negócio está indo."</p>
                            <div className="flex items-center gap-4">
                                {avatar2 && <Avatar>
                                    <AvatarImage src={avatar2.imageUrl} alt="Avatar Cliente 2" data-ai-hint={avatar2.imageHint} />
                                    <AvatarFallback>RM</AvatarFallback>
                                </Avatar>}
                                <div>
                                    <p className="font-bold">Ricardo Mendes</p>
                                    <p className="text-sm text-muted-foreground">Navalha de Ouro</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardContent className="pt-6">
                            <div className="flex mb-4">
                                {[...Array(5)].map((_, i) => <Star key={i} className="text-yellow-400 fill-current" />)}
                            </div>
                            <p className="mb-4 italic">"Com o perfil dos clientes, consigo oferecer um serviço muito mais personalizado. A fidelidade aumentou muito!"</p>
                            <div className="flex items-center gap-4">
                                {avatar3 && <Avatar>
                                    <AvatarImage src={avatar3.imageUrl} alt="Avatar Cliente 3" data-ai-hint={avatar3.imageHint} />
                                    <AvatarFallback>LP</AvatarFallback>
                                </Avatar>}
                                <div>
                                    <p className="font-bold">Lucas Pereira</p>
                                    <p className="text-sm text-muted-foreground">The Gentlemen's Cut</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        <section id="pricing" className="py-16 md:py-24 lg:py-32 bg-primary text-white">
            <div className="container mx-auto px-4 md:px-6 text-center">
                 <h2 className="text-3xl md:text-4xl font-bold font-headline">Pronto para transformar seu negócio?</h2>
                 <p className="mt-4 max-w-2xl mx-auto text-lg text-primary-foreground/80">Junte-se a centenas de empreendedores que já estão otimizando sua gestão e lucrando mais.</p>
                 <div className="mt-8">
                    <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 transform hover:scale-105 transition-transform">
                        <Link href="/signup">Começar meu teste grátis de 14 dias</Link>
                    </Button>
                    <p className="text-xs mt-4 text-primary-foreground/60">Não é necessário cartão de crédito.</p>
                 </div>
            </div>
        </section>
      </main>

      <footer className="py-8 border-t bg-secondary">
        <div className="container mx-auto flex flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-6">
           <Link href="/" aria-label="Página Inicial da FlowCuts Pro">
              <Logo />
           </Link>
          <nav className="flex flex-wrap justify-center gap-4 text-center md:gap-6">
             <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Termos de Serviço</Link>
             <Link href="#" className="text-sm text-muted-foreground hover:text-primary">Política de Privacidade</Link>
             <Link href="/cpanel/login" className="text-sm text-muted-foreground hover:text-primary">Admin</Link>
          </nav>
          <p className="text-sm text-muted-foreground text-center md:text-right">
            © {new Date().getFullYear()} FlowCuts Pro. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
