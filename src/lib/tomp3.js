import { spawn } from 'child_process';
import { pipeline } from 'stream/promises';
import { PassThrough } from 'stream';

/**
 * Converts an audio stream from a URL to MP3 format using ffmpeg.
 * @param {string} url - The URL of the audio source.
 * @param {Object} options - Conversion options.
 * @param {string} options.bitrate - Audio bitrate (default: '192k').
 * @param {number} options.timeoutMs - Request timeout in milliseconds.
 * @returns {Promise<Stream>} MP3 audio stream.
 */
export async function toMp3Stream(url, options = {}) {
  const bitrate = options.bitrate || '192k';

  const response = await fetch(url, { timeout: options.timeoutMs });
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
}

/**
 * Sends an audio file converted from URL to the chat.
 * @param {Object} ctx - Telegraf context object.
 * @param {string} url - The URL of the audio source.
 * @param {string} filename - Output filename (default: 'file.mp3').
 * @param {Object} options - Additional options (performer, title).
 * @returns {Promise<Object>} Telegram API response.
 */
export async function sendAudioFromUrl(ctx, url, filename = 'file.mp3', options = {}) {
  const stream = await toMp3Stream(url, options);
  return ctx.replyWithAudio(
    { source: stream, filename },
    { performer: options.performer, title: options.title },
  );
}
