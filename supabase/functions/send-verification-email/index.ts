import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, companyName, verificationUrl } = await req.json()

    if (!email || !companyName || !verificationUrl) {
      throw new Error('Missing required fields')
    }

    // Configurar el cliente de Supabase Admin
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // Enviar el email usando el servicio de Supabase
    const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      redirect_to: verificationUrl,
      data: {
        companyName: companyName,
        emailType: 'verification'
      }
    })

    if (error) {
      throw error
    }

    // Alternativamente, puedes usar un servicio de email más personalizado:
    const emailResponse = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email: email,
      options: {
        redirectTo: verificationUrl,
      },
    })

    if (emailResponse.error) {
      throw emailResponse.error
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error sending verification email:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})