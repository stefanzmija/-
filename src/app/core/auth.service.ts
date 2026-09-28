import { Injectable, computed, signal } from '@angular/core';
import { AuthError, Session } from '@supabase/supabase-js';
import { supabase } from './supabase.client';
import { Profile } from './models/profile.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly session = signal<Session | null>(null);
  readonly profile = signal<Profile | null>(null);
  readonly ready = signal(false);

  readonly isLoggedIn = computed(() => this.session() !== null);
  readonly userId = computed(() => this.session()?.user.id ?? null);
  readonly email = computed(() => this.session()?.user.email ?? '');
  readonly role = computed(() => this.profile()?.role ?? null);
  readonly isStaff = computed(() => this.role() === 'staff' || this.role() === 'admin');
  readonly isAdmin = computed(() => this.role() === 'admin');
  readonly displayName = computed(
    () => this.profile()?.full_name || this.email().split('@')[0] || 'Корисник',
  );

  private readonly readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = supabase.auth
      .getSession()
      .then(({ data }) => this.applySession(data.session))
      .finally(() => this.ready.set(true));

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      setTimeout(() => this.applySession(session));
    });
  }

  whenReady(): Promise<void> {
    return this.readyPromise;
  }

  private async applySession(session: Session | null) {
    const previousUser = this.session()?.user.id;
    this.session.set(session);

    if (!session) {
      this.profile.set(null);
      return;
    }
    if (previousUser === session.user.id && this.profile()) return;
    await this.refreshProfile();
  }

  async refreshProfile() {
    const id = this.userId();
    if (!id) return;
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    this.profile.set((data as Profile) ?? null);
  }

  async register(email: string, password: string, fullName: string, studentIndex: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, student_index: studentIndex } },
    });
    if (error) throw error;
    if (data.session) await this.applySession(data.session);
    return data.session !== null;
  }

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    await this.applySession(data.session);
  }

  async logout() {
    await supabase.auth.signOut();
    this.session.set(null);
    this.profile.set(null);
  }
}

export function authErrorMessage(e: unknown): string {
  const msg = (e as AuthError)?.message?.toLowerCase() ?? '';
  if (msg.includes('invalid login credentials')) return 'Погрешен е-маил или лозинка.';
  if (msg.includes('email not confirmed')) return 'Е-маилот уште не е потврден. Провери го сандачето.';
  if (msg.includes('already registered')) return 'Веќе постои профил со овој е-маил.';
  if (msg.includes('rate limit')) return 'Премногу обиди. Обиди се повторно за неколку минути.';
  if (msg.includes('password should be')) return 'Лозинката мора да има најмалку 6 карактери.';
  if (msg.includes('database error')) return 'Грешка во базата при креирање на профилот.';
  if (msg.includes('failed to fetch')) return 'Нема врска со серверот. Провери ја интернет врската.';
  return 'Нешто тргна наопаку. Обиди се повторно.';
}
