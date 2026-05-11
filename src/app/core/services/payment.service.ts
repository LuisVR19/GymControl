import { Injectable, computed, inject, signal } from '@angular/core';
import { supabase } from '../supabase/supabase.client';
import { AuthService } from './auth.service';
import type { Payment } from '../models';
import type { VPaymentRow, PaymentMethod } from '../supabase/database.types';

const METHOD_MAP: Record<string, Payment['method']> = {
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  efectivo: 'Efectivo',
  outro: 'Efectivo',
};

const STATUS_MAP: Record<string, Payment['status']> = {
  paid: 'pagado',
  pending: 'pendiente',
  failed: 'vencido',
  refunded: 'pagado',
};

const CONCEPT_MAP: Record<string, Payment['concept']> = {
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
};

function mapPayment(row: VPaymentRow): Payment {
  return {
    id: row.id,
    clientId: row.client_id,
    clientName: row.client_name,
    amount: row.amount,
    date: row.date,
    method: METHOD_MAP[row.method] ?? 'Efectivo',
    concept: CONCEPT_MAP[row.concept?.toLowerCase() ?? ''] ?? 'Personalizado',
    status: STATUS_MAP[row.status] ?? 'pendiente',
    periodFrom: row.period_from ?? undefined,
    periodTo: row.period_to ?? undefined,
    note: row.notes ?? undefined,
    daysLate: row.days_late || undefined,
  };
}

export interface RegisterPaymentPayload {
  membershipId: string;
  amount: number;
  date: string;
  method: Payment['method'];
  periodFrom?: string;
  periodTo?: string;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private auth = inject(AuthService);

  readonly payments = signal<Payment[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly pendingPayments = computed(() => this.payments().filter(p => p.status !== 'pagado'));
  readonly paidPayments = computed(() => this.payments().filter(p => p.status === 'pagado'));
  readonly totalIncome = computed(() => this.paidPayments().reduce((s, p) => s + p.amount, 0));
  readonly pendingTotal = computed(() => this.pendingPayments().reduce((s, p) => s + p.amount, 0));
  readonly pendingCount = computed(() => this.pendingPayments().length);

  readonly incomeByMonth = computed(() => {
    const year = new Date().getFullYear();
    const buckets = Array.from({ length: 12 }, () => 0);
    for (const p of this.paidPayments()) {
      const d = new Date(p.date);
      if (!isNaN(d.getTime()) && d.getFullYear() === year) {
        buckets[d.getMonth()] += p.amount;
      }
    }
    return buckets;
  });

  async loadPayments(): Promise<void> {
    const gymId = this.auth.gymId();
    if (!gymId) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await supabase
        .from('v_payments')
        .select('*')
        .eq('gym_id', gymId)
        .order('date', { ascending: false });

      if (error) this.error.set(error.message);
      else this.payments.set((data ?? []).map(mapPayment));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      this.loading.set(false);
    }
  }

  async registerPayment(payload: RegisterPaymentPayload): Promise<{ error: string | null }> {
    const dbMethod = payload.method.toLowerCase() as PaymentMethod;

    const { data: inserted, error } = await supabase
      .from('membership_payments')
      .insert({
        membership_id: payload.membershipId,
        amount: payload.amount,
        payment_date: payload.date,
        method: dbMethod,
        period_from: payload.periodFrom || null,
        period_to: payload.periodTo || null,
        status: 'paid',
        notes: payload.note || null,
      })
      .select()
      .single();

    if (error) return { error: error.message };

    const patch: Record<string, unknown> = { payment_status: 'active' };
    if (payload.periodTo) {
      const nextDate = new Date(payload.periodTo);
      nextDate.setDate(nextDate.getDate() + 1);
      patch['expiration_date']   = payload.periodTo;
      patch['next_payment_date'] = nextDate.toISOString().slice(0, 10);
    }
    await supabase
      .from('user_memberships')
      .update(patch)
      .eq('id', payload.membershipId);

    await this.loadPayments();
    return { error: null };
  }
}
