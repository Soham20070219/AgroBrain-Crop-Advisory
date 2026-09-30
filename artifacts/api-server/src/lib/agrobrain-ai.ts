import { GoogleGenAI, Type } from "@google/genai";
import { z } from "zod/v4";
import type { Farm } from "@workspace/db";

const aiResponseSchema = z.object({
  recommended_crops: z.array(
    z.object({
      crop_name: z.string(),
      suitability_score: z.number().min(0).max(100),
      reasoning: z.string(),
      expected_yield_per_acre: z.string(),
      estimated_roi_percentage: z.number(),
    }),
  ),
  soil_preparation_steps: z.array(z.string()),
  pest_disease_management: z.array(
    z.object({
      threat_name: z.string(),
      prevention_strategy: z.string(),
      treatment: z.string(),
    }),
  ),
  irrigation_schedule: z.string(),
  sustainability_tips: z.array(z.string()),
});

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    recommended_crops: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          crop_name: { type: Type.STRING },
          suitability_score: { type: Type.NUMBER },
          reasoning: { type: Type.STRING },
          expected_yield_per_acre: { type: Type.STRING },
          estimated_roi_percentage: { type: Type.NUMBER },
        },
        required: [
          "crop_name",
          "suitability_score",
          "reasoning",
          "expected_yield_per_acre",
          "estimated_roi_percentage",
        ],
      },
    },
    soil_preparation_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
    pest_disease_management: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          threat_name: { type: Type.STRING },
          prevention_strategy: { type: Type.STRING },
          treatment: { type: Type.STRING },
        },
        required: ["threat_name", "prevention_strategy", "treatment"],
      },
    },
    irrigation_schedule: { type: Type.STRING },
    sustainability_tips: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: [
    "recommended_crops",
    "soil_preparation_steps",
    "pest_disease_management",
    "irrigation_schedule",
    "sustainability_tips",
  ],
};

const SYSTEM_INSTRUCTION =
  "You are AgroBrain, a world-class Principal Agronomist and Agricultural Economist. Your job is to analyze farm specifications and provide highly accurate, scientifically sound, and economically viable crop recommendations. You must factor in soil science, water management, and local pest threats. You communicate directly, professionally, and entirely in valid JSON format. Never include markdown formatting, conversational filler, or introductory text outside of the requested JSON structure.";

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export async function generateAgrobrainReport(
  farm: Farm,
  request: { targetSeason: string; budgetLevel: string; specificConcerns: string },
) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const ai = new GoogleGenAI({ apiKey });
  const concerns = stripHtml(request.specificConcerns);
  const prompt = `Farm Profile:
- Region: ${farm.region}
- Size: ${farm.areaAcres} acres
- Soil: ${farm.soilType}
- Irrigation: ${farm.irrigationMethod}
- Climate zone: ${farm.climateZone}
- Historic crop: ${farm.historicCrop}
- Season: ${request.targetSeason}
- Budget: ${request.budgetLevel}
- User Concerns: ${concerns}

Generate a comprehensive crop advisory. You MUST return ONLY valid JSON strictly adhering to the following schema:
{
  "recommended_crops": [
    {
      "crop_name": "String",
      "suitability_score": "Number (0-100)",
      "reasoning": "String",
      "expected_yield_per_acre": "String (include units)",
      "estimated_roi_percentage": "Number"
    }
  ],
  "soil_preparation_steps": ["String"],
  "pest_disease_management": [
    {
      "threat_name": "String",
      "prevention_strategy": "String",
      "treatment": "String"
    }
  ],
  "irrigation_schedule": "String (Detailed timeline)",
  "sustainability_tips": ["String"]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema,
      maxOutputTokens: 8192,
      temperature: 0.2,
    },
  });

  const rawText = response.text?.trim();
  if (!rawText) {
    throw new Error("Gemini returned an empty response");
  }

  const parsed = aiResponseSchema.parse(JSON.parse(rawText));
  return {
    recommendedCrops: parsed.recommended_crops.map((crop) => ({
      cropName: crop.crop_name,
      suitabilityScore: crop.suitability_score,
      reasoning: crop.reasoning,
      expectedYieldPerAcre: crop.expected_yield_per_acre,
      estimatedRoiPercentage: crop.estimated_roi_percentage,
    })),
    soilPreparationSteps: parsed.soil_preparation_steps,
    pestDiseaseManagement: parsed.pest_disease_management.map((threat) => ({
      threatName: threat.threat_name,
      preventionStrategy: threat.prevention_strategy,
      treatment: threat.treatment,
    })),
    irrigationSchedule: parsed.irrigation_schedule,
    sustainabilityTips: parsed.sustainability_tips,
  };
}