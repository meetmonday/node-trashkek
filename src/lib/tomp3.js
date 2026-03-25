import { spawn } from 'child_process';
import { pipeline } from 'stream/promises';
import { PassThrough } from 'stream';

export async function toMp3Stream(url, options = {}) {
  const bitrate = options.bitrate || '192k';
  const res = await fetch(url, { timeout: options.timeoutMs });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
  if (!res.body) throw new Error('No body in response stream');

  const ffmpeg = spawn('ffmpeg', [
    '-hide_banner', '-loglevel', 'error',
    '-i', 'pipe:0',
    '-vn',
    '-c:a', 'libmp3lame',
    '-b:a', bitrate,
    '-f', 'mp3',
    'pipe:1'
  ], { stdio: ['pipe', 'pipe', 'pipe'] });

  ffmpeg.stderr.on('data', () => {}); // suppress or log as needed

  const outStream = new PassThrough();

  pipeline(res.body, ffmpeg.stdin).catch((err) => {
    outStream.destroy(err);
    try { ffmpeg.kill(); } catch {}
  });
  pipeline(ffmpeg.stdout, outStream).catch((err) => {
    outStream.destroy(err);
    try { ffmpeg.kill(); } catch {}
  });

  ffmpeg.on('close', (code, signal) => {
    if (code !== 0) outStream.destroy(new Error(`ffmpeg exited with code ${code} signal ${signal}`));
    else outStream.end();
  });

  return outStream;
}

export async function sendAudioFromUrl(ctx, url, filename = 'file.mp3', options = {}) {
  const stream = await toMp3Stream(url, options);
  return ctx.replyWithAudio({ source: stream, filename }, { performer: options.performer, title: options.title });
}
