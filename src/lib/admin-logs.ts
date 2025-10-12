import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

export interface AdminLog {
  id?: string;
  type: 'login_success' | 'login_failed' | 'logout' | 'action' | 'security_alert';
  userId?: string;
  email: string;
  action?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Timestamp | Date;
  metadata?: {
    errorCode?: string;
    errorMessage?: string;
    reason?: string;
  };
}

/**
 * Registra um log de acesso/ação administrativa
 */
export async function logAdminAction(
  firestore: Firestore,
  log: Omit<AdminLog, 'timestamp' | 'id'>
): Promise<void> {
  try {
    const logsCollection = collection(firestore, 'adminLogs');
    
    // Adiciona informações do browser
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown';
    
    await addDoc(logsCollection, {
      ...log,
      userAgent,
      timestamp: serverTimestamp(),
    });
    
    console.log('[Admin Log] Registrado:', log.type, log.email);
  } catch (error) {
    // Não queremos que um erro de log quebre a aplicação
    console.error('[Admin Log] Erro ao registrar log:', error);
  }
}

/**
 * Registra tentativa de login bem-sucedida
 */
export async function logLoginSuccess(
  firestore: Firestore,
  userId: string,
  email: string,
  additionalDetails?: Record<string, any>
): Promise<void> {
  return logAdminAction(firestore, {
    type: 'login_success',
    userId,
    email,
    action: 'Login administrativo realizado com sucesso',
    details: additionalDetails,
  });
}

/**
 * Registra tentativa de login falhada
 */
export async function logLoginFailed(
  firestore: Firestore,
  email: string,
  reason: string,
  errorCode?: string,
  errorMessage?: string
): Promise<void> {
  return logAdminAction(firestore, {
    type: 'login_failed',
    email,
    action: 'Tentativa de login administrativo falhou',
    metadata: {
      reason,
      errorCode,
      errorMessage,
    },
  });
}

/**
 * Registra logout administrativo
 */
export async function logLogout(
  firestore: Firestore,
  userId: string,
  email: string
): Promise<void> {
  return logAdminAction(firestore, {
    type: 'logout',
    userId,
    email,
    action: 'Logout administrativo',
  });
}

/**
 * Registra uma ação administrativa importante
 */
export async function logAction(
  firestore: Firestore,
  userId: string,
  email: string,
  action: string,
  details?: Record<string, any>
): Promise<void> {
  return logAdminAction(firestore, {
    type: 'action',
    userId,
    email,
    action,
    details,
  });
}

/**
 * Registra um alerta de segurança
 */
export async function logSecurityAlert(
  firestore: Firestore,
  email: string,
  reason: string,
  details?: Record<string, any>
): Promise<void> {
  return logAdminAction(firestore, {
    type: 'security_alert',
    email,
    action: 'Alerta de segurança',
    details: {
      reason,
      ...details,
    },
  });
}

/**
 * Obtém informações básicas do navegador (sem identificação pessoal)
 */
export function getBrowserInfo(): Record<string, any> {
  if (typeof window === 'undefined') {
    return {};
  }

  return {
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${window.screen.width}x${window.screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

