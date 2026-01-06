import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

    // 2. Create Admin Client for privileged operations
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

    // 4. Parse and Validate Body
    const body = await req.json().catch(() => ({}))
    const {
      email,
      password,
      fullName,
      role,
      companyId,
      jobTitle,
      permissions,
    } = body

    if (!email || !fullName || !role) {
      return new Response(
        JSON.stringify({
          error: 'Missing required fields: email, fullName, role',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Ensure password is provided (Requirement: Mandatory Password)
    if (!password) {
      return new Response(
        JSON.stringify({
          error: 'Missing required field: password',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 5. Additional validation for ADMIN: can only create users for their own company
    if (member.role === 'ADMIN') {
      if (companyId && companyId !== member.company_id) {
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
      // Force company ID for admin created users if not provided
      if (!companyId) {
        // We will assume they meant their own company, or we fail.
        // Let's enforce companyId check.
      }
    }

    const targetCompanyId =
      member.role === 'ADMIN' ? member.company_id : companyId

    // 6. Create Auth User
    // We pass all profile data in user_metadata so the trigger can populate the members table atomically
    // setting email_confirm: true skips the invitation email
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: role,
          company_id: targetCompanyId,
          job_title: jobTitle,
          permissions: permissions || [],
        },
      })

    if (authError) {
      // Handle known Supabase Auth errors
      if (authError.message?.includes('already registered')) {
        return new Response(
          JSON.stringify({ error: 'Email already registered' }),
          {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          },
        )
      }

      if (authError.message?.includes('Password should be')) {
        return new Response(JSON.stringify({ error: authError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      throw authError
    }

    // Success - The trigger handles member creation
    return new Response(JSON.stringify(authUser), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 201,
    })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.status || 500,
      },
    )
  }
})
