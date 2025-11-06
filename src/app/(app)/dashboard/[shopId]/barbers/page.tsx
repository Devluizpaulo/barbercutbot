
'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { PlusCircle, MoreVertical, Trash2, Edit, User, Search, Eye, EyeOff } from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AddBarberForm } from './add-barber-form';
import type { Barber } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { deleteDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

export default function BarbersPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedBarber, setSelectedBarber] = useState<Barber | undefined>(undefined);
  const [barberToDelete, setBarberToDelete] = useState<Barber | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isScheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleBarber, setScheduleBarber] = useState<Barber | null>(null);
  const defaultDays = ['segunda-feira','terça-feira','quarta-feira','quinta-feira','sexta-feira','sábado','domingo'];
  const [workingForm, setWorkingForm] = useState(() => defaultDays.map(d => ({ day: d, enabled: d !== 'domingo', open: '08:00', close: '18:00' })));
  const [breaksForm, setBreaksForm] = useState<{ day: string; start: string; end: string; label?: string }[]>([]);
  const [preBufferMinutes, setPreBufferMinutes] = useState<number>(5);
  const [postBufferMinutes, setPostBufferMinutes] = useState<number>(5);
  const params = useParams();
  const shopId = params.shopId as string;
  const firestore = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();

  const barbersQuery = useMemoFirebase(
    () => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'barbers') : null,
    [firestore, shopId, user]
  );
  const { data: barbers, isLoading } = useCollection<Barber>(barbersQuery);

  const filteredBarbers = useMemo(() => {
    if (!barbers) return [];
    if (!searchTerm) return barbers;
    const lowercasedTerm = searchTerm.toLowerCase();
    return barbers.filter(barber =>
      barber.firstName.toLowerCase().includes(lowercasedTerm) ||
      barber.lastName.toLowerCase().includes(lowercasedTerm) ||
      (barber.email && barber.email.toLowerCase().includes(lowercasedTerm))
    );
  }, [barbers, searchTerm]);

  const handleEdit = (barber: Barber) => {
    setSelectedBarber(barber);
    setFormOpen(true);
  };

  const openSchedule = (barber: Barber) => {
    setScheduleBarber(barber);
    const wh = (barber as any).workingHours || [];
    const brs = (barber as any).breaks || [];
    const next = defaultDays.map(d => {
      const w = wh.find((x: any) => (x.day || '').toLowerCase() === d);
      return {
        day: d,
        enabled: w ? w.enabled !== false : d !== 'domingo',
        open: w?.open || '08:00',
        close: w?.close || '18:00',
      };
    });
    setWorkingForm(next);
    setBreaksForm(
      brs.map((b: any) => ({ day: (b.day || '').toLowerCase(), start: b.start || '12:00', end: b.end || '13:00', label: b.label || 'Pausa' }))
    );
    setPreBufferMinutes(((barber as any).defaultPreBufferMinutes ?? (barber as any).defaultBufferMinutes ?? 5) as number);
    setPostBufferMinutes(((barber as any).defaultPostBufferMinutes ?? (barber as any).defaultBufferMinutes ?? 5) as number);
    setScheduleOpen(true);
  };

  const saveSchedule = async () => {
    if (!scheduleBarber) return;
    const workingHours = workingForm.map(d => ({ day: d.day, open: d.open, close: d.close, enabled: d.enabled }));
    const breaks = breaksForm.map(b => ({ day: b.day, start: b.start, end: b.end, label: b.label || 'Pausa' }));
    try {
      const ref = doc(firestore, 'barberShops', shopId, 'barbers', scheduleBarber.id);
      await setDocumentNonBlocking(ref, { workingHours, breaks, defaultPreBufferMinutes: preBufferMinutes, defaultPostBufferMinutes: postBufferMinutes }, { merge: true });
      toast({ title: 'Horários salvos', description: 'Disponibilidades do profissional atualizadas.' });
      setScheduleOpen(false);
      setScheduleBarber(null);
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Erro ao salvar horários' });
    }
  };

  const handleAddNew = () => {
    setSelectedBarber(undefined);
    setFormOpen(true);
  };
  
  const handleFormSuccess = () => {
    setFormOpen(false);
    setSelectedBarber(undefined);
  };

  const handleDelete = () => {
    if (!barberToDelete) return;
    const barberRef = doc(firestore, 'barberShops', shopId, 'barbers', barberToDelete.id);
    deleteDocumentNonBlocking(barberRef);
    toast({
      title: 'Profissional Removido',
      description: `O profissional "${barberToDelete.firstName}" foi removido.`,
    });
    setBarberToDelete(null);
  };
  
  const handleToggleStatus = (barber: Barber) => {
    // const newStatus = !(barber.ativo === undefined ? true : barber.ativo);
    // const barberRef = doc(firestore, 'barberShops', shopId, 'barbers', barber.id);
    // setDocumentNonBlocking(barberRef, { ativo: newStatus }, { merge: true });
    // toast({
    //   title: `Profissional ${newStatus ? 'Ativado' : 'Inativado'}`,
    //   description: `O profissional "${barber.name}" agora está ${newStatus ? 'ativo' : 'inativo'}.`,
    // });
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
              <User />
              Profissionais
            </h1>
            <p className="text-muted-foreground">
              Gerencie os barbeiros e outros profissionais do seu negócio.
            </p>
          </div>
          <div className="flex items-center gap-2">
              <div className="relative flex-1 md:grow-0">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar profissional..."
                  className="pl-8 w-full md:w-[200px] lg:w-[320px]"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isOpen) setSelectedBarber(undefined); setFormOpen(isOpen); }}>
                <DialogTrigger asChild>
                  <Button onClick={handleAddNew}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Profissional
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl" onEscapeKeyDown={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
                  <DialogHeader>
                    <DialogTitle>{selectedBarber ? 'Editar Profissional' : 'Adicionar Novo Profissional'}</DialogTitle>
                    <DialogDescription>
                      Preencha os detalhes do profissional.
                    </DialogDescription>
                  </DialogHeader>
                  <AddBarberForm
                    shopId={shopId}
                    initialData={selectedBarber}
                    onSuccess={handleFormSuccess}
                  />
                </DialogContent>
              </Dialog>
          </div>
        </div>

        {!isLoading && (barbers?.length || 0) === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between rounded-md border p-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5" />
                  <div>
                    <div className="font-medium">Adicione seu primeiro profissional</div>
                    <div className="text-sm text-muted-foreground">Cadastre barbeiros para receber agendamentos.</div>
                  </div>
                </div>
                <Button size="sm" onClick={handleAddNew}>Adicionar</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="hidden md:table-cell">Contato</TableHead>
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && Array.from({length: 3}).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                    <TableCell className="hidden md:table-cell"><Skeleton className="h-10 w-full" /></TableCell>
                    <TableCell><Skeleton className="h-10 w-8" /></TableCell>
                  </TableRow>
                ))}
                {filteredBarbers?.map((barber) => (
                  <TableRow key={barber.id}>
                    <TableCell className="font-medium">
                       <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={barber.avatar} alt={barber.firstName} />
                          <AvatarFallback>{barber.firstName?.charAt(0)}{barber.lastName?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          {barber.firstName} {barber.lastName}
                          <div className="text-sm text-muted-foreground md:hidden">{barber.email || barber.phone}</div>
                        </div>
                       </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div>{barber.email || ''}</div>
                      <div className="text-sm text-muted-foreground">{barber.phone || ''}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Ações</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(barber)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openSchedule(barber)}>
                            <Eye className="mr-2 h-4 w-4" /> Horários
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setBarberToDelete(barber)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remover
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {!isLoading && filteredBarbers?.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {searchTerm ? `Nenhum profissional encontrado para "${searchTerm}"` : "Nenhum profissional encontrado."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <AlertDialog
        open={!!barberToDelete}
        onOpenChange={(isOpen) => !isOpen && setBarberToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá remover o profissional{' '}
              <strong>{barberToDelete?.firstName}</strong> permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isScheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Horários e Pausas {scheduleBarber ? `— ${scheduleBarber.firstName}` : ''}</DialogTitle>
            <DialogDescription>Defina os horários de atendimento por dia e o intervalo de almoço.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workingForm.map((d, idx) => (
                <div key={d.day} className="border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{d.day}</span>
                    <label className="text-sm flex items-center gap-2">
                      <input type="checkbox" checked={d.enabled} onChange={e => {
                        const next = [...workingForm]; next[idx] = { ...d, enabled: e.target.checked }; setWorkingForm(next);
                      }} /> Ativo
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Abertura</div>
                      <input type="time" className="w-full border rounded-md h-9 px-2 bg-background" value={d.open} onChange={e => { const next = [...workingForm]; next[idx] = { ...d, open: e.target.value }; setWorkingForm(next); }} />
                    </div>
                    <div>
                      <div className="text-muted-foreground">Fechamento</div>
                      <input type="time" className="w-full border rounded-md h-9 px-2 bg-background" value={d.close} onChange={e => { const next = [...workingForm]; next[idx] = { ...d, close: e.target.value }; setWorkingForm(next); }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Pausas (múltiplas)</h4>
                <Button size="sm" variant="outline" onClick={() => setBreaksForm(prev => [...prev, { day: defaultDays[0], start: '12:00', end: '13:00', label: 'Pausa' }])}>Adicionar Pausa</Button>
              </div>
              <div className="space-y-2">
                {breaksForm.map((br, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 items-end">
                    <div>
                      <div className="text-sm text-muted-foreground">Dia</div>
                      <select className="w-full border rounded-md h-9 px-2 bg-background" value={br.day} onChange={e => { const next=[...breaksForm]; next[idx]={...br, day:e.target.value}; setBreaksForm(next); }}>
                        {defaultDays.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Início</div>
                      <input type="time" className="w-full border rounded-md h-9 px-2 bg-background" value={br.start} onChange={e => { const next=[...breaksForm]; next[idx]={...br, start:e.target.value}; setBreaksForm(next); }} />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Fim</div>
                      <input type="time" className="w-full border rounded-md h-9 px-2 bg-background" value={br.end} onChange={e => { const next=[...breaksForm]; next[idx]={...br, end:e.target.value}; setBreaksForm(next); }} />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Rótulo</div>
                      <input className="w-full border rounded-md h-9 px-2 bg-background" placeholder="Pausa/Almoço" value={br.label || ''} onChange={e => { const next=[...breaksForm]; next[idx]={...br, label:e.target.value}; setBreaksForm(next); }} />
                    </div>
                    <div className="flex justify-end">
                      <Button variant="ghost" size="icon" onClick={() => setBreaksForm(prev => prev.filter((_,i)=>i!==idx))}>✕</Button>
                    </div>
                  </div>
                ))}
                {breaksForm.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma pausa adicionada.</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <div className="text-sm text-muted-foreground">Buffer (pré) min</div>
                <input type="number" min={0} className="w-full border rounded-md h-9 px-2 bg-background" value={preBufferMinutes} onChange={e => setPreBufferMinutes(Number(e.target.value) || 0)} />
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Buffer (pós) min</div>
                <input type="number" min={0} className="w-full border rounded-md h-9 px-2 bg-background" value={postBufferMinutes} onChange={e => setPostBufferMinutes(Number(e.target.value) || 0)} />
              </div>
              <div className="text-sm text-muted-foreground">Buffers aplicados ao iniciar e encerrar cada atendimento do profissional.</div>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setScheduleOpen(false)}>Cancelar</Button>
            <Button onClick={saveSchedule}>Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
