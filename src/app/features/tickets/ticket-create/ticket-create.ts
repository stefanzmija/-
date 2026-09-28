import { Component, OnInit, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TicketsService, dbErrorMessage } from '../tickets.service';
import { ToastService } from '../../../core/toast.service';
import { Category, categoryIcon } from '../../../core/models/category.model';
import { PRIORITY_META, TicketPriority } from '../../../core/models/ticket.model';
import { Icon } from '../../../shared/icon/icon';
import { PriorityIcon } from '../../../shared/priority-icon/priority-icon';

@Component({
  selector: 'app-ticket-create',
  imports: [ReactiveFormsModule, RouterLink, Icon, PriorityIcon],
  templateUrl: './ticket-create.html',
})
export class TicketCreate implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tickets = inject(TicketsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly category = input<string>();

  protected readonly categories = signal<Category[]>([]);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  protected readonly priorities: TicketPriority[] = ['low', 'normal', 'high'];
  protected readonly priorityMeta = PRIORITY_META;
  protected readonly categoryIcon = categoryIcon;

  protected readonly form = this.fb.nonNullable.group({
    category_id: [0, Validators.min(1)],
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(120)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    priority: ['normal' as TicketPriority],
  });

  protected readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  async ngOnInit() {
    const preselected = Number(this.category());
    if (preselected) this.form.controls.category_id.setValue(preselected);

    try {
      this.categories.set(await this.tickets.getCategories());
    } catch (e) {
      this.toast.error(dbErrorMessage(e));
    }
  }

  protected invalid(name: 'category_id' | 'title' | 'description') {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  protected pickCategory(id: number) {
    this.form.controls.category_id.setValue(id);
  }

  async submit() {
    this.submitted.set(true);
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    try {
      const v = this.form.getRawValue();
      const ticket = await this.tickets.create({
        category_id: v.category_id,
        title: v.title.trim(),
        description: v.description.trim(),
        priority: v.priority,
      });
      this.toast.success(`Барањето #${ticket.id} е поднесено.`);
      this.router.navigate(['/tickets', ticket.id]);
    } catch (e) {
      this.toast.error(dbErrorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }
}
