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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing Authorization header')
    }

    // 1. Verify the user calling the function (using Anon key + User JWT)
    // This ensures we know exactly who is calling the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          persistSession: false,
        },
      },
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 2. Create Admin Client for privileged operations (Service Role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      },
    )

    // 3. Check caller's role in members table
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('role, company_id')
      .eq('id', user.id)
      .single()

    if (memberError || !member) {
      return new Response(JSON.stringify({ error: 'Profile not found' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (member.role !== 'MASTER' && member.role !== 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Insufficient permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const { email, password, fullName, role, companyId, jobTitle } =
      await req.json()

    // 4. Additional validation for ADMIN: can only create users for their own company
    if (member.role === 'ADMIN' && companyId !== member.company_id) {
      return new Response(
        JSON.stringify({
          error:
            'Forbidden: Admins can only create users for their own company',
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 5. Create Auth User
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      })

    if (authError) throw authError

    if (authUser.user) {
      // 6. Update Member Profile
      const { error: updateError } = await supabaseAdmin
        .from('members')
        .update({
          role: role || 'USER',
          company_id: companyId,
          job_title: jobTitle,
          full_name: fullName,
        })
        .eq('id', authUser.user.id)

      if (updateError) {
        console.error('Failed to update profile:', updateError)
        // We throw to return error, but user is created in Auth
        throw updateError
      }
    }

    return new Response(JSON.stringify(authUser), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
