import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // 1. Create Supabase Admin Client
    // Initialize with Service Role Key to perform privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    // 2. Validate Caller Session
    // Use the admin client to verify the JWT signature and expiration
    const {
      data: { user: caller },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token)

    if (userError || !caller) {
      return new Response(
        JSON.stringify({
          error: 'Unauthorized: Invalid or expired token',
          details: userError,
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 3. Check Admin Permissions
    // Retrieve the caller's role from the members table
    const { data: member, error: memberError } = await supabaseAdmin
      .from('members')
      .select('role, company_id')
      .eq('id', caller.id)
      .single()

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Caller profile not found' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // Enforce role check (MASTER or ADMIN)
    if (member.role !== 'MASTER' && member.role !== 'ADMIN') {
      return new Response(
        JSON.stringify({ error: 'Forbidden: Insufficient permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 4. Parse and Validate Request Body
    const body = await req.json().catch(() => ({}))
    const {
      email,
      password,
      fullName,
      role,
      companyId,
      jobTitle,
      permissions,
      status,
    } = body

    if (!email || !password || !fullName || !role) {
      return new Response(
        JSON.stringify({
          error:
            'Missing required fields: email, password, fullName, role are required',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    // 5. Access Control for Companies
    // Admins can ONLY create users for their own company
    let targetCompanyId = companyId

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
      // Force company ID to be the admin's company
      targetCompanyId = member.company_id
    }

    // 6. Create User in Auth
    // Pass metadata so the database trigger can populate the public.members table
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
          status: status || 'active',
        },
      })

    if (authError) {
      console.error('Auth Creation Error:', authError)

      let status = 400
      let message = authError.message

      // Map Supabase errors to more friendly messages/codes
      if (message.includes('already registered')) {
        status = 409
        message = 'Email is already registered'
      }

      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 7. Success Response
    return new Response(JSON.stringify(authUser), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    console.error('Unexpected Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
