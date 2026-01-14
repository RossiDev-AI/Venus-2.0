import { GoogleGenAI } from "@google/genai";
import { AppSettings } from "./types";

const getAI = (settings?: AppSettings) => {
  const key = settings?.googleApiKey || (process.env.API_KEY as string);
  return new GoogleGenAI({ apiKey: key });
};

export interface InpaintParams {
  baseImageBase64: string; // data:image/png;base64,...
  maskBase64: string;     // data:image/png;base64,...
  prompt: string;
  settings?: AppSettings;
}

export async function executeGenerativeInpaint({
  baseImageBase64,
  maskBase64,
  prompt,
  settings,
}: InpaintParams): Promise<string> {
  const ai = getAI(settings);

  // Clean base64 strings
  const cleanBase = baseImageBase64.split(',')[1] || baseImageBase64;
  const cleanMask = maskBase64.split(',')[1] || maskBase64;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: cleanBase,
            mimeType: 'image/png',
          },
        },
        {
          inlineData: {
            data: cleanMask,
            mimeType: 'image/png',
          },
        },
        {
          text: `Inpaint/Edit this image using the provided binary mask. The white areas in the mask are where the changes should happen. Prompt: ${prompt}`,
        },
      ],
    },
  });

  let resultUrl = "";
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        resultUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!resultUrl) {
    throw new Error("Gemini Oracle: Falha ao gerar nova síntese latente.");
  }

  return resultUrl;
}
