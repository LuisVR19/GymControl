import { Injectable, computed, inject, signal } from '@angular/core';
import { supabase } from '../supabase/supabase.client';
import { AuthService } from './auth.service';
import type { Client, ProgressEntry } from '../models';
import type { VClientRow, ClientProgressRow } from '../supabase/database.types';

function mapClient(row: VClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? '',
    phone: row.phone ?? '',
    plan: row.plan_name ?? null,
    status: row.status,
    joinDate: row.join_date,
    nextPayment: row.next_payment_date ?? '—',
    monthlyFee: row.monthly_fee ?? 0,
    attendanceThisMonth: row.attendance_this_month ?? 0,
    assignedRoutine: row.assigned_routine_id ?? undefined,
    weight: row.current_weight ?? undefined,
    lastWorkout: row.last_workout ?? undefined,
  };
}

function mapProgress(row: ClientProgressRow): ProgressEntry {
  return {
    date: row.date,
    weight: row.weight ?? 0,
    bodyFat: row.body_fat ?? undefined,
  };
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private auth = inject(AuthService);
  private _reqId = 0;

  readonly clients = signal<Client[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly activeClients = computed(() => this.clients().filter(c => c.status === 'activo'));
  readonly overdueClients = computed(() => this.clients().filter(c => c.status === 'moroso'));
  readonly inactiveClients = computed(() => this.clients().filter(c => c.status === 'inactivo'));

  async loadClients(): Promise<void> {
    const gymId = this.auth.gymId();
    if (!gymId) return;

    const reqId = ++this._reqId;
    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await supabase
        .from('v_clients')
        .select('*')
        .eq('gym_id', gymId)
        .order('name');

      if (reqId !== this._reqId) return;
      if (error) this.error.set(error.message);
      else this.clients.set((data ?? []).map(mapClient));
    } catch (err) {
      if (reqId !== this._reqId) return;
      this.error.set(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      if (reqId === this._reqId) this.loading.set(false);
    }
  }

  getById(id: string): Client | undefined {
    return this.clients().find(c => c.id === id);
  }

  async loadClientProgress(clientId: string): Promise<ProgressEntry[]> {
    const { data, error } = await supabase
      .from('client_progress')
      .select('id, user_id, date, weight, body_fat, notes, created_at')
      .eq('user_id', clientId)
      .order('date', { ascending: true });

    if (error) return [];
    return (data ?? []).map(mapProgress);
  }

  async getMembershipIdForClient(clientId: string): Promise<string | null> {
    const { data } = await supabase
      .from('user_memberships')
      .select('id')
      .eq('user_id', clientId)
      .eq('is_current', true)
      .single();
    return data?.id ?? null;
  }

  async assignMembership(
    clientId: string,
    gymId: string,
    planId: string,
    startDate: string,
    durationDays: number,
    price: number,
    method: 'tarjeta' | 'transferencia' | 'efectivo',
  ): Promise<{ error: string | null }> {
    // Expire any existing active membership for this client
    await supabase
      .from('user_memberships')
      .update({ is_current: false })
      .eq('user_id', clientId)
      .eq('gym_id', gymId)
      .eq('is_current', true);

    const start      = new Date(startDate);
    const expiry     = new Date(start);
    expiry.setDate(expiry.getDate() + durationDays);
    const expiryStr  = expiry.toISOString().slice(0, 10);

    const { data: membership, error: memErr } = await supabase
      .from('user_memberships')
      .insert({
        user_id:           clientId,
        gym_id:            gymId,
        plan_id:           planId,
        start_date:        startDate,
        expiration_date:   expiryStr,
        next_payment_date: expiryStr,
        payment_status:    'active',
        is_current:        true,
      })
      .select()
      .single();

    if (memErr) return { error: memErr.message };

    const { error: payErr } = await supabase
      .from('membership_payments')
      .insert({
        membership_id: membership.id,
        amount:        price,
        payment_date:  startDate,
        status:        'paid',
        method,
        period_from:   startDate,
        period_to:     expiryStr,
      });

    if (payErr) return { error: payErr.message };

    await this.loadClients();
    return { error: null };
  }
}
