import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const { email, password, fullName, role, companyId, jobTitle } =
      await req.json()

    // 1. Create Auth User
    const { data: authUser, error: authError } =
      await supabaseClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })

    if (authError) throw authError

    if (authUser.user) {
      // 2. Update Member Profile (The trigger creates it, we update it)
      // Wait a bit for trigger? Or update directly. Trigger is sync, so it should be there.

      const { error: updateError } = await supabaseClient
        .from('members')
        .update({
          role,
          company_id: companyId,
          job_title: jobTitle,
          full_name: fullName,
        })
        .eq('id', authUser.user.id)

      if (updateError) throw updateError
    }

    return new Response(JSON.stringify(authUser), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
