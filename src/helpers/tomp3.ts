import { spawn } from 'child_process';
import { pipeline } from 'stream/promises';
import { PassThrough } from 'stream';
import { MediaUpload } from 'gramio';

/**
 * Converts an audio stream from a URL to MP3 format using ffmpeg.
 * @param {string} url - The URL of the audio source.
 * @returns {Promise<Stream>} MP3 audio stream.
 */
export async function toMp3Stream(url: string) {
  const bitrate = '128k';
  const timeoutMs = 15000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error('No body in response stream');
    }

    const ffmpeg = spawn('ffmpeg', [
      '-hide_banner',
      '-loglevel', 'error',
      '-i', 'pipe:0',
      '-vn',
      '-c:a', 'libmp3lame',
      '-b:a', bitrate,
      '-f', 'mp3',
      'pipe:1',
    ], { stdio: ['pipe', 'pipe', 'pipe'] });

    // Suppress or log stderr as needed
    ffmpeg.stderr.on('data', () => {});

    const outputStream = new PassThrough();

    // Pipe input through ffmpeg
    pipeline(response.body, ffmpeg.stdin).catch((err) => {
      outputStream.destroy(err);
      try { ffmpeg.kill(); } catch (e) { /* ignore */ }
    });

    // Pipe ffmpeg output to our stream
    pipeline(ffmpeg.stdout, outputStream).catch((err) => {
      outputStream.destroy(err);
      try { ffmpeg.kill(); } catch (e) { /* ignore */ }
    });

    // Handle ffmpeg process exit
    ffmpeg.on('close', (code, signal) => {
      if (code !== 0) {
        outputStream.destroy(new Error(`ffmpeg exited with code ${code}, signal ${signal}`));
      } else {
        outputStream.end();
      }
    });

    return outputStream;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

interface AudioInfo {
  performer?: string;
  title?: string;
}

/**
 * Sends an audio file converted from URL to the chat.
 * @param {any} ctx - Context object.
 * @param {string} url - The URL of the audio source.
 * @param {string} filename - Output filename (default: 'file.mp3').
 * @param {AudioInfo} options - Additional options (performer, title).
 */
export async function sendAudioFromUrl(ctx: any, url: string, filename = 'file.mp3', options: AudioInfo = {}) {
  const stream = await toMp3Stream(url);
  await ctx.sendAudio(
    await MediaUpload.stream(stream, filename),
    { performer: options.performer, title: options.title },
  );
}
