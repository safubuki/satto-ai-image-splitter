
import { GoogleGenAI } from "@google/genai";

export interface BoundingBox {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
}

export interface SplitResult {
    label: string;
    box_2d: [number, number, number, number]; // ymin, xmin, ymax, xmax (0-1000 scale)
}

export interface AnalyzeResponse {
    crops: SplitResult[];
}

const SYSTEM_PROMPT = `You are an expert image analysis AI specialized in detecting and segmenting sub-images within composite images.

## Task
Analyze this image and identify ALL distinct sub-images, panels, or sections that could be extracted as individual images.

## What to detect
- Comic/manga panels (each story panel)
- Photo collages (each individual photo)
- Grid layouts (each cell/quadrant)
- Before/after comparisons (each side)
- Multi-view images (each view angle)
- Screenshot compilations (each screenshot)
- Any visually distinct bounded region that represents a separate image

## Detection rules
1. Look for clear visual boundaries: borders, gutters, frames, edges, or strong contrast lines
2. Each detected region should be a complete, meaningful sub-image
3. Do NOT split a single continuous image into arbitrary parts
4. If the image has no sub-divisions, return the entire image as one crop
5. Exclude thin borders, margins, or decorative frames from the crop coordinates
6. Ensure crops do not overlap significantly

## Coordinate system
- Use coordinates in 0-1000 scale (NOT 0-1)
- box_2d format: [ymin, xmin, ymax, xmax]
- ymin/ymax = vertical position (0=top, 1000=bottom)
- xmin/xmax = horizontal position (0=left, 1000=right)

## Output format
Return ONLY a valid JSON object:
{
  "crops": [
    { "label": "descriptive name", "box_2d": [ymin, xmin, ymax, xmax] }
  ]
}

## Example
For a 2x2 grid image:
{
  "crops": [
    { "label": "top-left image", "box_2d": [0, 0, 490, 490] },
    { "label": "top-right image", "box_2d": [0, 510, 490, 1000] },
    { "label": "bottom-left image", "box_2d": [510, 0, 1000, 490] },
    { "label": "bottom-right image", "box_2d": [510, 510, 1000, 1000] }
  ]
}

Now analyze the provided image and detect all sub-images.`;

/**
 * Detect MIME type from base64 data URL
 */
function detectMimeType(base64: string): string {
    const match = base64.match(/^data:(image\/\w+);base64,/);
    if (match) {
        return match[1];
    }
    // Default fallback
    return "image/jpeg";
}

/**
 * Convert coordinates from 0-1000 scale to 0-1 normalized scale
 */
function normalizeCoordinates(box: [number, number, number, number]): [number, number, number, number] {
    return [
        Math.max(0, Math.min(1, box[0] / 1000)),
        Math.max(0, Math.min(1, box[1] / 1000)),
        Math.max(0, Math.min(1, box[2] / 1000)),
        Math.max(0, Math.min(1, box[3] / 1000))
    ];
}

/**
 * Validate and fix bounding box coordinates
 */
function validateBox(box: [number, number, number, number]): [number, number, number, number] | null {
    let [ymin, xmin, ymax, xmax] = box;
    
    // Ensure proper ordering
    if (ymin > ymax) [ymin, ymax] = [ymax, ymin];
    if (xmin > xmax) [xmin, xmax] = [xmax, xmin];
    
    // Calculate dimensions
    const width = xmax - xmin;
    const height = ymax - ymin;
    
    // Filter out too small regions (less than 2% of image in either dimension)
    if (width < 0.02 || height < 0.02) {
        return null;
    }
    
    return [ymin, xmin, ymax, xmax];
}

export async function analyzeImage(fileBase64: string, apiKey: string, modelName: string = "gemini-2.5-flash-lite"): Promise<AnalyzeResponse> {
    const ai = new GoogleGenAI({ apiKey });

    // Detect MIME type before removing header
    const mimeType = detectMimeType(fileBase64);
    
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
                                mimeType: mimeType,
                                data: cleanBase64,
                            },
                        },
                    ],
                },
            ],
            config: {
                responseMimeType: "application/json",
                temperature: 0.1, // Low temperature for consistent, precise outputs
            }
        });

        const text = response.text || "";

        // Handle code blocks if regular text is returned despite JSON instruction
        let jsonStr = text;
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            jsonStr = jsonMatch[1].trim();
        }

        const json = JSON.parse(jsonStr);
        
        if (!json.crops || !Array.isArray(json.crops)) {
            throw new Error("APIからの応答が不正なフォーマットです");
        }

        // Process and validate each crop
        const validatedCrops: SplitResult[] = [];
        
        for (const crop of json.crops) {
            if (!crop.box_2d || !Array.isArray(crop.box_2d) || crop.box_2d.length !== 4) {
                continue;
            }
            
            // Normalize from 0-1000 to 0-1 scale
            const normalizedBox = normalizeCoordinates(crop.box_2d as [number, number, number, number]);
            
            // Validate the box
            const validBox = validateBox(normalizedBox);
            if (validBox) {
                validatedCrops.push({
                    label: crop.label || `region ${validatedCrops.length + 1}`,
                    box_2d: validBox
                });
            }
        }
        
        // If no valid crops found, return the entire image
        if (validatedCrops.length === 0) {
            validatedCrops.push({
                label: "full image",
                box_2d: [0, 0, 1, 1]
            });
        }
        
        return { crops: validatedCrops };

    } catch (error: any) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Gemini API Error details:", error);

        if (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('401')) {
            throw new Error('APIキーが無効です。設定を確認してください。');
        }
        if (errorMessage.includes('PERMISSION_DENIED') || errorMessage.includes('403')) {
            throw new Error('アクセス権限がありません。Gemini APIがこのキーで有効になっているか確認してください。');
        }
        if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
            throw new Error('API制限(Quota)を超えました(429)。しばらく待ってから再試行してください。');
        }

        throw new Error(`Gemini API エラー: ${errorMessage}`);
    }
}
