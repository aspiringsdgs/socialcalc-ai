/**
 * Image Compressor Utility for SocialCalc
 * 
 * Automatically compresses images (logos, stamps) to fit under a
 * specified file-size threshold using canvas-based resizing and JPEG
 * quality reduction.
 */

export async function compressImage(
    file: File,
    maxSizeBytes: number
): Promise<string> {
    if (file.size <= maxSizeBytes) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    const img = await loadImage(file);
    return compressImageElement(img, maxSizeBytes);
}

export async function compressDataUrl(
    dataUrl: string,
    maxSizeBytes: number
): Promise<string> {
    if (dataUrlToBytes(dataUrl) <= maxSizeBytes) {
        return dataUrl;
    }

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = dataUrl;
    });
    return compressImageElement(img, maxSizeBytes);
}

async function compressImageElement(
    img: HTMLImageElement,
    maxSizeBytes: number
): Promise<string> {
    const MAX_DIMENSION = 800;
    
    let scaleFactor = 1;
    if (img.width > MAX_DIMENSION || img.height > MAX_DIMENSION) {
        scaleFactor = MAX_DIMENSION / Math.max(img.width, img.height);
    }
    
    const MIN_QUALITY = 0.4;
    const MAX_ITERATIONS = 10;

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const width = Math.round(img.width * scaleFactor);
        const height = Math.round(img.height * scaleFactor);

        let quality = 0.8;
        while (quality >= MIN_QUALITY) {
            const dataUrl = drawToCanvas(img, width, height, quality);
            const size = dataUrlToBytes(dataUrl);
            if (size <= maxSizeBytes) {
                return dataUrl;
            }
            quality -= 0.15;
        }

        scaleFactor *= 0.75;

        if (img.width * scaleFactor < 30 || img.height * scaleFactor < 30) {
            break;
        }
    }

    const finalW = Math.max(30, Math.round(img.width * scaleFactor));
    const finalH = Math.max(30, Math.round(img.height * scaleFactor));
    return drawToCanvas(img, finalW, finalH, MIN_QUALITY);
}

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = reader.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function drawToCanvas(
    img: HTMLImageElement,
    width: number,
    height: number,
    quality: number
): string {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL("image/jpeg", quality);
}

function dataUrlToBytes(dataUrl: string): number {
    const base64 = dataUrl.split(",")[1] || "";
    return Math.ceil((base64.length * 3) / 4);
}
