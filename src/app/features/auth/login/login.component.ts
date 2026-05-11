import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  password = '';
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  async onSubmit(): Promise<void> {
    if (!this.email || !this.password) return;
    this.submitting.set(true);
    this.error.set(null);

    const { error } = await this.auth.signIn(this.email, this.password);

    if (error) {
      this.error.set('Correo o contraseña incorrectos');
      this.submitting.set(false);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
