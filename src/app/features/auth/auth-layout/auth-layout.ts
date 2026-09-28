import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  host: { class: 'flex flex-1' },
  template: `
    <div class="flex w-full items-center justify-center px-4 py-12 sm:px-8 motion-preset-fade motion-duration-2500">
      <div class="w-full max-w-sm">
        <ng-content />
      </div>
    </div>
  `,
})
export class AuthLayout {}
