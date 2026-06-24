import { Logo } from "@/components/Logo"

// The physical 3in x 2in keg label. Styled by plain CSS in index.css (.label*)
// so the print output is dimensionally exact; this is the only element printed.
export type LabelFields = {
  brewery: string
  beer: string
  style: string
  abv: string
  packaged: string
  contents: string
  address: string
}

// Always render the ABV with exactly one trailing "%", regardless of whether
// the user typed it (e.g. "8.5" and "8.5%" both render as "8.5%").
function withPercent(abv: string): string {
  const v = abv.replace(/%/g, "").trim()
  return v ? `${v}%` : ""
}

// True title case: lowercase everything, then capitalize the first letter of
// each word. Unlike CSS `text-transform: capitalize`, this fixes ALL-CAPS input
// ("JAGUAR" -> "Jaguar"). Note: acronyms like "IPA" become "Ipa".
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/(^|[^\p{L}])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase())
}

export function LabelPreview({
  brewery,
  beer,
  style,
  abv,
  packaged,
  contents,
  address,
}: LabelFields) {
  return (
    <div className="label">
      <div className="brewery">
        <Logo className="logo" />
        <span>{brewery}</span>
      </div>
      <div className="hero">
        <div className="beer">{titleCase(beer)}</div>
        <div className="style">{style}</div>
      </div>
      <div className="foot">
        <div className="meta">
          <b>{withPercent(abv)}</b> Alc By Vol{"  •  "}Packaged{" "}
          <b>{packaged}</b>
        </div>
        <div className="net-contents">
          Net Contents <b>{contents}</b>
        </div>
        <div className="addr">
          Manufactured at <span>{address}</span>
        </div>
      </div>
    </div>
  )
}
