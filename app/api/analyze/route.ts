import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const SYSTEM_PROMPT = `You are an expert Indian government tender analyst. The document may contain Hindi and English text mixed together. Analyze everything and return ONLY a valid JSON object (no markdown, no backticks, no extra text).

Return exactly this structure:
{
  "tenderTitle": "full tender title (translate from Hindi if needed)",
  "authority": "issuing authority name",
  "estimatedValue": "value with currency e.g. Rs 46 Cr or Not specified",
  "eligibility": {
    "status": "QUALIFIED",
    "reasons": ["reason 1", "reason 2", "reason 3"]
  },
  "riskLevel": "LOW",
  "winProbability": 72,
  "scopeOfWork": ["item 1", "item 2", "item 3", "item 4"],
  "requiredDocuments": [
    { "name": "document name", "mandatory": true, "notes": "optional note" }
  ],
  "keyDates": [
    { "label": "date label", "date": "DD Mon YYYY or time" }
  ],
  "contacts": [
    { "name": "person name", "role": "designation", "phone": "+91...", "email": "..." }
  ],
  "warnings": ["warning 1 if any"]
}

Rules:
- eligibility.status must be exactly "QUALIFIED", "PARTIAL", or "NOT_QUALIFIED"
- riskLevel must be exactly "LOW", "MEDIUM", or "HIGH"
- winProbability is a number 0-100
- Translate any Hindi text to English in your response
- If a field has no data, use an empty array [] or "Not specified"
- Assume analyzing company is a mid-size MSME contractor with 5+ years experience
- Return ONLY the JSON, nothing else`;

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") || "";

  // Chat follow-up
  if (contentType.includes("application/json")) {
    try {
      const { question, context } = await req.json();
      if (!question || !context) {
        return NextResponse.json({ error: "Missing question or context" }, { status: 400 });
      }
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are a tender analysis expert. Based on this tender analysis:\n\n${context}\n\nAnswer this question clearly in 2-3 sentences:\n${question}`,
      });
      return NextResponse.json({ answer: response.text });
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // PDF Analysis
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    if (file.type !== "application/pdf") return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 50MB)" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "application/pdf",
                data: base64,
              },
            },
            {
              text: SYSTEM_PROMPT,
            },
          ],
        },
      ],
    });

    const responseText = response.text ?? "";
    const clean = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(clean);

    return NextResponse.json(analysis);
  } catch (err: any) {
    console.error("Analysis error:", err);
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: "AI returned unexpected format. Please try again." }, { status: 500 });
    }
    return NextResponse.json({ error: err.message || "Analysis failed" }, { status: 500 });
  }
}