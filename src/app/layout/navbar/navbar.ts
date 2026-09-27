import { Component, ElementRef, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../core/toast.service';
import { ROLE_CLASSES, ROLE_LABELS } from '../../core/models/profile.model';
import { Icon } from '../../shared/icon/icon';
import { Avatar } from '../../shared/avatar/avatar';
import { BrandMark } from '../../shared/brand-mark/brand-mark';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive, Icon, Avatar, BrandMark],
  templateUrl: './navbar.html',
  host: {
    class: 'sticky top-0 z-50 block',
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'closeMenus()',
    '(window:scroll)': 'onScroll()',
  },
})
export class Navbar {
  protected readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly userMenuOpen = signal(false);
  protected readonly mobileOpen = signal(false);
  protected readonly scrolled = signal(false);
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly roleClasses = ROLE_CLASSES;

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.closeMenus());
  }

  protected onDocumentClick(event: MouseEvent) {
    if (!this.host.nativeElement.contains(event.target as Node)) this.closeMenus();
  }

  protected onScroll() {
    this.scrolled.set(window.scrollY > 8);
  }

  protected closeMenus() {
    this.userMenuOpen.set(false);
    this.mobileOpen.set(false);
  }

  protected async logout() {
    this.closeMenus();
    await this.auth.logout();
    this.toast.info('Се одјави. Се гледаме!');
    this.router.navigate(['/']);
  }
}
