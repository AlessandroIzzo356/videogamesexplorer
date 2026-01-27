import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  isSubmitting = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.error.set(null);
    this.success.set(null);

    const { email } = this.form.getRawValue();
    try {
      await this.authService.resetPassword(email);
      this.success.set('Email inviata. Controlla la posta per reimpostare la password.');
      this.form.reset();
    } catch (error) {
      this.error.set(this.authService.getErrorMessage(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
