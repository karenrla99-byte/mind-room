import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !key) {
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY 가 없어요. .env 를 확인해요.')
}

export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing', {
  auth: { persistSession: false, autoRefreshToken: false },
})
