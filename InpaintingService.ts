
import { GoogleGenAI } from "@google/genai";
import { AppSettings, LuminaImageProps, LuminaPreset } from "./types";

// Added fix: API key must be obtained exclusively from process.env.API_KEY per guidelines
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY as string });
};

const getGradingStyleDescription = (props: LuminaImageProps): string => {
    let desc = "Keep the original image style, specifically: ";
    if (props.lutPreset) desc += `Follow the '${props.lutPreset}' cinematic lut. `;
    if (props.exposure > 0.2) desc += "Maintain the high exposure and bright look. ";
    if (props.exposure < -0.2) desc += "Maintain the moody, underexposed atmosphere. ";
    if (props.contrast > 1.2) desc += "Ensure strong contrast between lights and shadows. ";
    if (props.saturation < 0.8) desc += "Maintain the desaturated, muted color palette. ";
    if (props.saturation > 1.2) desc += "Maintain the vivid, highly saturated colors. ";
    if (props.hue !== 0) desc += "Respect the current color shift/tint of the scene. ";
    return desc;
};

export interface InpaintJob {
    image: string; // base64
    mask: string;  // base64
    prompt: string;
    props: LuminaImageProps;
    settings?: AppSettings;
    activePreset?: LuminaPreset; 
    ocrContextKeywords?: string[]; // Novo: Palavras-chave do OCR
}

export async function executeStyleAwareInpaint(job: InpaintJob): Promise<string> {
    const ai = getAI();
    const styleContext = getGradingStyleDescription(job.props);
    
    // Injeção de Contexto OCR
    const ocrMetadata = job.ocrContextKeywords && job.ocrContextKeywords.length > 0 
        ? ` Detected elements in scene: ${job.ocrContextKeywords.join(', ')}.` 
        : "";

    const presetSuffix = job.activePreset?.promptSuffix ? ` Style directives: ${job.activePreset.promptSuffix}.` : "";
    const finalPrompt = `${job.prompt}.${presetSuffix}${ocrMetadata} ${styleContext} seamlessly blend the new content into the existing frame.`;

    const cleanBase = job.image.split(',')[1] || job.image;
    const cleanMask = job.mask.split(',')[1] || job.mask;

    // Added fix: accessing .text property on response object (not text()) and following generation format
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: {
            parts: [
                { inlineData: { data: cleanBase, mimeType: 'image/png' } },
                { inlineData: { data: cleanMask, mimeType: 'image/png' } },
                { text: `TASK: Inpaint the masked areas. ${finalPrompt}` }
            ]
        }
    });

    let result = "";
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) result = `data:image/png;base64,${part.inlineData.data}`;
        }
    }

    if (!result) throw new Error("Inpainting Synthesis Failed");
    return result;
}
