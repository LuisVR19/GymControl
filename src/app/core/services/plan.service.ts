import { Injectable, computed, inject, signal } from '@angular/core';
import { supabase } from '../supabase/supabase.client';
import { AuthService } from './auth.service';
import type { GymPlan } from '../models';
import type { GymPlanRow } from '../supabase/database.types';

export interface PlanPayload {
  name: string;
  price: number;
  durationDays: number;
  description?: string | null;
  isActive?: boolean;
  color?: string;
  features?: string[];
  accessType?: string;
  maxVisits?: number | null;
}

function mapPlan(row: GymPlanRow, subscriberCount = 0): GymPlan {
  return {
    id:              row.id,
    gymId:           row.gym_id,
    name:            row.name,
    description:     row.description,
    price:           row.price,
    durationDays:    row.duration_days,
    isActive:        row.is_active,
    color:           row.color ?? 'lime',
    features:        (row.features as string[]) ?? [],
    accessType:      row.access_type ?? 'unlimited',
    maxVisits:       row.max_visits ?? null,
    subscriberCount,
  };
}

@Injectable({ providedIn: 'root' })
export class PlanService {
  private auth = inject(AuthService);

  readonly plans   = signal<GymPlan[]>([]);
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  readonly activePlans = computed(() => this.plans().filter(p => p.isActive));

  async loadPlans(): Promise<void> {
    const gymId = this.auth.gymId();
    if (!gymId) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const [plansResult, subsResult] = await Promise.all([
        supabase.from('gym_plans').select('*').eq('gym_id', gymId).order('price'),
        supabase.from('user_memberships').select('plan_id').eq('gym_id', gymId).eq('is_current', true),
      ]);

      if (plansResult.error) {
        this.error.set(plansResult.error.message);
        return;
      }

      const countMap: Record<string, number> = {};
      for (const row of subsResult.data ?? []) {
        countMap[row.plan_id] = (countMap[row.plan_id] ?? 0) + 1;
      }

      this.plans.set((plansResult.data ?? []).map(r => mapPlan(r as GymPlanRow, countMap[r.id] ?? 0)));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      this.loading.set(false);
    }
  }

  getById(id: string): GymPlan | undefined {
    return this.plans().find(p => p.id === id);
  }

  async createPlan(gymId: string, payload: PlanPayload): Promise<{ id: string | null; error: string | null }> {
    const { data, error } = await supabase
      .from('gym_plans')
      .insert({
        gym_id:        gymId,
        name:          payload.name,
        price:         payload.price,
        duration_days: payload.durationDays,
        description:   payload.description ?? null,
        is_active:     payload.isActive ?? true,
        color:         payload.color ?? 'lime',
        features:      payload.features ?? [],
        access_type:   payload.accessType ?? 'unlimited',
        max_visits:    payload.maxVisits ?? null,
      })
      .select()
      .single();

    if (error) return { id: null, error: error.message };
    await this.loadPlans();
    return { id: data.id, error: null };
  }

  async updatePlan(id: string, payload: Partial<PlanPayload>): Promise<{ error: string | null }> {
    const patch: Record<string, unknown> = {};
    if (payload.name          !== undefined) patch['name']          = payload.name;
    if (payload.price         !== undefined) patch['price']         = payload.price;
    if (payload.durationDays  !== undefined) patch['duration_days'] = payload.durationDays;
    if (payload.description   !== undefined) patch['description']   = payload.description;
    if (payload.isActive      !== undefined) patch['is_active']     = payload.isActive;
    if (payload.color         !== undefined) patch['color']         = payload.color;
    if (payload.features      !== undefined) patch['features']      = payload.features;
    if (payload.accessType    !== undefined) patch['access_type']   = payload.accessType;
    if (payload.maxVisits     !== undefined) patch['max_visits']    = payload.maxVisits;

    const { error } = await supabase.from('gym_plans').update(patch).eq('id', id);
    if (!error) await this.loadPlans();
    return { error: error?.message ?? null };
  }

  async deletePlan(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('gym_plans').delete().eq('id', id);
    if (!error) await this.loadPlans();
    return { error: error?.message ?? null };
  }

  async duplicatePlan(plan: GymPlan): Promise<{ error: string | null }> {
    return this.createPlan(plan.gymId, {
      name:         plan.name + ' (copia)',
      price:        plan.price,
      durationDays: plan.durationDays,
      description:  plan.description,
      isActive:     false,
      color:        plan.color,
      features:     [...plan.features],
      accessType:   plan.accessType,
      maxVisits:    plan.maxVisits,
    }).then(r => ({ error: r.error }));
  }

  conceptFromDays(days: number): 'Mensual' | 'Trimestral' | 'Semestral' | 'Anual' | 'Personalizado' {
    if (days <= 31)  return 'Mensual';
    if (days <= 92)  return 'Trimestral';
    if (days <= 184) return 'Semestral';
    if (days <= 366) return 'Anual';
    return 'Personalizado';
  }
}
