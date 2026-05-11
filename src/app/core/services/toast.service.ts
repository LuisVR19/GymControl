import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warn' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  success(message: string, duration = 3500): void { this.push(message, 'success', duration); }
  error(message: string, duration = 5000): void   { this.push(message, 'error', duration); }
  warn(message: string, duration = 4000): void    { this.push(message, 'warn', duration); }
  info(message: string, duration = 3000): void    { this.push(message, 'info', duration); }

  dismiss(id: string): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private push(message: string, type: Toast['type'], duration: number): void {
    const id = crypto.randomUUID();
    this.toasts.update(list => [...list, { id, message, type }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
