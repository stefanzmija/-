import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BrandMark } from '../../shared/brand-mark/brand-mark';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, BrandMark],
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly year = new Date().getFullYear();
}
