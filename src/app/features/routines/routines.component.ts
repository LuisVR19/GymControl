import { Component, DestroyRef, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../core/layout/header/header.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { RoutineService } from '../../core/services/routine.service';
import { ClientService } from '../../core/services/client.service';
import { ExerciseService } from '../../core/services/exercise.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import type { Routine, RoutineDay, Exercise, GymExercise } from '../../core/models';

@Component({
  selector: 'app-routines',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, AvatarComponent],
  templateUrl: './routines.component.html',
  styleUrl: './routines.component.scss',
})
export class RoutinesComponent implements OnInit {
  readonly routineService  = inject(RoutineService);
  readonly clientService   = inject(ClientService);
  readonly exerciseService = inject(ExerciseService);
  private readonly auth    = inject(AuthService);
  private readonly toast   = inject(ToastService);
  private destroyRef       = inject(DestroyRef);

  constructor() {
    effect(() => {
      const gymId = this.auth.gymId();
      untracked(() => {
        if (gymId && !this.routineService.routines().length && !this.routineService.loading()) {
          this.loadData();
        }
      });
    });
  }

  readonly loading = this.routineService.loading;
  readonly error   = this.routineService.error;

  readonly selectedRoutine     = signal<Routine | null>(null);
  readonly editMode            = signal(false);
  readonly activeDay           = signal(0);
  readonly showAssignModal      = signal(false);
  readonly showNewRoutineModal  = signal(false);
  readonly submitting           = signal(false);
  readonly pendingAssignments   = signal<Set<string>>(new Set());
  readonly showExercisePicker   = signal(false);
  readonly exercisePickerQuery  = signal('');

  readonly filteredLibrary = computed(() => {
    const q = this.exercisePickerQuery().toLowerCase();
    return !q
      ? this.exerciseService.exercises()
      : this.exerciseService.exercises().filter(e => e.name.toLowerCase().includes(q));
  });

  newRoutineName = '';
  newRoutineDesc = '';

  ngOnInit(): void {
    this.loadData();
    const onVisible = () => { if (document.visibilityState === 'visible') this.loadData(); };
    document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
  }

  private loadData(): void {
    this.clientService.loadClients();
    this.exerciseService.loadExercises();
    this.routineService.loadRoutines().then(() => {
      if (!this.selectedRoutine()) {
        const first = this.routineService.routines()[0];
        if (first) this.selectedRoutine.set(first);
      }
    });
  }

  selectRoutine(r: Routine): void {
    this.selectedRoutine.set(r);
    this.activeDay.set(0);
    this.editMode.set(false);
    this.showExercisePicker.set(false);
    this.exercisePickerQuery.set('');
  }

  totalExercises(r: Routine): number {
    return r.days.reduce((sum, d) => sum + d.exercises.length, 0);
  }

  totalSets(r: Routine): number {
    return r.days.reduce((sum, d) => sum + d.exercises.reduce((s, e) => s + e.sets, 0), 0);
  }

  getAssignedClients(r: Routine) {
    return this.clientService.clients().filter(c => r.assignedTo?.includes(c.id));
  }

  addExercise(day: RoutineDay): void {
    const ex: Exercise = { id: 'tmp-' + Date.now(), name: 'Nuevo ejercicio', sets: 3, reps: '10-12', rest: '60s' };
    day.exercises.push(ex);
    this.showExercisePicker.set(false);
  }

  addFromLibrary(gymEx: GymExercise, day: RoutineDay): void {
    day.exercises.push({
      id:    gymEx.id,
      name:  gymEx.name,
      sets:  3,
      reps:  '10-12',
      rest:  '60s',
      notes: gymEx.description ?? undefined,
    });
    this.showExercisePicker.set(false);
    this.exercisePickerQuery.set('');
  }

  removeExercise(day: RoutineDay, idx: number): void {
    day.exercises.splice(idx, 1);
  }

  retry(): void {
    this.routineService.loadRoutines();
  }

  async createRoutine(): Promise<void> {
    const name = this.newRoutineName.trim() || 'Nueva rutina';
    this.submitting.set(true);
    try {
      const { id, error } = await this.routineService.createRoutine(name, this.newRoutineDesc);
      if (!error && id) {
        const created = this.routineService.getById(id);
        if (created) { this.selectedRoutine.set(created); this.editMode.set(true); }
        this.showNewRoutineModal.set(false);
        this.newRoutineName = '';
        this.newRoutineDesc = '';
        this.toast.success('Rutina creada correctamente');
      } else if (error) {
        this.toast.error('Error al crear rutina: ' + error);
      }
    } finally {
      this.submitting.set(false);
    }
  }

  openAssignModal(): void {
    this.pendingAssignments.set(new Set(this.selectedRoutine()?.assignedTo ?? []));
    this.showAssignModal.set(true);
  }

  togglePending(clientId: string): void {
    const s = new Set(this.pendingAssignments());
    if (s.has(clientId)) { s.delete(clientId); } else { s.add(clientId); }
    this.pendingAssignments.set(s);
  }

  async saveAssignments(): Promise<void> {
    const routine = this.selectedRoutine();
    if (!routine) return;

    const original = new Set(routine.assignedTo ?? []);
    const pending  = this.pendingAssignments();
    const toAssign   = [...pending].filter(id => !original.has(id));
    const toUnassign = [...original].filter(id => !pending.has(id));

    this.submitting.set(true);
    let hasError = false;
    try {
      for (const clientId of toAssign) {
        const { error } = await this.routineService.assignClient(routine.id, clientId);
        if (error) { hasError = true; this.toast.error('Error al asignar: ' + error); }
      }
      for (const clientId of toUnassign) {
        const { error } = await this.routineService.unassignClient(routine.id, clientId);
        if (error) { hasError = true; this.toast.error('Error al desasignar: ' + error); }
      }
    } finally {
      this.submitting.set(false);
      this.showAssignModal.set(false);
    }

    const updated = this.routineService.getById(routine.id);
    if (updated) this.selectedRoutine.set(updated);

    if (!hasError && (toAssign.length + toUnassign.length) > 0) {
      this.toast.success('Asignaciones guardadas');
    }
  }

  async deleteRoutine(id: string): Promise<void> {
    if (!confirm('¿Eliminar esta rutina?')) return;
    const { error } = await this.routineService.deleteRoutine(id);
    if (error) { this.toast.error('Error al eliminar rutina'); return; }
    this.toast.warn('Rutina eliminada');
    const remaining = this.routineService.routines();
    this.selectedRoutine.set(remaining[0] ?? null);
  }
}
