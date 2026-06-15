import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
  const filename = `pets/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`
  const { data, error } = await supabase.storage
    .from('pokepet')
    .upload(filename, file, { cacheControl: '3600', upsert: false })

  if (error) throw error

  const { data: urlData } = supabase.storage.from('pokepet').getPublicUrl(data.path)
  return urlData.publicUrl
}

export async function saveEvolution(record: Omit<EvolutionRecord, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('evolutions')
    .insert(record)
    .select()
    .single()

  if (error) throw error
  return data as EvolutionRecord
}

export async function getRecentEvolutions(limit = 12): Promise<EvolutionRecord[]> {
  const { data, error } = await supabase
    .from('evolutions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as EvolutionRecord[]
}
