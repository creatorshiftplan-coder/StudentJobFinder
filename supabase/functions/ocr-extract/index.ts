import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const geminiApiKey = Deno.env.get("GOOGLE_GENERATIVE_AI_API_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface OCRResult {
  fullName?: string;
  email?: string;
  mobileNumber?: string;
  dateOfBirth?: string;
  address?: string;
  education?: string;
  [key: string]: string | undefined;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), { status: 405 });
  }

  try {
    const { imageUrl, userId } = await req.json();

    if (!imageUrl || !userId) {
      return new Response(JSON.stringify({ error: "imageUrl and userId required" }), { status: 400 });
    }

    // Extract base64 from data URL
    const base64Data = imageUrl.includes(",") ? imageUrl.split(",")[1] : imageUrl;

    // Call Gemini API for OCR
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + geminiApiKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Data
            }
          }, {
            text: `Extract all personal information from this document. Return ONLY JSON with fields: fullName, email, mobileNumber, dateOfBirth, address, education. Omit fields not found.`
          }]
        }]
      })
    });

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "No data extracted" }), { status: 400 });
    }

    const extractedData: OCRResult = JSON.parse(jsonMatch[0]);

    // Update user profile with extracted data
    if (extractedData.fullName || extractedData.email) {
      await supabase
        .from("student_profiles")
        .update({
          full_name: extractedData.fullName,
          email: extractedData.email,
          phone: extractedData.mobileNumber,
          date_of_birth: extractedData.dateOfBirth,
          address: extractedData.address,
          education: extractedData.education,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
    }

    return new Response(JSON.stringify({ success: true, data: extractedData }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
