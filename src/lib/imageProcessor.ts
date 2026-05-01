import { type AnalyzeResponse } from "./geminiSplitter";

export interface CropResult {
    id: string; // Unique ID
    blob: Blob;
    url: string; // Object URL for display
    label: string;
}

type CropBox = [number, number, number, number];

interface DecodedSourceImage {
    image: HTMLImageElement;
    objectUrl: string;
}

interface PixelCropRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

const CROP_JPEG_QUALITY = 0.92;

function formatFileMetadata(file: File): string {
    return `name=${file.name}, type=${file.type || "unknown"}, size=${file.size}`;
}

function formatCropMetadata(index: number, label: string, rect: PixelCropRect): string {
    return `cropIndex=${index}, label=${label}, rect=${JSON.stringify(rect)}`;
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
}

export function clampCropBox(box: CropBox): CropBox {
    const [rawYmin, rawXmin, rawYmax, rawXmax] = box;
    const ymin = clamp(Math.min(rawYmin, rawYmax), 0, 1);
    const xmin = clamp(Math.min(rawXmin, rawXmax), 0, 1);
    const ymax = clamp(Math.max(rawYmin, rawYmax), 0, 1);
    const xmax = clamp(Math.max(rawXmin, rawXmax), 0, 1);

    return [ymin, xmin, ymax, xmax];
}

async function decodeSourceImage(file: File): Promise<DecodedSourceImage> {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    const loadPromise = new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error(`Image element failed to load source image. (${formatFileMetadata(file)})`));
    });

    image.src = objectUrl;

    try {
        if (typeof createImageBitmap === "function") {
            try {
                const bitmap = await createImageBitmap(file);
                bitmap.close();
            } catch (error) {
                console.warn("[image-decode] createImageBitmap failed, using HTMLImageElement fallback", {
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    error,
                });
            }
        }

        if (typeof image.decode === "function") {
            try {
                await image.decode();
            } catch (error) {
                console.warn("[image-decode] image.decode failed, waiting for load event", {
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size,
                    error,
                });
                await loadPromise;
            }
        } else {
            await loadPromise;
        }

        if (!image.naturalWidth || !image.naturalHeight) {
            throw new Error(
                `Invalid decoded image size: ${image.naturalWidth}x${image.naturalHeight} (${formatFileMetadata(file)})`
            );
        }

        return { image, objectUrl };
    } catch (error) {
        URL.revokeObjectURL(objectUrl);
        console.error("[image-decode] failed", {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            error,
        });
        throw new Error(`The source image could not be decoded. (${formatFileMetadata(file)})`);
    }
}

function getPixelCropRect(box: CropBox, width: number, height: number): PixelCropRect {
    const [ymin, xmin, ymax, xmax] = clampCropBox(box);
    const x = clamp(Math.floor(xmin * width), 0, Math.max(width - 1, 0));
    const y = clamp(Math.floor(ymin * height), 0, Math.max(height - 1, 0));
    const right = clamp(Math.ceil(xmax * width), x + 1, width);
    const bottom = clamp(Math.ceil(ymax * height), y + 1, height);

    return {
        x,
        y,
        width: Math.max(1, right - x),
        height: Math.max(1, bottom - y),
    };
}

export async function processImageCrops(
    originalFile: File,
    analysisData: AnalyzeResponse
): Promise<CropResult[]> {
    console.info("[split-image] start", {
        fileName: originalFile.name,
        fileType: originalFile.type,
        fileSize: originalFile.size,
        cropCount: analysisData.crops.length,
    });

    const { image, objectUrl } = await decodeSourceImage(originalFile);
    const width = image.naturalWidth;
    const height = image.naturalHeight;

    console.info("[split-image] image decoded", { width, height });

    const results: CropResult[] = [];

    try {
        for (const [index, crop] of analysisData.crops.entries()) {
            const normalizedBox = clampCropBox(crop.box_2d);
            const rect = getPixelCropRect(normalizedBox, width, height);

            console.info("[split-image] crop rect", {
                index,
                label: crop.label,
                originalBox: crop.box_2d,
                normalizedBox,
                rect,
            });

            try {
                const canvas = document.createElement("canvas");
                canvas.width = rect.width;
                canvas.height = rect.height;
                const ctx = canvas.getContext("2d");

                if (!ctx) {
                    throw new Error(
                        `Canvas 2D context is not available. (${formatFileMetadata(originalFile)}, ${formatCropMetadata(index, crop.label, rect)})`
                    );
                }

                ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);

                const blob = await new Promise<Blob>((resolve, reject) => {
                    canvas.toBlob((result) => {
                        if (!result) {
                            reject(
                                new Error(
                                    `Failed to export cropped image blob. (${formatFileMetadata(originalFile)}, ${formatCropMetadata(index, crop.label, rect)})`
                                )
                            );
                            return;
                        }
                        resolve(result);
                    }, "image/jpeg", CROP_JPEG_QUALITY);
                });

                const url = URL.createObjectURL(blob);
                results.push({
                    id: crypto.randomUUID(),
                    blob,
                    url,
                    label: crop.label
                });
            } catch (error) {
                console.error("[split-image] crop failed", {
                    fileName: originalFile.name,
                    fileType: originalFile.type,
                    fileSize: originalFile.size,
                    cropIndex: index,
                    label: crop.label,
                    originalBox: crop.box_2d,
                    normalizedBox,
                    rect,
                    error,
                });
                throw error;
            }
        }

        return results;
    } catch (error) {
        console.error("[split-image] failed", {
            fileName: originalFile.name,
            fileType: originalFile.type,
            fileSize: originalFile.size,
            error,
        });
        throw error;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}
