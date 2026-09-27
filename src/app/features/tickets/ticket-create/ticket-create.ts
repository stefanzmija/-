import { Component, OnInit, inject, input, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TicketsService, dbErrorMessage } from '../tickets.service';
import { ToastService } from '../../../core/toast.service';
import { CATEGORY_META, Category, categoryIcon } from '../../../core/models/category.model';
import { PRIORITY_META, TicketPriority } from '../../../core/models/ticket.model';
import { Icon } from '../../../shared/icon/icon';
import { PriorityIcon } from '../../../shared/priority-icon/priority-icon';

@Component({
  selector: 'app-ticket-create',
  imports: [ReactiveFormsModule, RouterLink, Icon, PriorityIcon],
  templateUrl: './ticket-create.html',
  host: { class: 'block' },
})
export class TicketCreate implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly tickets = inject(TicketsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** ?category=3 — preselected from the home page category cards. */
  readonly category = input<string>();

  protected readonly categories = signal<Category[]>([]);
  protected readonly loadingCategories = signal(true);
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  protected readonly priorities: TicketPriority[] = ['low', 'normal', 'high'];
  protected readonly priorityMeta = PRIORITY_META;
  protected readonly categoryMeta = CATEGORY_META;
  protected readonly categoryIcon = categoryIcon;

  protected readonly titleMax = 120;
  protected readonly descriptionMin = 10;

  protected readonly form = this.fb.nonNullable.group({
    category_id: [0, [Validators.required, Validators.min(1)]],
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(this.titleMax)]],
    description: ['', [Validators.required, Validators.minLength(this.descriptionMin)]],
    priority: ['normal' as TicketPriority, Validators.required],
  });

  protected readonly value = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  async ngOnInit() {
    const preselected = Number(this.category());
    if (preselected) this.form.controls.category_id.setValue(preselected);

    try {
      this.categories.set(await this.tickets.getCategories());
    } catch (e) {
      this.toast.error(dbErrorMessage(e));
    } finally {
      this.loadingCategories.set(false);
    }
  }

  protected invalid(name: 'category_id' | 'title' | 'description') {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  protected pickCategory(id: number) {
    this.form.controls.category_id.setValue(id);
    this.form.controls.category_id.markAsTouched();
  }

  protected pickPriority(p: TicketPriority) {
    this.form.controls.priority.setValue(p);
  }

  /** Ctrl/⌘ + Enter anywhere in the form submits it. */
  protected onKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.submit();
    }
  }

  async submit() {
    this.submitted.set(true);
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }
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
