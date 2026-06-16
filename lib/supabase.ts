import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — only initializes when first used, safe at build time
let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (_client) return _client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key || url.includes('YOUR_PROJECT')) {
    throw new Error('Supabase not configured')
  }
  _client = createClient(url, key)
  return _client
}

export interface EvolutionRecord {
  id: string
  created_at: string
  element: string
  tier: string
  pet_image_url: string
  joKemon_image_url: string
  video_url?: string
  nickname?: string
}

export async function uploadPetImage(file: File): Promise<string> {
  const sb = getClient()
  const filename = `pets/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`
  const { data, error } = await sb.storage
    .from('pokepet')
    .upload(filename, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data: urlData } = sb.storage.from('pokepet').getPublicUrl(data.path)
  return urlData.publicUrl
}

export async function saveEvolution(record: Omit<EvolutionRecord, 'id' | 'created_at'>) {
  const sb = getClient()
  const { data, error } = await sb
    .from('evolutions')
    .insert(record)
    .select()
    .single()
  if (error) throw error
  return data as EvolutionRecord
}

export async function getRecentEvolutions(limit = 12): Promise<EvolutionRecord[]> {
  const sb = getClient()
  const { data, error } = await sb
    .from('evolutions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as EvolutionRecord[]
}
