import { Injectable, inject, signal } from '@angular/core';
import { supabase } from '../supabase/supabase.client';
import { AuthService } from './auth.service';
import type { GymRow } from '../supabase/database.types';

@Injectable({ providedIn: 'root' })
export class GymService {
  private auth = inject(AuthService);

  readonly gym = signal<GymRow | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadGym(): Promise<void> {
    const gymId = this.auth.gymId();
    if (!gymId) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('id', gymId)
        .single();

      if (error) this.error.set(error.message);
      else this.gym.set(data);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      this.loading.set(false);
    }
  }

  async updateGym(patch: Partial<Pick<GymRow, 'name' | 'logo_url' | 'primary_color' | 'secondary_color'>>): Promise<{ error: string | null }> {
    const gymId = this.auth.gymId();
    if (!gymId) return { error: 'Sin gym activo' };

    const { error } = await supabase.from('gyms').update(patch).eq('id', gymId);
    if (!error) await this.loadGym();
    return { error: error?.message ?? null };
  }
}
