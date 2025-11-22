import { GoogleGenerativeAI } from "@google/generative-ai";

interface OCRResult {
  fullName?: string;
  fathersName?: string;
  mothersName?: string;
  dateOfBirth?: string;
  email?: string;
  mobileNumber?: string;
  address?: string;
  qualification?: string;
  courseName?: string;
  boardUniversity?: string;
  dateOfPassing?: string;
  percentage?: string;
  documentNumber?: string;
  identificationNumber?: string;
  identificationIssueDate?: string;
  expiryDate?: string;
  gender?: string;
  category?: string;
  [key: string]: string | undefined;
}

export async function extractDataFromDocument(imageUrl: string): Promise<OCRResult> {
  try {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze this document/certificate and extract ALL personal and document information you can find. Return as JSON object with these fields (only include fields that are found in the document):

{
  "fullName": "Full name as shown",
  "fathersName": "Father's name if present",
  "mothersName": "Mother's name if present",
  "dateOfBirth": "DOB in YYYY-MM-DD format if found",
  "gender": "Male/Female/Other if shown",
  "category": "UR/OBC/SC/ST/EWS if mentioned",
  "email": "Email address if present",
  "mobileNumber": "Phone number if shown",
  "address": "Address mentioned",
  "qualification": "Educational qualification (Bachelor/Master/10th/12th/Diploma etc)",
  "courseName": "Course/degree name",
  "boardUniversity": "Board or University name",
  "dateOfPassing": "Passing date in YYYY-MM-DD format",
  "percentage": "Marks/Percentage/CGPA if shown",
  "documentNumber": "Certificate/Roll number",
  "identificationNumber": "ID number (Aadhaar/PAN/Voter ID etc)",
  "identificationIssueDate": "Issue date in YYYY-MM-DD format",
  "expiryDate": "Expiry date in YYYY-MM-DD format if applicable"
}

Return ONLY valid JSON with extracted data. If a field is not found in the document, omit it.`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: imageUrl.split(",")[1], // Extract base64 data
          mimeType: "image/jpeg",
        },
      },
      prompt,
    ]);

    const responseText = result.response.text();
    
    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("No JSON found in OCR response");
      return {};
    }

    const extractedData = JSON.parse(jsonMatch[0]);
    return extractedData;
  } catch (error) {
    console.error("OCR extraction error:", error);
    throw error;
  }
}
