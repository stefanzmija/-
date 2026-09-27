import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {Footer} from '../footer/footer';

@Component({
  imports: [RouterLink, Footer],
  selector: 'app-hero',
  styleUrl: './hero.css',
  templateUrl: './hero.html',
})
export class Hero {}
