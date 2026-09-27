import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandMark } from '../../shared/brand-mark/brand-mark';
import { Icon } from '../../shared/icon/icon';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, BrandMark, Icon],
  templateUrl: './footer.html',
  host: { class: 'block' },
})
export class Footer {
  protected readonly year = new Date().getFullYear();
}
