import { Injectable } from '@angular/core';
import { supabase } from '../supabase/supabase.client';
import type { AppNotification } from '../models';
import type { NotificationRow } from '../supabase/database.types';

function formatTime(createdAt: string): string {
  const now  = new Date();
  const d    = new Date(createdAt);
  const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (diff === 0) return 'Hoy ' + d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
  if (diff === 1) return 'Ayer';
  if (diff < 7)  return `${diff} d`;
  return d.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' });
}

function mapNotification(row: NotificationRow): AppNotification {
  return {
    id:     row.id,
    gymId:  row.gym_id,
    userId: row.user_id,
    cat:    row.cat,
    from:   row.sender,
    title:  row.title,
    desc:   row.body,
    read:   row.read,
    t:      formatTime(row.created_at),
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  async send(gymId: string, userId: string, payload: {
    cat: 'critical' | 'warning' | 'info';
    from: string;
    title: string;
    desc: string;
  }): Promise<{ error: string | null }> {
    const { error } = await supabase.from('notifications').insert({
      gym_id:  gymId,
      user_id: userId,
      cat:     payload.cat,
      sender:  payload.from,
      title:   payload.title,
      body:    payload.desc,
    });
    return { error: error?.message ?? null };
  }

  async loadForUser(userId: string): Promise<AppNotification[]> {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return (data ?? []).map(r => mapNotification(r as NotificationRow));
  }

  async markRead(id: number): Promise<void> {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  }
}
