
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

## Analysis Steps (Follow in order)
1. **Understand the overall structure**: Is this a manga/comic page, photo collage, grid layout, before/after comparison, multi-view image, or a single continuous image?
2. **Identify separation boundaries**: Look for straight lines (horizontal/vertical), borders, gutters, frames, clear edges, or strong contrast lines that divide the image into sections. Gutters between panels are typically 0.5-3% of image dimension.
3. **Define precise bounding boxes**: For each detected sub-image, determine the tightest possible bounding box that includes the content but excludes gutters, borders, and margins.
4. **Validate**: Ensure detected regions don't overlap significantly and cover all meaningful content.

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
5. **Tight boundaries**: Crop coordinates should be tight around the content. Exclude thin borders, margins, gutters, or decorative frames from the crop coordinates
6. Ensure crops do not overlap significantly
7. For grid layouts, ensure all cells are detected and make coordinates consistent across rows/columns
8. Panels touching the image edge should have coordinates at or very near 0 or 1000
9. **Gutter handling**: If there are gutters between panels, the crop boundary should be at the inner edge of the gutter (where the content starts), not at the outer edge
10. Be thorough - detect ALL distinct sub-images, not just the obvious ones

## Common patterns
- **Manga/Comics**: Panels separated by white or black gutters. Panels may be irregular sizes. Look for the gutter lines first, then define panels between them.
- **Photo grids**: Regular NxM arrangement. All cells should be similar size with consistent coordinates.
- **Before/After**: Usually 2 images side by side or top/bottom with a clear dividing line.
- **Collage**: Irregular arrangement of photos. Focus on distinct photo boundaries.

## Coordinate system
- Use coordinates in 0-1000 scale (NOT 0-1)
- box_2d format: [ymin, xmin, ymax, xmax]
- ymin/ymax = vertical position (0=top, 1000=bottom)
- xmin/xmax = horizontal position (0=left, 1000=right)
- Be precise with coordinates. For content at the very edge of the image, use values close to 0 or 1000.

## Output format
Return ONLY a valid JSON object:
{
  "crops": [
    { "label": "descriptive name", "box_2d": [ymin, xmin, ymax, xmax] }
  ]
}

## Examples
For a 2x2 grid image with thin gutters:
{
  "crops": [
    { "label": "top-left", "box_2d": [5, 5, 490, 490] },
    { "label": "top-right", "box_2d": [5, 510, 490, 995] },
    { "label": "bottom-left", "box_2d": [510, 5, 995, 490] },
    { "label": "bottom-right", "box_2d": [510, 510, 995, 995] }
  ]
}

For a manga page with 3 panels (2 on top, 1 on bottom):
{
  "crops": [
    { "label": "panel-1 top-left", "box_2d": [5, 5, 480, 495] },
    { "label": "panel-2 top-right", "box_2d": [5, 505, 480, 995] },
    { "label": "panel-3 bottom full-width", "box_2d": [500, 5, 995, 995] }
  ]
}

Now analyze the provided image and detect all sub-images with precise boundaries.`;

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

/**
 * Post-process crops to improve precision
 */
function postProcessCrops(crops: SplitResult[]): SplitResult[] {
    // Deep copy
    let result = crops.map(c => ({
        ...c,
        box_2d: [...c.box_2d] as [number, number, number, number]
    }));

    // 1. Snap edges close to image boundaries (within 3%)
    const edgeThreshold = 0.03;
    result = result.map(crop => {
        let [ymin, xmin, ymax, xmax] = crop.box_2d;
        if (ymin > 0 && ymin < edgeThreshold) ymin = 0;
        if (xmin > 0 && xmin < edgeThreshold) xmin = 0;
        if (ymax < 1 && ymax > 1 - edgeThreshold) ymax = 1;
        if (xmax < 1 && xmax > 1 - edgeThreshold) xmax = 1;
        return { ...crop, box_2d: [ymin, xmin, ymax, xmax] as [number, number, number, number] };
    });

    // 2. Align nearby edges across crops to reduce gaps
    if (result.length > 1) {
        const alignThreshold = 0.02;

        // Collect all edge values per axis, group nearby ones, align to average
        const alignEdges = (edges: { cropIdx: number; edgeIdx: number; value: number }[]) => {
            edges.sort((a, b) => a.value - b.value);
            const groups: (typeof edges)[] = [];
            let group: typeof edges = [];

            for (const e of edges) {
                if (group.length === 0 || e.value - group[0].value < alignThreshold) {
                    group.push(e);
                } else {
                    if (group.length > 1) groups.push(group);
                    group = [e];
                }
            }
            if (group.length > 1) groups.push(group);

            for (const g of groups) {
                const avg = g.reduce((s, v) => s + v.value, 0) / g.length;
                for (const v of g) {
                    result[v.cropIdx].box_2d[v.edgeIdx] = avg;
                }
            }
        };

        // Y-axis edges (ymin=0, ymax=2)
        const yEdges: { cropIdx: number; edgeIdx: number; value: number }[] = [];
        result.forEach((crop, i) => {
            yEdges.push({ cropIdx: i, edgeIdx: 0, value: crop.box_2d[0] });
            yEdges.push({ cropIdx: i, edgeIdx: 2, value: crop.box_2d[2] });
        });
        alignEdges(yEdges);

        // X-axis edges (xmin=1, xmax=3)
        const xEdges: { cropIdx: number; edgeIdx: number; value: number }[] = [];
        result.forEach((crop, i) => {
            xEdges.push({ cropIdx: i, edgeIdx: 1, value: crop.box_2d[1] });
            xEdges.push({ cropIdx: i, edgeIdx: 3, value: crop.box_2d[3] });
        });
        alignEdges(xEdges);
    }

    return result;
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

        // Post-process to improve precision
        const processedCrops = postProcessCrops(validatedCrops);
        
        return { crops: processedCrops };

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
