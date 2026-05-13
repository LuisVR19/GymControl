import { Component, DestroyRef, OnInit, computed, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../core/layout/header/header.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ClientDetailComponent } from './components/client-detail/client-detail.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ClientService } from '../../core/services/client.service';
import { ToastService } from '../../core/services/toast.service';
import type { Client } from '../../core/models';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HeaderComponent, AvatarComponent, ClientDetailComponent, DateInputComponent, PaginationComponent],
  templateUrl: './clients.component.html',
  styleUrl: './clients.component.scss',
})
export class ClientsComponent implements OnInit {
  readonly clientService = inject(ClientService);
  private readonly toast = inject(ToastService);
  private destroyRef     = inject(DestroyRef);

  readonly loading = this.clientService.loading;
  readonly error   = this.clientService.error;

  readonly skeletonRows = Array(6);

  readonly searchQuery  = signal('');
  readonly statusFilter = signal<string>('all');
  readonly planFilter   = signal<string>('all');
  readonly selectedClient = signal<Client | null>(null);
  readonly showAddModal   = signal(false);

  readonly filteredClients = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const s = this.statusFilter();
    const p = this.planFilter();
    return this.clientService.clients().filter(c => {
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      const matchS = s === 'all' || c.status === s;
      const matchP = p === 'all' || c.plan === p;
      return matchQ && matchS && matchP;
    });
  });

  readonly currentPage = signal(1);
  readonly PAGE_SIZE   = 25;

  constructor() {
    effect(() => {
      this.searchQuery(); this.statusFilter(); this.planFilter();
      untracked(() => this.currentPage.set(1));
    });
  }

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredClients().length / this.PAGE_SIZE))
  );

  readonly paginatedClients = computed(() => {
    const page  = this.currentPage();
    const start = (page - 1) * this.PAGE_SIZE;
    return this.filteredClients().slice(start, start + this.PAGE_SIZE);
  });

  readonly pageInfo = computed(() => {
    const total = this.filteredClients().length;
    const page  = this.currentPage();
    const start = total === 0 ? 0 : (page - 1) * this.PAGE_SIZE + 1;
    const end   = Math.min(page * this.PAGE_SIZE, total);
    return { start, end, total };
  });

  prevPage(): void { this.currentPage.update(p => Math.max(1, p - 1)); }
  nextPage(): void { this.currentPage.update(p => Math.min(this.totalPages(), p + 1)); }

  readonly statusOptions = [
    { value: 'all',      label: 'Todos' },
    { value: 'activo',   label: 'Activos' },
    { value: 'moroso',   label: 'Morosos' },
    { value: 'inactivo', label: 'Inactivos' },
  ];

  readonly planOptions = [
    { value: 'all',        label: 'Todos los planes' },
    { value: 'Mensual',    label: 'Mensual' },
    { value: 'Trimestral', label: 'Trimestral' },
    { value: 'Semestral',  label: 'Semestral' },
    { value: 'Anual',      label: 'Anual' },
  ];

  ngOnInit(): void {
    this.loadData();
    const onVisible = () => { if (document.visibilityState === 'visible') this.loadData(); };
    document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisible));
  }

  private loadData(): void {
    this.clientService.loadClients();
  }

  retry(): void {
    this.clientService.loadClients();
  }

  getPillClass(status: string): string {
    const map: Record<string, string> = { activo: 'pill-ok', moroso: 'pill-danger', inactivo: 'pill-neutral' };
    return map[status] ?? 'pill-neutral';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = { activo: 'Activo', moroso: 'Moroso', inactivo: 'Inactivo' };
    return map[status] ?? status;
  }

  openDetail(client: Client): void {
    this.selectedClient.set(client);
  }

  closeDetail(): void {
    this.selectedClient.set(null);
    this.clientService.loadClients();
  }

  onClientSaved(): void {
    this.toast.success('Cliente guardado correctamente');
    this.closeDetail();
  }
}
