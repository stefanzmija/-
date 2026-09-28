import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';
import { Profile, UserRole } from './models/profile.model';

@Injectable({ providedIn: 'root' })
export class ProfilesService {
  async getAll(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Profile[];
  }

  async setRole(id: string, role: UserRole): Promise<void> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select('id');

    if (error) throw error;
    if (!data?.length) throw new Error('Немаш дозвола да ја смениш улогата.');
  }
}
