import { Injectable, inject, signal } from '@angular/core';
import { supabase } from '../supabase/supabase.client';
import { AuthService } from './auth.service';
import type { Routine, RoutineDay, Exercise } from '../models';

interface RoutineExerciseJoined {
  id: string;
  day_number: number | null;
  day_label: string | null;
  order_number: number | null;
  sets: number | null;
  reps: number | null;
  rest_seconds: number | null;
  exercises: { id: string; name: string; description: string | null } | null;
}

function mapRoutineRow(row: {
  id: string;
  name: string | null;
  description: string | null;
  created_at: string;
  routine_exercises: RoutineExerciseJoined[];
  user_routines: { user_id: string }[];
}): Routine {
  const grouped = new Map<number, RoutineExerciseJoined[]>();
  for (const re of row.routine_exercises) {
    const day = re.day_number ?? 0;
    if (!grouped.has(day)) grouped.set(day, []);
    grouped.get(day)!.push(re);
  }

  const days: RoutineDay[] = Array.from(grouped.entries())
    .sort(([a], [b]) => a - b)
    .map(([dayNum, exercises]) => ({
      day: exercises[0].day_label ?? `Día ${dayNum}`,
      exercises: exercises
        .sort((a, b) => (a.order_number ?? 0) - (b.order_number ?? 0))
        .map((re): Exercise => ({
          id: re.exercises?.id ?? re.id,
          name: re.exercises?.name ?? 'Ejercicio',
          sets: re.sets ?? 3,
          reps: re.reps != null ? String(re.reps) : '10-12',
          rest: re.rest_seconds != null ? `${re.rest_seconds}s` : '60s',
          notes: re.exercises?.description ?? undefined,
        })),
    }));

  return {
    id: row.id,
    name: row.name ?? 'Sin nombre',
    description: row.description ?? '',
    createdAt: row.created_at,
    days,
    assignedTo: row.user_routines.map(ur => ur.user_id),
  };
}

@Injectable({ providedIn: 'root' })
export class RoutineService {
  private auth = inject(AuthService);

  readonly routines = signal<Routine[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async loadRoutines(): Promise<void> {
    const gymId = this.auth.gymId();
    if (!gymId) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await supabase
        .from('routines')
        .select(`
          id, name, description, created_at,
          routine_exercises (
            id, day_number, day_label, order_number, sets, reps, rest_seconds,
            exercises ( id, name, description )
          ),
          user_routines ( user_id )
        `)
        .eq('gym_id', gymId)
        .order('created_at');

      if (error) this.error.set(error.message);
      else this.routines.set((data ?? []).map(r => mapRoutineRow(r as any)));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      this.loading.set(false);
    }
  }

  getById(id: string): Routine | undefined {
    return this.routines().find(r => r.id === id);
  }

  async createRoutine(name: string, description: string): Promise<{ id: string | null; error: string | null }> {
    const gymId = this.auth.gymId();
    if (!gymId) return { id: null, error: 'Sin gym activo' };

    const { data, error } = await supabase
      .from('routines')
      .insert({ gym_id: gymId, name, description })
      .select()
      .single();

    if (error) return { id: null, error: error.message };
    await this.loadRoutines();
    return { id: data.id, error: null };
  }

  async deleteRoutine(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('routines').delete().eq('id', id);
    if (!error) await this.loadRoutines();
    return { error: error?.message ?? null };
  }

  async assignClient(routineId: string, clientId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('user_routines')
      .insert({ routine_id: routineId, user_id: clientId });
    if (!error) await this.loadRoutines();
    return { error: error?.message ?? null };
  }

  async unassignClient(routineId: string, clientId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('user_routines')
      .delete()
      .eq('routine_id', routineId)
      .eq('user_id', clientId);
    if (!error) await this.loadRoutines();
    return { error: error?.message ?? null };
  }

  async addExercise(
    routineId: string,
    gymId: string,
    dayNumber: number,
    dayLabel: string,
    exercise: Omit<Exercise, 'id'>,
    orderNumber: number,
  ): Promise<{ error: string | null }> {
    const { data: exData, error: exError } = await supabase
      .from('exercises')
      .insert({ gym_id: gymId, name: exercise.name, description: exercise.notes ?? null })
      .select()
      .single();

    if (exError) return { error: exError.message };

    const restSecs = parseInt(exercise.rest, 10) || 60;
    const repsNum = parseInt(exercise.reps, 10) || 10;

    const { error } = await supabase.from('routine_exercises').insert({
      routine_id: routineId,
      exercise_id: exData.id,
      sets: exercise.sets,
      reps: repsNum,
      rest_seconds: restSecs,
      day_number: dayNumber,
      day_label: dayLabel,
      order_number: orderNumber,
    });

    if (!error) await this.loadRoutines();
    return { error: error?.message ?? null };
  }

  async removeExercise(routineExerciseId: string): Promise<{ error: string | null }> {
    const { error } = await supabase
      .from('routine_exercises')
      .delete()
      .eq('id', routineExerciseId);
    if (!error) await this.loadRoutines();
    return { error: error?.message ?? null };
  }
}
