import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DomainsRedirect() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if admin
  const { data: admins } = await supabase.from('admins').select('email').eq('email', user.email).single()
  const isHardcodedAdmin = user.email === 'info369skills@gmail.com' || user.email === 'danubaba369@gmail.com'

  if (isHardcodedAdmin || admins) {
    redirect('/admin/settings')
  }

  redirect('/')
}
