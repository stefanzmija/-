import { Component, Injectable, signal,  computed } from '@angular/core';
import {Navbar} from '../navbar/navbar';
import {Hero} from '../hero/hero';
import {Ticket, Tickets} from '../tickets/tickets';
import { supabase } from '../../core/supabase.client';
import {Footer} from '../footer/footer';


@Component({
  imports: [
    Hero, Tickets, Footer,
  ],
  selector: 'app-home',
  styleUrl: './home.css',
  templateUrl: './home.html',
})

export class Home {


}
