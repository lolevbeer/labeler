// Local print endpoint for the dev/preview server.
//
// A browser app can't run `lp`, and the Rollo only prints reliably when fed an
// exact 3×2 PDF straight to CUPS (the browser print dialog mis-sizes it). So the
// Print button POSTs the label fields here; we re-render the app headless at the
// printed-label size and send the PDF to the Rollo via `lp`. This only exists on
// the local dev/preview server — on a static deploy the POST 404s and the client
// falls back to window.print().
//
// Printer prerequisites (set once, see the chat that introduced this): the Rollo
// must be calibrated to the 3×2 stock, and its CUPS defaults set to
// `Resolution=203dpi roMediaTracking=Gap`.
//
// We do NOT rely on the static `media` default (which was 2in tall). With gap
// tracking the printer prints a full form, then feeds forward until the sensor
// finds the next gap. If the form length equals the 2in label pitch, that feed
// lands at/just past the gap and overshoots into the next label — ejecting a
// blank. So each job overrides the form to FEED (1.9in, 0.1in short of the
// stock): the printer finishes printing *before* the gap, then advances the
// last 0.1in to the next label boundary — exactly one label, no blank.
// Shortening the @page in index.css alone did NOT fix this: the rasterizer still
// fed a 2in form (content at top, white tail), so the overshoot persisted. The
// form length is what matters, and it lives here, not in CSS.
import type { Plugin, Connect } from "vite"
import { execFile } from "node:child_process"
import { promisify } from "node:util"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { IncomingMessage, ServerResponse } from "node:http"

const run = promisify(execFile)

// macOS Chrome — this path is local-only (USB Rollo on this Mac). Adjust if your
// Chrome lives elsewhere.
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const PRINTER = "Rollo"
// Form/feed length in points: 216×137 = 3in × 1.9in, 0.1in short of the 2in
// stock so gap tracking stops within the label instead of overshooting.
// ponytail: the 0.1in margin is the calibration knob — shrink the height a few
// more points if a worn/miscalibrated roll still ejects a blank.
const FEED = "Custom.216x137"
// Hard ceiling on copies per request so a bad client value can't run off a whole
// roll. The client clamps too, but this is the authoritative limit.
const MAX_COPIES = 50

function clampCopies(n: unknown): number {
  const c = Math.floor(Number(n))
  return Number.isFinite(c) && c >= 1 ? Math.min(c, MAX_COPIES) : 1
}

async function renderAndPrint(
  host: string,
  fieldsJson: string,
  copies: number,
): Promise<void> {
  // Re-render the running app with these fields, captured at the @page 3×2 size.
  const f = Buffer.from(fieldsJson).toString("base64")
  const url = `http://${host}/?f=${f}`
  const dir = await mkdtemp(join(tmpdir(), "rollo-"))
  const pdf = join(dir, "label.pdf")
  await run(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--no-pdf-header-footer",
    // Wait for the Poppins web font to load before snapshotting, else the label
    // falls back to Arial in the PDF.
    "--virtual-time-budget=6000",
    `--print-to-pdf=${pdf}`,
    url,
  ])
  // -n prints `copies` forms; cupsManualCopies replicates the 1.9in raster page,
  // so each copy advances exactly one label.
  await run("lp", ["-d", PRINTER, "-o", `media=${FEED}`, "-n", String(copies), pdf])
}

const handler: Connect.NextHandleFunction = (req, res) => {
  const r = req as IncomingMessage
  const w = res as ServerResponse
  if (r.method !== "POST") {
    w.statusCode = 405
    w.end()
    return
  }
  let body = ""
  r.on("data", (c) => (body += c))
  r.on("end", async () => {
    w.setHeader("content-type", "application/json")
    try {
      // Body is { fields, count }. Only `fields` goes into the headless render;
      // `count` drives copies and is clamped server-side.
      const { fields = {}, count } = JSON.parse(body || "{}")
      await renderAndPrint(
        r.headers.host || "localhost:5174",
        JSON.stringify(fields),
        clampCopies(count),
      )
      w.statusCode = 200
      w.end(JSON.stringify({ ok: true }))
    } catch (e) {
      w.statusCode = 500
      w.end(JSON.stringify({ ok: false, error: (e as Error).message ?? String(e) }))
    }
  })
}

export function rolloPrint(): Plugin {
  return {
    name: "rollo-print",
    configureServer(server) {
      server.middlewares.use("/print", handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use("/print", handler)
    },
  }
}
