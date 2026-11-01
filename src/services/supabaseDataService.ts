import { supabase } from '@/src/lib/supabase';
import { Client, Professional, Appointment, Product } from '@/src/types';

/**
 * Universal Data Sync helper for Salão Luxe with Supabase DB.
 * Integrates real-time events and falls back gracefully to local state if tables are offline or pending setup.
 */

// --- CLIENTS ---
export async function syncClientsFromSupabase(): Promise<Client[] | null> {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data) return null;
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      email: row.email || '',
      phone: row.phone || '',
      whatsapp: row.whatsapp || row.phone || '',
      photoUrl: row.photo_url || undefined,
      birthDate: row.birth_date || undefined,
      status: row.status || 'ativo',
      hasPortalAccess: row.has_portal_access || false,
      notes: row.notes || '',
      preferences: row.preferences || '',
      allergies: row.allergies || '',
      favoriteServiceIds: row.favorite_service_ids || [],
      totalSpent: Number(row.total_spent || 0),
      lastVisit: row.last_visit || undefined,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Notice syncing clients from Supabase:', err);
    return null;
  }
}

export async function saveClientToSupabase(client: Client): Promise<boolean> {
  try {
    const row = {
      id: client.id,
      name: client.name,
      email: client.email || null,
      phone: client.phone || null,
      whatsapp: client.whatsapp || client.phone || null,
      photo_url: client.photoUrl || null,
      birth_date: client.birthDate || null,
      status: client.status || 'ativo',
      has_portal_access: client.hasPortalAccess || false,
      notes: client.notes || null,
      preferences: client.preferences || null,
      allergies: client.allergies || null,
      favorite_service_ids: client.favoriteServiceIds || [],
      total_spent: client.totalSpent || 0,
      last_visit: client.lastVisit || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('clients').upsert(row);
    return !error;
  } catch (err) {
    console.warn('Notice saving client to Supabase:', err);
    return false;
  }
}

// --- PROFESSIONALS ---
export async function syncProfessionalsFromSupabase(): Promise<Professional[] | null> {
  try {
    const { data, error } = await supabase
      .from('professionals')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data) return null;
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      specialties: row.specialties || [],
      photoUrl: row.photo_url || undefined,
      commission: Number(row.commission_rate || 30),
    }));
  } catch (err) {
    console.warn('Notice syncing professionals from Supabase:', err);
    return null;
  }
}

export async function saveProfessionalToSupabase(prof: Professional): Promise<boolean> {
  try {
    const row = {
      id: prof.id,
      name: prof.name,
      role: prof.role,
      specialties: prof.specialties || [],
      photo_url: prof.photoUrl || null,
      commission_rate: prof.commission || 30,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('professionals').upsert(row);
    return !error;
  } catch (err) {
    console.warn('Notice saving professional to Supabase:', err);
    return false;
  }
}

// --- APPOINTMENTS ---
export async function syncAppointmentsFromSupabase(): Promise<Appointment[] | null> {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('date', { ascending: false });

    if (error || !data) return null;
    return data.map((row: any) => ({
      id: row.id,
      clientId: row.client_id,
      clientName: row.client_name,
      clientPhone: row.client_phone || '',
      clientEmail: row.client_email || '',
      professionalId: row.professional_id,
      professionalName: row.professional_name,
      serviceIds: row.service_ids || [],
      serviceNames: row.service_names || [],
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      totalDuration: row.total_duration,
      totalPrice: Number(row.total_price),
      status: row.status || 'aguardando',
      notes: row.notes || undefined,
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Notice syncing appointments from Supabase:', err);
    return null;
  }
}

export async function saveAppointmentToSupabase(apt: Appointment): Promise<boolean> {
  try {
    const row = {
      id: apt.id,
      client_id: apt.clientId,
      client_name: apt.clientName,
      client_phone: apt.clientPhone || null,
      client_email: apt.clientEmail || null,
      professional_id: apt.professionalId,
      professional_name: apt.professionalName,
      service_ids: apt.serviceIds || [],
      service_names: apt.serviceNames || [],
      date: apt.date,
      start_time: apt.startTime,
      end_time: apt.endTime,
      total_duration: apt.totalDuration,
      total_price: apt.totalPrice,
      status: apt.status,
      notes: apt.notes || null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('appointments').upsert(row);
    return !error;
  } catch (err) {
    console.warn('Notice saving appointment to Supabase:', err);
    return false;
  }
}

// --- PRODUCTS / INVENTORY ---
export async function syncProductsFromSupabase(): Promise<Product[] | null> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error || !data) return null;
    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      category: row.category,
      price: Number(row.sale_price || row.price || 0),
      costPrice: Number(row.cost_price || 0),
      stock: Number(row.quantity || row.stock || 0),
      minStock: Number(row.min_quantity || row.min_stock || 5),
      imageUrl: row.photo_url || row.image_url || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=300&auto=format&fit=crop&q=80',
      barcode: row.barcode || undefined,
      status: (row.status || 'ativo') as any,
      salesCount: Number(row.sales_count || 0),
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Notice syncing products from Supabase:', err);
    return null;
  }
}

export async function saveProductToSupabase(product: Product): Promise<boolean> {
  try {
    const row = {
      id: product.id,
      name: product.name,
      description: product.description || null,
      category: product.category,
      sale_price: product.price,
      cost_price: product.costPrice,
      quantity: product.stock,
      min_quantity: product.minStock,
      photo_url: product.imageUrl || null,
      barcode: product.barcode || null,
      status: product.status || 'ativo',
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from('products').upsert(row);
    return !error;
  } catch (err) {
    console.warn('Notice saving product to Supabase:', err);
    return false;
  }
}
