import { getFunctions, httpsCallable } from 'firebase/functions';
import { FirebaseApp } from 'firebase/app';

export type CreateAdminUserInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'admin' | 'support';
};

export type UpdateUserRoleInput = {
  uid: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'support' | 'owner' | 'staff';
};

export type DeleteUserInput = { uid: string };

function functionsClient(app?: FirebaseApp) {
  return getFunctions(app, 'us-central1');
}

function unwrapError(e: any): string {
  if (!e) return 'Erro desconhecido';
  if (typeof e === 'string') return e;
  return e?.message || e?.toString?.() || 'Erro desconhecido';
}

export async function fnCreateAdminUser(input: CreateAdminUserInput, app?: FirebaseApp) {
  const fns = functionsClient(app);
  try {
    const callable = httpsCallable(fns, 'createAdminUser');
    const res = await callable(input);
    return res.data as any;
  } catch (e: any) {
    throw new Error(unwrapError(e));
  }
}

export async function fnUpdateUserRole(input: UpdateUserRoleInput, app?: FirebaseApp) {
  const fns = functionsClient(app);
  try {
    const callable = httpsCallable(fns, 'updateUserRole');
    const res = await callable(input);
    return res.data as any;
  } catch (e: any) {
    throw new Error(unwrapError(e));
  }
}

export async function fnDeleteUser(input: DeleteUserInput, app?: FirebaseApp) {
  const fns = functionsClient(app);
  try {
    const callable = httpsCallable(fns, 'deleteUser');
    const res = await callable(input);
    return res.data as any;
  } catch (e: any) {
    throw new Error(unwrapError(e));
  }
}
