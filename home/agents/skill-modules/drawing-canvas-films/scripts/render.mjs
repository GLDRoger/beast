#!/usr/bin/env node
// Renders film.html frame by frame in headless Chrome and encodes it with ffmpeg.
//
//   node render.mjs film.html                    full MP4 with synthesized sound
//   node render.mjs film.html --grid 24          contact sheet of 24 evenly spaced frames
//   node render.mjs film.html --only 120,480     full-size PNGs of specific frames
//   node render.mjs film.html --seed 3           same film, different hand
//
// The page runs offline: every non-file request is aborted and reported.
import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const argv = process.argv.slice(2);
const opt = { _: [] };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) opt[a.slice(2)] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
  else opt._.push(a);
}
const html = path.resolve(opt._[0] ?? 'film.html');
const outDir = path.resolve(opt.out ?? 'out');
const seed = opt.seed ?? null;
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
if (!fs.existsSync(html)) throw new Error(`No such file: ${html}`);
fs.mkdirSync(outDir, { recursive: true });

const base = path.basename(html, '.html') + (seed ? `-s${seed}` : '');
const dataUrlToBuffer = (u) => Buffer.from(u.slice(u.indexOf(',') + 1), 'base64');

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ['--hide-scrollbars', '--force-color-profile=srgb', '--mute-audio'],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  const external = [];
  await page.setRequestInterception(true);
  page.on('request', (r) => {
    if (r.url().startsWith('file:')) r.continue();
    else { external.push(r.url()); r.abort(); }
  });
  let pageError = null;
  page.on('pageerror', (e) => { pageError = e; });
  const url = pathToFileURL(html).href + '?render=1' + (seed ? `&s=${seed}` : '');
  await page.goto(url, { waitUntil: 'load' });
  await page.setOfflineMode(true);
  await page.waitForFunction('window.FILM && window.FILM.ready', { timeout: 10000 }).catch(() => {});
  if (pageError) throw pageError;
  const info = await page.evaluate(() => ({ W: FILM.W, H: FILM.H, FPS: FILM.FPS, N: FILM.N, lines: FILM.lines }));
  const bytes = fs.statSync(html).size;
  console.log(`${path.basename(html)}: ${(bytes / 1024).toFixed(1)} KB, ${info.lines} lines of script, ${info.N} frames @ ${info.FPS} fps`);

  if (opt.grid) {
    const n = Number(opt.grid) || 24;
    const frames = Array.from({ length: n }, (_, k) => Math.round((k * (info.N - 1)) / (n - 1)));
    const list = opt.frames ? String(opt.frames).split(',').map(Number) : frames;
    const u = await page.evaluate((l) => FILM.sheet(l, 6, 480), list);
    const file = path.join(outDir, `${base}-grid.png`);
    fs.writeFileSync(file, dataUrlToBuffer(u));
    console.log(`wrote ${file}`);
  } else if (opt.only) {
    for (const f of String(opt.only).split(',').map(Number)) {
      const t0 = performance.now();
      const u = await page.evaluate((fr) => { FILM.draw(fr); return FILM.canvas.toDataURL('image/png'); }, f);
      const file = path.join(outDir, `${base}-f${String(f).padStart(4, '0')}.png`);
      fs.writeFileSync(file, dataUrlToBuffer(u));
      console.log(`wrote ${file} (${(performance.now() - t0).toFixed(0)} ms)`);
    }
  } else {
    const wav = path.join(outDir, `${base}.wav`);
    const t0 = performance.now();
    const b64 = await page.evaluate(async () => FILM.wavBase64(await FILM.renderAudio()));
    fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
    console.log(`audio: ${wav} (${((performance.now() - t0) / 1000).toFixed(1)} s)`);

    const mp4 = path.join(outDir, `${base}.mp4`);
    const ff = spawn('ffmpeg', [
      '-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(info.FPS), '-c:v', 'png', '-i', '-',
      '-i', wav,
      '-map', '0:v', '-map', '1:a',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', '-tune', 'animation',
      '-af', 'loudnorm=I=-16:TP=-1.5:LRA=14', '-ar', '48000',
      '-c:a', 'aac', '-b:a', '192k',
      '-movflags', '+faststart', '-shortest', mp4,
    ], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg exited ${c}`)))));
    const from = Number(opt.from ?? 0), to = Number(opt.to ?? info.N - 1);
    const r0 = performance.now();
    for (let f = from; f <= to; f++) {
      const u = await page.evaluate((fr) => { FILM.draw(fr); return FILM.canvas.toDataURL('image/png'); }, f);
      if (!ff.stdin.write(dataUrlToBuffer(u))) await new Promise((r) => ff.stdin.once('drain', r));
      if (f % 48 === 0 || f === to) {
        const el = (performance.now() - r0) / 1000;
        process.stdout.write(`\rframe ${f + 1}/${to + 1}  ${el.toFixed(0)} s`);
      }
    }
    ff.stdin.end();
    await done;
    process.stdout.write('\n');
    console.log(`video: ${mp4}`);
  }
  if (pageError) throw pageError;
  console.log(external.length ? `external requests blocked: ${external.length}\n  ${external.join('\n  ')}` : 'external requests: none');
} finally {
  await browser.close();
}
