import { Component, DestroyRef, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HeaderComponent } from '../../core/layout/header/header.component';
import { ExerciseService } from '../../core/services/exercise.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import type { GymExercise } from '../../core/models';

@Component({
  selector: 'app-exercises',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './exercises.component.html',
  styleUrl: './exercises.component.scss',
})
export class ExercisesComponent implements OnInit {
  readonly exerciseService = inject(ExerciseService);
  private auth       = inject(AuthService);
  private toast      = inject(ToastService);

  constructor() {
    effect(() => {
      const gymId = this.auth.gymId();
      untracked(() => {
        if (gymId && !this.exerciseService.exercises().length && !this.exerciseService.loading()) {
          this.loadData();
        }
      });
    });
  }
  private sanitizer  = inject(DomSanitizer);
  private destroyRef = inject(DestroyRef);

  readonly loading  = this.exerciseService.loading;
  readonly error    = this.exerciseService.error;

  readonly searchQuery   = signal('');
  readonly selected      = signal<GymExercise | null>(null);
  readonly editMode      = signal(false);
  readonly saving        = signal(false);
  readonly uploading     = signal(false);
  readonly submitting    = signal(false);
  readonly showNewModal  = signal(false);
  readonly videoTab      = signal<'upload' | 'youtube'>('upload');
  readonly draftYoutubeUrl = signal('');

  draft = { name: '', description: '', muscleGroup: '' };
  newName = '';
  newDesc = '';
  newMuscleGroup = '';

  readonly muscleGroups = ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Piernas', 'Glúteos', 'Abdomen', 'Cardio', 'Full Body'];
  readonly skeletonRows = Array(6);

  readonly filteredExercises = computed(() => {
    const q = this.searchQuery().toLowerCase();
    if (!q) return this.exerciseService.exercises();
    return this.exerciseService.exercises().filter(e =>
      e.name.toLowerCase().includes(q) ||
      (e.muscleGroup?.toLowerCase() ?? '').includes(q)
    );
  });

  readonly embedUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.selected()?.youtubeUrl;
    if (!url) return null;
    const id = this.extractYoutubeId(url);
    if (!id) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}`);
  });

  readonly draftEmbedUrl = computed<SafeResourceUrl | null>(() => {
    const url = this.draftYoutubeUrl();
    if (!url) return null;
    const id = this.extractYoutubeId(url);
    if (!id) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}`);
  });

  ngOnInit(): void {
    this.loadData();
    const onVisible = () => { if (document.visibilityState === 'visible') this.loadData(); };
    document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
  }

  private loadData(): void {
    this.exerciseService.loadExercises();
  }

  select(ex: GymExercise): void {
    this.selected.set(ex);
    this.editMode.set(false);
  }

  startEdit(): void {
    const ex = this.selected();
    if (!ex) return;
    this.draft = { name: ex.name, description: ex.description ?? '', muscleGroup: ex.muscleGroup ?? '' };
    this.draftYoutubeUrl.set(ex.youtubeUrl ?? '');
    this.videoTab.set(ex.youtubeUrl ? 'youtube' : 'upload');
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.editMode.set(false);
  }

  async saveEdit(): Promise<void> {
    const ex = this.selected();
    if (!ex) return;
    this.saving.set(true);
    try {
      const { error } = await this.exerciseService.updateExercise(ex.id, {
        name:        this.draft.name.trim() || ex.name,
        description: this.draft.description || null,
        muscleGroup: this.draft.muscleGroup || null,
        youtubeUrl:  this.draftYoutubeUrl() || null,
      });
      if (error) { this.toast.error('Error al guardar: ' + error); return; }
      this.toast.success('Ejercicio actualizado');
      this.editMode.set(false);
      const updated = this.exerciseService.exercises().find(e => e.id === ex.id);
      if (updated) this.selected.set(updated);
    } finally {
      this.saving.set(false);
    }
  }

  async deleteSelected(): Promise<void> {
    if (!confirm('¿Eliminar este ejercicio?')) return;
    const ex = this.selected();
    if (!ex) return;
    const { error } = await this.exerciseService.deleteExercise(ex.id);
    if (error) { this.toast.error('Error al eliminar'); return; }
    this.toast.warn('Ejercicio eliminado');
    this.selected.set(null);
    this.editMode.set(false);
  }

  async onVideoSelected(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const ex    = this.selected();
    const gymId = this.auth.gymId();
    if (!ex || !gymId) return;

    this.uploading.set(true);
    try {
      const { url, error } = await this.exerciseService.uploadVideo(gymId, ex.id, file);
      if (error) { this.toast.error('Error al subir video: ' + error); return; }
      const { error: updateErr } = await this.exerciseService.updateExercise(ex.id, { videoUrl: url });
      if (updateErr) { this.toast.error('Error al guardar URL del video'); return; }
      this.toast.success('Video subido correctamente');
      const updated = this.exerciseService.exercises().find(e => e.id === ex.id);
      if (updated) this.selected.set(updated);
    } finally {
      this.uploading.set(false);
      (event.target as HTMLInputElement).value = '';
    }
  }

  async removeVideo(): Promise<void> {
    const ex = this.selected();
    if (!ex) return;
    const { error } = await this.exerciseService.updateExercise(ex.id, { videoUrl: null });
    if (error) { this.toast.error('Error al eliminar video'); return; }
    this.toast.info('Video eliminado');
    const updated = this.exerciseService.exercises().find(e => e.id === ex.id);
    if (updated) this.selected.set(updated);
  }

  async removeYoutube(): Promise<void> {
    const ex = this.selected();
    if (!ex) return;
    const { error } = await this.exerciseService.updateExercise(ex.id, { youtubeUrl: null });
    if (error) { this.toast.error('Error al eliminar enlace'); return; }
    this.toast.info('Enlace eliminado');
    this.draftYoutubeUrl.set('');
    const updated = this.exerciseService.exercises().find(e => e.id === ex.id);
    if (updated) this.selected.set(updated);
  }

  async createExercise(): Promise<void> {
    const name = this.newName.trim();
    if (!name) return;
    const gymId = this.auth.gymId();
    if (!gymId) return;
    this.submitting.set(true);
    try {
      const { id, error } = await this.exerciseService.createExercise(gymId, {
        name,
        description: this.newDesc || null,
        muscleGroup: this.newMuscleGroup || null,
      });
      if (error) { this.toast.error('Error al crear: ' + error); return; }
      this.toast.success('Ejercicio creado');
      this.showNewModal.set(false);
      this.newName = '';
      this.newDesc = '';
      this.newMuscleGroup = '';
      const created = this.exerciseService.exercises().find(e => e.id === id);
      if (created) {
        this.selected.set(created);
        this.draft = { name: created.name, description: created.description ?? '', muscleGroup: created.muscleGroup ?? '' };
        this.draftYoutubeUrl.set('');
        this.videoTab.set('upload');
        this.editMode.set(true);
      }
    } finally {
      this.submitting.set(false);
    }
  }

  private extractYoutubeId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/,
      /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  }

  retry(): void { this.exerciseService.loadExercises(); }
}
