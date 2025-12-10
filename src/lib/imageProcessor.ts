import { type AnalyzeResponse } from "./geminiSplitter";

export interface CropResult {
    id: string; // Unique ID
    blob: Blob;
    url: string; // Object URL for display
    label: string;
}

export async function processImageCrops(
    originalFile: File,
    analysisData: AnalyzeResponse
): Promise<CropResult[]> {
    const imageBitmap = await createImageBitmap(originalFile);
    const { width, height } = imageBitmap;

    const results: CropResult[] = [];

    for (const crop of analysisData.crops) {
        const [ymin, xmin, ymax, xmax] = crop.box_2d;

        // Calculate pixel coordinates
        const x = xmin * width;
        const y = ymin * height;
        const w = (xmax - xmin) * width;
        const h = (ymax - ymin) * height;

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");

        if (!ctx) continue;

        // Draw the cropped portion
        ctx.drawImage(imageBitmap, x, y, w, h, 0, 0, w, h);

        // Convert to Blob
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg"));

        if (blob) {
            const url = URL.createObjectURL(blob);
            results.push({
                id: crypto.randomUUID(),
                blob,
                url,
                label: crop.label
            });
        }
    }

    return results;
}

export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}
