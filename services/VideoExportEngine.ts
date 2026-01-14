
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export type ExportFormat = 'mp4' | 'webm' | 'png-sequence';

export class VideoExportEngine {
  private static ffmpeg: FFmpeg | null = null;
  private static isLoaded = false;

  static async load(onProgress?: (p: number) => void) {
    if (this.isLoaded) return;
    
    if (typeof SharedArrayBuffer === 'undefined') {
        console.warn("SharedArrayBuffer not found. CinemaLab will use PNG sequence fallback.");
        return;
    }

    this.ffmpeg = new FFmpeg();
    this.ffmpeg.on('log', ({ message }) => console.debug("[FFmpeg]", message));
    this.ffmpeg.on('progress', ({ progress }) => onProgress?.(Math.round(progress * 100)));

    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
    await this.ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });
    
    this.isLoaded = true;
  }

  static async exportVideo(
    frames: string[], 
    fps: number, 
    format: ExportFormat, 
    audioUrl?: string | null
  ): Promise<Blob | string[]> {
    if (!this.isLoaded || !this.ffmpeg || format === 'png-sequence') {
        return frames;
    }

    try {
        const ff = this.ffmpeg;
        
        // 1. Escreve os frames
        for (let i = 0; i < frames.length; i++) {
            const fileName = `frame${i.toString().padStart(5, '0')}.png`;
            await ff.writeFile(fileName, await fetchFile(frames[i]));
        }

        // 2. Trata Áudio se houver
        const audioArgs: string[] = [];
        if (audioUrl) {
            await ff.writeFile('audio.mp3', await fetchFile(audioUrl));
            audioArgs.push('-i', 'audio.mp3', '-c:a', 'aac', '-b:a', '128k', '-shortest');
        }

        const outName = `output.${format}`;
        const codec = format === 'mp4' ? 'libx264' : 'libvpx-vp9';
        
        // 3. Executa comando (Adicionado suporte a áudio e preset de velocidade)
        await ff.exec([
            '-framerate', fps.toString(),
            '-i', 'frame%05d.png',
            ...audioArgs,
            '-c:v', codec,
            '-pix_fmt', 'yuv420p',
            '-preset', 'ultrafast',
            outName
        ]);

        const data = await ff.readFile(outName);
        const type = format === 'mp4' ? 'video/mp4' : 'video/webm';
        
        // Limpeza de cache FS
        await ff.deleteFile(outName);
        if (audioUrl) await ff.deleteFile('audio.mp3');

        return new Blob([(data as any).buffer], { type });
    } catch (e) {
        console.error("FFmpeg Execution Failed", e);
        throw e;
    }
  }

  static isSupported() {
    return typeof SharedArrayBuffer !== 'undefined';
  }
}
