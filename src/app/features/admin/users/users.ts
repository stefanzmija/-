import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../core/auth.service';
import { ProfilesService } from '../../../core/profiles.service';
import { ToastService } from '../../../core/toast.service';
import { Profile, ROLE_LABELS, UserRole } from '../../../core/models/profile.model';
import { dbErrorMessage } from '../../tickets/tickets.service';
import { Avatar } from '../../../shared/avatar/avatar';

type RoleFilter = UserRole | 'all';

@Component({
  selector: 'app-users',
  imports: [DatePipe, Avatar],
  templateUrl: './users.html',
})
export class Users implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly profiles = inject(ProfilesService);
  private readonly toast = inject(ToastService);

  protected readonly users = signal<Profile[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal<string | null>(null);
  protected readonly query = signal('');
  protected readonly filter = signal<RoleFilter>('all');

  protected readonly roles: UserRole[] = ['student', 'staff', 'admin'];
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly filters: { id: RoleFilter; label: string }[] = [
    { id: 'all', label: 'Сите' },
    { id: 'student', label: 'Студенти' },
    { id: 'staff', label: 'Референти' },
    { id: 'admin', label: 'Администратори' },
  ];

  protected readonly counts = computed(() => {
    const list = this.users();
    return {
      all: list.length,
      student: list.filter((u) => u.role === 'student').length,
      staff: list.filter((u) => u.role === 'staff').length,
      admin: list.filter((u) => u.role === 'admin').length,
    };
  });

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const f = this.filter();
    return this.users().filter((u) => {
      if (f !== 'all' && u.role !== f) return false;
      return !q || u.full_name.toLowerCase().includes(q) || (u.student_index ?? '').includes(q);
    });
  });

  async ngOnInit() {
    try {
      this.users.set(await this.profiles.getAll());
    } catch (e) {
      this.error.set(dbErrorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }

  protected async changeRole(user: Profile, select: HTMLSelectElement) {
    const role = select.value as UserRole;
    this.saving.set(user.id);
    try {
      await this.profiles.setRole(user.id, role);
      this.users.update((list) => list.map((u) => (u.id === user.id ? { ...u, role } : u)));
      this.toast.success(`${user.full_name} сега е ${ROLE_LABELS[role].toLowerCase()}.`);
    } catch (e) {
      this.toast.error(dbErrorMessage(e));
      select.value = user.role;
    } finally {
      this.saving.set(null);
    }
  }
}
