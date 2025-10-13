
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/logo';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, User, Mail, Lock, Shield, AlertTriangle, CheckCircle, Eye, EyeOff, Crown, Zap } from 'lucide-react';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SetupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAdmins, setIsCheckingAdmins] = useState(true);
  const [adminExists, setAdminExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check if an admin user already exists using a Cloud Function
  useEffect(() => {
    const checkForAdmins = async () => {
      try {
        const functions = getFunctions();
        const checkAdminExists = httpsCallable(functions, 'checkAdminExists');
        const result = await checkAdminExists();
        
        if ((result.data as { adminExists: boolean }).adminExists) {
          setAdminExists(true);
          toast({
            title: 'Sistema já configurado',
            description: 'Já existe um administrador no sistema.',
          });
          // Redirect after 2 seconds
          setTimeout(() => {
            router.push('/admin');
          }, 2000);
        }
      } catch (error) {
        console.error('Erro ao verificar admins via Cloud Function:', error);
        toast({
          variant: 'destructive',
          title: 'Erro de Verificação',
          description: 'Não foi possível verificar a configuração do sistema. Por favor, recarregue a página.',
        });
      } finally {
        setIsCheckingAdmins(false);
      }
    };

    checkForAdmins();
  }, [router, toast]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!firstName.trim() || !lastName.trim()) {
      toast({ variant: 'destructive', title: 'Campos obrigatórios', description: 'Por favor, preencha seu nome completo.' });
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: 'destructive', title: 'Email inválido', description: 'Por favor, informe um endereço de e-mail válido.' });
      return;
    }
    if (password.length < 6) {
      toast({ variant: 'destructive', title: 'Senha muito curta', description: 'A senha deve ter pelo menos 6 caracteres.' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Senhas não coincidem', description: 'A senha e a confirmação devem ser iguais.' });
      return;
    }

    setIsLoading(true);

    try {
      // Re-check just before creating the user to prevent race conditions
      const functions = getFunctions();
      const checkAdminExists = httpsCallable(functions, 'checkAdminExists');
      const result = await checkAdminExists();

      if ((result.data as { adminExists: boolean }).adminExists) {
        toast({ variant: 'destructive', title: 'Admin já existe', description: 'Um administrador já foi criado. Redirecionando...' });
        setTimeout(() => router.push('/admin'), 2000);
        setIsLoading(false);
        return;
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, {
        displayName: `${firstName} ${lastName}`
      });

      // Create user document in Firestore with ADMIN role
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        id: user.uid,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: user.email,
        role: 'admin',
        createdAt: serverTimestamp(),
        isSetupAdmin: true,
      });

      toast({
        title: '✅ Administrador criado!',
        description: 'Conta de administrador criada com sucesso. Redirecionando para o painel...',
      });
      
      // The auth listener will automatically handle the login and redirect.
      // We can manually push to ensure it happens.
      setTimeout(() => {
        router.push('/cpanel');
      }, 1500);

    } catch (error: any) {
      console.error("Firebase Error:", error);
      let title = 'Erro ao criar administrador';
      let description = 'Ocorreu um erro ao criar a conta. Tente novamente.';
      
      if (error.code === 'auth/email-already-in-use') {
        description = 'Este endereço de e-mail já está em uso.';
      } else if (error.code === 'auth/invalid-email') {
        description = 'O endereço de e-mail não é válido.';
      } else if (error.code === 'auth/weak-password') {
        description = 'A senha é muito fraca. Use uma combinação mais forte.';
      } else if (error.code === 'auth/network-request-failed') {
        title = 'Erro de conexão';
        description = 'Verifique sua conexão com a internet e tente novamente.';
      }
      
      toast({
        variant: 'destructive',
        title,
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAdmins) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="space-y-2">
            <LoaderCircle className="h-8 w-8 animate-spin text-purple-400 mx-auto" />
            <p className="text-slate-300 font-medium">Verificando configuração do sistema...</p>
            <p className="text-slate-500 text-sm">Analisando segurança e estrutura</p>
          </div>
        </div>
      </div>
    );
  }

  if (adminExists) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-6">
            <div className="relative mx-auto">
              <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Crown className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl text-white font-bold">Sistema Configurado</CardTitle>
              <CardDescription className="text-slate-300 text-base">
                Um administrador já existe no sistema.
              </CardDescription>
            </div>
          </CardHeader>
          <CardFooter className="flex flex-col gap-4">
            <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3">
              <Link href="/admin" className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Ir para Login Admin
              </Link>
            </Button>
            <p className="text-xs text-center text-slate-500">
              Redirecionamento automático em alguns segundos...
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-blue-500/5"></div>
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      
      <header className="fixed top-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl z-20 border-b border-slate-700/50">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
          <Link href="/" aria-label="Página Inicial da FlowCuts Pro" className="hover:scale-105 transition-transform">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild className="text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors">
              <Link href="/login" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Login de Usuário
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center pt-20 px-4 relative z-10">
        <Card className="w-full max-w-md border-slate-700/50 bg-slate-800/60 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center space-y-6">
            <div className="relative mx-auto">
              <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                <Crown className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl text-white font-bold">Configuração Inicial</CardTitle>
              <CardDescription className="text-slate-300 text-lg">
                Crie o primeiro administrador do sistema
              </CardDescription>
            </div>
          </CardHeader>

          <Alert className="mx-6 mb-6 border-amber-500/50 bg-amber-500/10 backdrop-blur">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <AlertDescription className="text-amber-100 text-sm">
              <strong>Atenção:</strong> Esta página só está disponível quando nenhum administrador existe no sistema.
              Após criar o admin, esta página será desabilitada.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSetup}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-200">Nome</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
                    <Input 
                      id="firstName" 
                      required 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)} 
                      className="pl-10 bg-slate-900/50 border-slate-600 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-200">Sobrenome</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
                    <Input 
                      id="lastName" 
                      required 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)} 
                      className="pl-10 bg-slate-900/50 border-slate-600 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                      placeholder="Seu sobrenome"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Email Administrativo</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@flowcutspro.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">Senha</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-900/50 border-slate-600 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200">Confirmar Senha</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-400 transition-colors" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-900/50 border-slate-600 text-white focus:border-purple-500 focus:ring-purple-500/20 transition-all"
                    placeholder="Digite a senha novamente"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-6">
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300" 
                type="submit" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Shield className="mr-2 h-5 w-5" />
                )}
                {isLoading ? 'Criando Administrador...' : 'Criar Administrador'}
              </Button>
              
              <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                <Crown className="h-3 w-3" />
                <span>Esta será a conta principal de administrador do sistema</span>
              </div>
            </CardFooter>
          </form>
        </Card>
      </main>

      <footer className="py-8 border-t border-slate-700/50 bg-slate-900/90 backdrop-blur-xl relative z-10">
        <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Configuração Segura</span>
            <span className="text-slate-600">•</span>
            <Zap className="h-4 w-4 text-blue-500" />
            <span>Primeira Vez</span>
          </div>
          <p className="text-xs text-slate-500 text-center">
            © {new Date().getFullYear()} FlowCuts Pro • Sistema de Administração
          </p>
        </div>
      </footer>
    </div>
  );
}
