
'use client';

import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  FileText, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  LogOut,
  Activity 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Backend actions recorded in adminLogs
const ACTION_LABELS: Record<string, string> = {
  createAdminUser: 'Criação de usuário (equipe)',
  updateUserRole: 'Atualização de papel',
  deleteUser: 'Remoção de usuário',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  createAdminUser: <CheckCircle className="h-4 w-4 text-green-500" />,
  updateUserRole: <Activity className="h-4 w-4 text-purple-500" />,
  deleteUser: <XCircle className="h-4 w-4 text-red-500" />,
};

export default function CPanelLogsPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');

  // Query para buscar os logs mais recentes
  const logsQuery = useMemoFirebase(() => {
    return query(
      collection(firestore, 'adminLogs'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  }, [firestore]);

  const { data: logs, isLoading } = useCollection<any>(logsQuery);

  // Filtrar logs
  const filteredLogs = useMemo(() => {
    if (!logs) return [];

    let filtered = logs;

    // Filtro por ação
    if (filterAction !== 'all') {
      filtered = filtered.filter((log: any) => log.action === filterAction);
    }

    // Filtro por busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((log: any) => 
        (log.actorUid && log.actorUid.toLowerCase().includes(searchLower)) ||
        (log.targetUid && log.targetUid.toLowerCase().includes(searchLower)) ||
        (log.action && log.action.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [logs, searchTerm, filterAction]);

  // Estatísticas
  const stats = useMemo(() => {
    if (!logs) return {
      total: 0,
      created: 0,
      updated: 0,
      deleted: 0,
    };

    return {
      total: logs.length,
      created: logs.filter((l: any) => l.action === 'createAdminUser').length,
      updated: logs.filter((l: any) => l.action === 'updateUserRole').length,
      deleted: logs.filter((l: any) => l.action === 'deleteUser').length,
    };
  }, [logs]);

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    
    let date: Date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    return format(date, "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
          <FileText />
          Logs Administrativos
        </h1>
        <p className="text-muted-foreground">
          Histórico completo de acessos e ações administrativas.
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Criações</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats.created}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atualizações</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-purple-600">{stats.updated}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Remoções</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats.deleted}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ator (actorUid), alvo (targetUid) ou ação..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-full sm:w-[240px]">
            <SelectValue placeholder="Filtrar por ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as ações</SelectItem>
            <SelectItem value="createAdminUser">Criação de usuário (equipe)</SelectItem>
            <SelectItem value="updateUserRole">Atualização de papel</SelectItem>
            <SelectItem value="deleteUser">Remoção de usuário</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Logs */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Ação</TableHead>
              <TableHead className="hidden md:table-cell">Ator</TableHead>
              <TableHead className="hidden lg:table-cell">Alvo</TableHead>
              <TableHead className="hidden xl:table-cell">Detalhes</TableHead>
              <TableHead className="hidden 2xl:table-cell">Data/Hora</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({length: 5}).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
              </TableRow>
            ))}
            
            {!isLoading && filteredLogs.map((log: any) => (
              <TableRow key={log.id}>
                <TableCell>
                  {ACTION_ICONS[log.action] || <FileText className="h-4 w-4 text-muted-foreground" />}
                </TableCell>
                <TableCell>
                  <Badge variant={log.action === 'deleteUser' ? 'destructive' : log.action === 'updateUserRole' ? 'secondary' : 'default'}>
                    {ACTION_LABELS[log.action] || log.action}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs">{log.actorUid || '-'}</TableCell>
                <TableCell className="hidden lg:table-cell font-mono text-xs">{log.targetUid || '-'}</TableCell>
                <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                  {log.payload ? (
                    <span className="truncate max-w-[280px] block">{JSON.stringify(log.payload)}</span>
                  ) : '-'}
                </TableCell>
                <TableCell className="hidden 2xl:table-cell text-sm">
                  {formatTimestamp(log.createdAt || log.timestamp)}
                </TableCell>
              </TableRow>
            ))}
            
            {!isLoading && filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchTerm || filterAction !== 'all' 
                    ? 'Nenhum log encontrado com os filtros aplicados.' 
                    : 'Nenhum log registrado ainda.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Mostrando {filteredLogs.length} de {logs?.length || 0} logs
        </p>
        <p>
          <Shield className="inline h-3 w-3 mr-1" />
          Últimos 100 registros (ordenado por criação)
        </p>
      </div>
    </div>
  );
}
