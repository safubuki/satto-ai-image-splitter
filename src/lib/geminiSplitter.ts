
import { GoogleGenAI } from "@google/genai";

export interface BoundingBox {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
}

export interface SplitResult {
    label: string;
    box_2d: [number, number, number, number]; // ymin, xmin, ymax, xmax
}

export interface AnalyzeResponse {
    crops: SplitResult[];
}

const SYSTEM_PROMPT = `
Analyze this image which consists of multiple sub-images arranged in a grid, collage, or comic strip format.
Your task is to identify and extract the bounding box for EACH distinct sub-image (panel).

Guidelines:
- Detect the precise boundary of each sub-image, excluding outer borders or gutters if possible.
- If the image is a comic/manga page, detect each panel.
- If the image is a 2x2 grid, detect 4 quadrants.
- Ensure no sub-image is missed.
- Return the coordinates in specific order (e.g. top-left, top-right, bottom-left, bottom-right) if possible, or reading order.

Return a JSON object with a key "crops" containing an array of objects.
Each object must have:
- "label": A short, descriptive label (e.g., "panel 1", "top-left view", "character face").
- "box_2d": [ymin, xmin, ymax, xmax] (normalized coordinates 0-1).

Example Output JSON:
{
  "crops": [
    { "label": "top-left panel", "box_2d": [0.0, 0.0, 0.49, 0.49] },
    { "label": "top-right panel", "box_2d": [0.0, 0.51, 0.49, 1.0] }
  ]
}
`;

export async function analyzeImage(fileBase64: string, apiKey: string, modelName: string = "gemini-2.5-flash-lite"): Promise<AnalyzeResponse> {
    const ai = new GoogleGenAI({ apiKey });

    // Base64 string might contain header "data:image/jpeg;base64,". Remove it if present.
    const cleanBase64 = fileBase64.replace(/^data:image\/\w+;base64,/, "");

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: SYSTEM_PROMPT },
                        {
                            inlineData: {
                                mimeType: "image/jpeg", // Assuming jpeg or we could detect
                                data: cleanBase64,
                            },
                        },
                    ],
                },
            ],
            config: {
                responseMimeType: "application/json",
            }
        });

        const text = response.text || "";

        // Handle code blocks if regular text is returned despite JSON instruction
        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        const json = JSON.parse(jsonStr) as AnalyzeResponse;
        if (!json.crops || !Array.isArray(json.crops)) {
            // Fallback: try to fix common JSON issues or just throw
            throw new Error("Invalid Array format in response");
        }
        return json;

    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Gemini API Error details:", error);

        if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('401')) {
            throw new Error('API Key is invalid. Please check your settings.');
        }
        if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403')) {
            throw new Error('Permission denied. Ensure the Gemini API is enabled for this key.');
        }
        if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
            throw new Error('Quota exceeded (429). Please wait or switch to a "Lite" / "Flash" model in settings.');
        }

        throw new Error(`Gemini API Error: ${errorMessage}`);
    }
}
