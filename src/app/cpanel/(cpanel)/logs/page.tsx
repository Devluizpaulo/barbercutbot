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
import type { AdminLog } from '@/lib/admin-logs';
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

const LOG_TYPE_LABELS: Record<string, string> = {
  login_success: 'Login Sucesso',
  login_failed: 'Login Falhou',
  logout: 'Logout',
  action: 'Ação',
  security_alert: 'Alerta Segurança',
};

const LOG_TYPE_ICONS: Record<string, React.ReactNode> = {
  login_success: <CheckCircle className="h-4 w-4 text-green-500" />,
  login_failed: <XCircle className="h-4 w-4 text-red-500" />,
  logout: <LogOut className="h-4 w-4 text-blue-500" />,
  action: <Activity className="h-4 w-4 text-purple-500" />,
  security_alert: <AlertTriangle className="h-4 w-4 text-amber-500" />,
};

export default function CPanelLogsPage() {
  const firestore = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  // Query para buscar os logs mais recentes
  const logsQuery = useMemoFirebase(() => {
    return query(
      collection(firestore, 'adminLogs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
  }, [firestore]);

  const { data: logs, isLoading } = useCollection<AdminLog>(logsQuery);

  // Filtrar logs
  const filteredLogs = useMemo(() => {
    if (!logs) return [];

    let filtered = logs;

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(log => log.type === filterType);
    }

    // Filtro por busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(log => 
        log.email.toLowerCase().includes(searchLower) ||
        log.action?.toLowerCase().includes(searchLower) ||
        log.userId?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [logs, searchTerm, filterType]);

  // Estatísticas
  const stats = useMemo(() => {
    if (!logs) return {
      total: 0,
      success: 0,
      failed: 0,
      alerts: 0,
    };

    return {
      total: logs.length,
      success: logs.filter(l => l.type === 'login_success').length,
      failed: logs.filter(l => l.type === 'login_failed').length,
      alerts: logs.filter(l => l.type === 'security_alert').length,
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
            <CardTitle className="text-sm font-medium">Logins Sucesso</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Falhas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold text-amber-600">{stats.alerts}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por email, ação ou ID..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="login_success">Login Sucesso</SelectItem>
            <SelectItem value="login_failed">Login Falhou</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
            <SelectItem value="action">Ações</SelectItem>
            <SelectItem value="security_alert">Alertas de Segurança</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela de Logs */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden md:table-cell">Ação</TableHead>
              <TableHead className="hidden lg:table-cell">Data/Hora</TableHead>
              <TableHead className="hidden xl:table-cell">Navegador</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && Array.from({length: 5}).map((_, i) => (
              <TableRow key={i}>
                <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
              </TableRow>
            ))}
            
            {!isLoading && filteredLogs.map((log) => (
              <TableRow key={log.id}>
                <TableCell>
                  {LOG_TYPE_ICONS[log.type]}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      log.type === 'login_success' ? 'default' :
                      log.type === 'login_failed' ? 'destructive' :
                      log.type === 'security_alert' ? 'destructive' :
                      'secondary'
                    }
                  >
                    {LOG_TYPE_LABELS[log.type] || log.type}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{log.email}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="text-sm text-muted-foreground">
                    {log.action || '-'}
                  </span>
                  {log.metadata?.reason && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {log.metadata.reason}
                    </div>
                  )}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-sm">
                  {formatTimestamp(log.timestamp)}
                </TableCell>
                <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                  {log.userAgent ? (
                    <span className="truncate max-w-[200px] block">
                      {log.userAgent.substring(0, 50)}...
                    </span>
                  ) : '-'}
                </TableCell>
              </TableRow>
            ))}
            
            {!isLoading && filteredLogs.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchTerm || filterType !== 'all' 
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
          Últimos 100 registros
        </p>
      </div>
    </div>
  );
}

