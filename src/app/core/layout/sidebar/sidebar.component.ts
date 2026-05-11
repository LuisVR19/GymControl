import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { GymService } from '../../services/gym.service';
import { AuthService } from '../../services/auth.service';
import { supabase } from '../../supabase/supabase.client';

interface NavItem {
  id: string;
  label: string;
  route: string;
  icon: string;
}

const ICONS: Record<string, string> = {
  home:     `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 11l9-7 9 7v9a2 2 0 01-2 2h-4v-7h-6v7H5a2 2 0 01-2-2v-9z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  users:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.5" stroke="currentColor" stroke-width="1.5"/><circle cx="17" cy="9" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 20c0-2.5 1.6-4.7 4-5.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  dumbbell:      `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 9v6M6 6v12M18 6v12M21 9v6M6 12h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  'exercise-list': `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  card:          `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.5"/><path d="M2 11h20" stroke="currentColor" stroke-width="1.5"/></svg>`,
  money:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.5"/><path d="M14 9c-.5-1-1.6-1.5-3-1.3-1.5.2-2 1-2 1.7 0 2 5 1.4 5 3.6 0 .8-.6 1.7-2 2-1.5.3-2.7-.3-3.2-1.3M11 6v1.5M11 16v1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.5"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" stroke-width="1.5"/></svg>`,
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit {
  private router    = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private auth      = inject(AuthService);
  readonly gymService = inject(GymService);

  readonly todayAttendance  = signal(0);
  readonly attendanceLoading = signal(false);

  navItems: NavItem[] = [
    { id: 'dashboard',   label: 'Dashboard',  route: '/dashboard',   icon: 'home'     },
    { id: 'clients',     label: 'Clientes',   route: '/clients',     icon: 'users'    },
    { id: 'routines',    label: 'Rutinas',    route: '/routines',    icon: 'dumbbell'       },
    { id: 'exercises',   label: 'Ejercicios', route: '/exercises',   icon: 'exercise-list'  },
    { id: 'memberships', label: 'Membresías', route: '/memberships', icon: 'card'           },
    { id: 'payments',    label: 'Pagos',      route: '/payments',    icon: 'money'    },
    { id: 'gym',         label: 'Mi gym',     route: '/gym',         icon: 'settings' },
  ];

  ngOnInit(): void {
    this.loadAttendanceToday();
  }

  private async loadAttendanceToday(): Promise<void> {
    const gymId = this.auth.gymId();
    if (!gymId) return;

    this.attendanceLoading.set(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', gymId)
        .gte('checked_in_at', today + 'T00:00:00')
        .lte('checked_in_at', today + 'T23:59:59');
      this.todayAttendance.set(count ?? 0);
    } finally {
      this.attendanceLoading.set(false);
    }
  }

  isActive(route: string): boolean {
    return this.router.url.startsWith(route);
  }

  getIcon(name: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[name] ?? '');
  }
}
