import { useEffect, useState, type ChangeEvent } from "react"
import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BeerSelect } from "@/components/BeerSelect"
import { DatePicker } from "@/components/DatePicker"
import { LabelPreview } from "@/components/LabelPreview"

// Brewery is a fixed constant (never editable, never stored).
const BREWERY = "Lolev Beer"
const STORE = "lolev-label"

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

type Fields = {
  beer: string
  style: string
  abv: string
  packaged: string
  contents: string
  address: string
}

const DEFAULTS: Fields = {
  beer: "Jaguar",
  style: "Ultra Hopped Ale",
  abv: "8.5%",
  packaged: today(),
  contents: "20 Liters • 1/6 bbl",
  address: "5247 Butler St, Pittsburgh, PA",
}

// Persisted across reloads. Net contents and the manufacturing address are
// intentionally excluded so they always reset to their defaults each session.
const PERSIST_KEYS: (keyof Fields)[] = [
  "beer",
  "style",
  "abv",
  "packaged",
]

function loadPersisted(): Partial<Fields> {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || "{}") as Record<
      string,
      unknown
    >
    const out: Partial<Fields> = {}
    for (const k of PERSIST_KEYS) {
      if (typeof saved[k] === "string") out[k] = saved[k] as string
    }
    return out
  } catch {
    return {}
  }
}

const FORM_FIELDS: { key: keyof Fields; label: string; type?: string }[] = [
  { key: "beer", label: "Beer name" },
  { key: "style", label: "Style" },
  { key: "abv", label: "ABV" },
  { key: "packaged", label: "Packaged", type: "date" },
  { key: "contents", label: "Net contents" },
  { key: "address", label: "Manufactured at" },
]

export default function App() {
  const [fields, setFields] = useState<Fields>(() => ({
    ...DEFAULTS,
    ...loadPersisted(),
  }))

  useEffect(() => {
    const data: Record<string, string> = {}
    for (const k of PERSIST_KEYS) data[k] = fields[k]
    localStorage.setItem(STORE, JSON.stringify(data))
  }, [fields])

  const update =
    (key: keyof Fields) => (e: ChangeEvent<HTMLInputElement>) =>
      setFields((prev) => ({ ...prev, [key]: e.target.value }))

  const setField = (key: keyof Fields, value: string) =>
    setFields((prev) => ({ ...prev, [key]: value }))

  return (
    <main className="min-h-screen bg-muted/40 px-6 py-10">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-8 md:flex-row">
        <div className="form-panel w-full md:w-80">
          <Card>
            <CardHeader>
              <CardTitle>Create a Keg label</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-1.5">
                <Label>Load from lolev.beer</Label>
                <BeerSelect
                  onSelect={(b) => setFields((prev) => ({ ...prev, ...b }))}
                />
              </div>
              {FORM_FIELDS.map(({ key, label, type }) => (
                <div key={key} className="grid gap-1.5">
                  <Label htmlFor={key}>{label}</Label>
                  {type === "date" ? (
                    <DatePicker
                      id={key}
                      value={fields[key]}
                      onChange={(v) => setField(key, v)}
                    />
                  ) : (
                    <Input
                      id={key}
                      value={fields[key]}
                      onChange={update(key)}
                      className={key === "beer" ? "capitalize" : undefined}
                    />
                  )}
                </div>
              ))}
              <Button className="mt-2" onClick={() => window.print()}>
                <Printer />
                Print label
              </Button>
              <p className="text-muted-foreground text-xs leading-relaxed">
                First time: in the print dialog pick your Rollo, set Margins =
                None, Scale = 100%, paper = 3×2. Then it's one click.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="flex w-full justify-center md:w-auto">
          <LabelPreview brewery={BREWERY} {...fields} />
        </div>
      </div>
    </main>
  )
}
