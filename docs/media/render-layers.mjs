// Renders layers.html to layers-light.png and layers-dark.png with headless Chrome.
// Usage: node docs/media/render-layers.mjs   (set CHROME to override the browser path)
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const html = fileURLToPath(new URL("layers.html", import.meta.url));
const url = pathToFileURL(html).href;
const base = ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1280,2000"];
const dom = execFileSync(chrome, [...base, "--dump-dom", url], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const height = Number(/<title>(\d+)<\/title>/.exec(dom)?.[1]);
if (!height) throw new Error("could not measure layers.html");
for (const [name, scheme] of [["light", 1], ["dark", 0]]) {
  const out = fileURLToPath(new URL(`layers-${name}.png`, import.meta.url));
  execFileSync(chrome, [...base.slice(0, 3), `--window-size=1280,${height}`, "--force-device-scale-factor=2",
    `--blink-settings=preferredColorScheme=${scheme}`, `--screenshot=${out}`, url], { stdio: "ignore" });
  console.log(`${out} (1280x${height} @2x)`);
}
