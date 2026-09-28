import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, authErrorMessage } from '../../../core/auth.service';
import { ToastService } from '../../../core/toast.service';
import { AuthLayout } from '../auth-layout/auth-layout';
import { Icon } from '../../../shared/icon/icon';

type Field = 'fullName' | 'studentIndex' | 'email' | 'password';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, AuthLayout, Icon],
  templateUrl: './register.html',
  host: { class: 'flex flex-1' },
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly submitted = signal(false);
  protected readonly checkInbox = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(3)]],
    studentIndex: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  private readonly password = toSignal(this.form.controls.password.valueChanges, { initialValue: '' });

  protected readonly strength = computed(() => {
    const p = this.password();
    if (!p) return 0;
    let score = p.length >= 6 ? 1 : 0;
    if (p.length >= 10) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]|[A-Z]/.test(p)) score++;
    return score;
  });
  protected readonly strengthLabel = computed(
    () => ['Премногу кратка', 'Слаба', 'Добра', 'Силна', 'Одлична'][this.strength()],
  );
  protected readonly strengthColor = computed(
    () => ['bg-rose-500', 'bg-rose-500', 'bg-amber-500', 'bg-emerald-500', 'bg-emerald-500'][this.strength()],
  );

  protected invalid(name: Field) {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  async submit() {
    this.submitted.set(true);
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set(null);

    try {
      const { email, password, fullName, studentIndex } = this.form.getRawValue();
      const loggedIn = await this.auth.register(email.trim(), password, fullName.trim(), studentIndex);
      if (loggedIn) {
        this.toast.success('Профилот е креиран. Добредојде!');
        this.router.navigate(['/tickets']);
      } else {
        this.checkInbox.set(true);
      }
    } catch (e) {
      this.error.set(authErrorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
}
