import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './layout/navbar/navbar';
import { Footer } from './layout/footer/footer';
import { Toaster } from './shared/toaster/toaster';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Footer, Toaster],
  templateUrl: './app.html',
})
export class App {}
