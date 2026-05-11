import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../../core/layout/header/header.component';
import { GymService } from '../../core/services/gym.service';
import { ToastService } from '../../core/services/toast.service';

interface GymData {
  name: string; legal: string; taxId: string; tagline: string;
  email: string; phone: string; whatsapp: string; instagram: string;
  address: string; city: string; province: string;
  capacity: string; sqm: string; color: string;
}

interface DayHours { open: string; close: string; closed: boolean; }

@Component({
  selector: 'app-gym',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './gym.component.html',
  styleUrl: './gym.component.scss',
})
export class GymComponent implements OnInit {
  private gymService = inject(GymService);
  private toast      = inject(ToastService);

  readonly colors = ['#D97757', '#2A6FDB', '#1F8A5B', '#6B4FE3', '#0a0a0a'];

  readonly days = [
    { id: 'L', label: 'Lunes'      },
    { id: 'M', label: 'Martes'     },
    { id: 'X', label: 'Miércoles'  },
    { id: 'J', label: 'Jueves'     },
    { id: 'V', label: 'Viernes'    },
    { id: 'S', label: 'Sábado'     },
    { id: 'D', label: 'Domingo'    },
  ];

  editing = false;
  saving  = false;

  data: GymData = {
    name:      '',
    legal:     '',
    taxId:     '',
    tagline:   '',
    email:     '',
    phone:     '',
    whatsapp:  '',
    instagram: '',
    address:   '',
    city:      '',
    province:  '',
    capacity:  '',
    sqm:       '',
    color:     '#D97757',
  };

  draft: GymData = { ...this.data };

  hours: Record<string, DayHours> = {
    L: { open: '05:00', close: '22:00', closed: false },
    M: { open: '05:00', close: '22:00', closed: false },
    X: { open: '05:00', close: '22:00', closed: false },
    J: { open: '05:00', close: '22:00', closed: false },
    V: { open: '05:00', close: '21:00', closed: false },
    S: { open: '07:00', close: '18:00', closed: false },
    D: { open: '08:00', close: '14:00', closed: false },
  };

  constructor() {
    effect(() => {
      const g = this.gymService.gym();
      if (g) {
        this.data = {
          ...this.data,
          name:  g.name,
          color: g.primary_color ?? this.data.color,
        };
        if (!this.editing) this.draft = { ...this.data };
      }
    });
  }

  ngOnInit(): void {
    this.gymService.loadGym();
  }

  get currentColor(): string { return this.editing ? this.draft.color : this.data.color; }

  get heroBannerStyle(): Record<string, string> {
    const c = this.currentColor;
    return { background: `linear-gradient(135deg, ${c}, color-mix(in oklab, ${c} 50%, #0e0e0c))` };
  }

  get markerStyle(): Record<string, string> {
    return { background: this.currentColor, 'box-shadow': `0 0 0 6px color-mix(in oklab, ${this.currentColor} 35%, transparent)` };
  }

  get dayEntries() {
    return this.days.map(d => ({ day: d, h: this.hours[d.id] }));
  }

  startEdit(): void { this.draft = { ...this.data }; this.editing = true; }
  cancel():    void { this.draft = { ...this.data }; this.editing = false; }

  async save(): Promise<void> {
    this.saving = true;
    const { error } = await this.gymService.updateGym({
      name:          this.draft.name,
      primary_color: this.draft.color,
    });
    if (error) {
      this.toast.error('Error al guardar: ' + error);
    } else {
      this.data    = { ...this.draft };
      this.editing = false;
      this.toast.success('Datos del gym actualizados');
    }
    this.saving = false;
  }

  toggleDayClosed(dayId: string): void {
    this.hours[dayId] = { ...this.hours[dayId], closed: !this.hours[dayId].closed };
  }
}
