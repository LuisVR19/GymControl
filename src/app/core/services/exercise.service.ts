import { Injectable, inject, signal } from '@angular/core';
import { supabase } from '../supabase/supabase.client';
import { AuthService } from './auth.service';
import type { GymExercise } from '../models';
import type { ExerciseRow } from '../supabase/database.types';

function mapExercise(row: ExerciseRow): GymExercise {
  return {
    id:          row.id,
    gymId:       row.gym_id,
    name:        row.name,
    description: row.description,
    videoUrl:    row.video_url,
    youtubeUrl:  row.youtube_url,
    muscleGroup: row.muscle_group,
    createdAt:   row.created_at,
  };
}

export interface ExercisePayload {
  name: string;
  description?: string | null;
  muscleGroup?: string | null;
  youtubeUrl?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private auth = inject(AuthService);

  readonly exercises = signal<GymExercise[]>([]);
  readonly loading   = signal(false);
  readonly error     = signal<string | null>(null);

  async loadExercises(): Promise<void> {
    const gymId = this.auth.gymId();
    if (!gymId) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      const { data, error } = await supabase
        .from('exercises').select('*').eq('gym_id', gymId).order('name');
      if (error) this.error.set(error.message);
      else this.exercises.set((data ?? []).map(r => mapExercise(r as ExerciseRow)));
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      this.loading.set(false);
    }
  }

  async createExercise(gymId: string, payload: ExercisePayload): Promise<{ id: string | null; error: string | null }> {
    const { data, error } = await supabase
      .from('exercises')
      .insert({ gym_id: gymId, name: payload.name, description: payload.description ?? null, muscle_group: payload.muscleGroup ?? null })
      .select().single();
    if (error) return { id: null, error: error.message };
    await this.loadExercises();
    return { id: data.id, error: null };
  }

  async updateExercise(id: string, payload: Partial<ExercisePayload> & { videoUrl?: string | null; youtubeUrl?: string | null }): Promise<{ error: string | null }> {
    const patch: Record<string, unknown> = {};
    if (payload.name        !== undefined) patch['name']         = payload.name;
    if (payload.description !== undefined) patch['description']  = payload.description;
    if (payload.muscleGroup !== undefined) patch['muscle_group'] = payload.muscleGroup;
    if (payload.videoUrl    !== undefined) patch['video_url']    = payload.videoUrl;
    if (payload.youtubeUrl  !== undefined) patch['youtube_url']  = payload.youtubeUrl;
    const { error } = await supabase.from('exercises').update(patch).eq('id', id);
    if (!error) await this.loadExercises();
    return { error: error?.message ?? null };
  }

  async deleteExercise(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('exercises').delete().eq('id', id);
    if (!error) await this.loadExercises();
    return { error: error?.message ?? null };
  }

  // Uploads to Supabase Storage bucket "exercise-videos"
  async uploadVideo(gymId: string, exerciseId: string, file: File): Promise<{ url: string | null; error: string | null }> {
    const ext  = file.name.split('.').pop() ?? 'mp4';
    const path = `${gymId}/${exerciseId}.${ext}`;
    const { data, error } = await supabase.storage
      .from('exercise-media')
      .upload(path, file, { upsert: true });
    if (error) return { url: null, error: error.message };
    const { data: { publicUrl } } = supabase.storage.from('exercise-media').getPublicUrl(data.path);
    return { url: publicUrl, error: null };
  }
}
