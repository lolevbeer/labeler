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

// True title case: capitalize the first letter of each word, lowercasing the
// rest, so ALL-CAPS input ("JAGUAR") becomes "Jaguar". Words that are valid
// Roman numerals (e.g. a volume "III") stay fully uppercase instead of "Iii".
// The strict pattern avoids matching ordinary words made of I/V/X/L/C/D/M.
const ROMAN = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/i

function titleCase(s: string): string {
  return s.replace(/\p{L}+/gu, (w) =>
    w.length > 1 && ROMAN.test(w)
      ? w.toUpperCase()
      : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
  )
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
