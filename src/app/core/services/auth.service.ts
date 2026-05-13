import { Injectable, computed, signal } from '@angular/core';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase/supabase.client';
import type { ProfileRow } from '../supabase/database.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly currentUser = signal<User | null>(null);
  readonly profile = signal<ProfileRow | null>(null);
  readonly loading = signal(true);

  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly gymId = computed(() => this.profile()?.gym_id ?? null);
  readonly role = computed(() => this.profile()?.role ?? null);
  readonly isOwner = computed(() => this.role() === 'OWNER');
  readonly displayName = computed(() => this.profile()?.name ?? this.currentUser()?.email ?? '');

  constructor() {
    this.initSession();
  }

  private async initSession(): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        this.currentUser.set(session.user);
        await this.loadProfile(session.user.id);
      }
    } catch {
      // session unavailable — remain unauthenticated
    } finally {
      this.loading.set(false);
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      this.currentUser.set(session?.user ?? null);
      if (session?.user) {
        await this.loadProfile(session.user.id);
      } else {
        this.profile.set(null);
      }
    });
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    // Only update on success — a network error must not null out gymId
    if (!error && data) this.profile.set(data);
  }

  async signIn(email: string, password: string): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }

  async signUp(
    email: string,
    password: string,
    name: string,
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    return { error: error?.message ?? null };
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }
}
