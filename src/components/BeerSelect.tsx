import { useEffect, useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Fields we can pull from the lolev.beer API. Net contents / packaged date are
// not in the API, so they are left untouched when a beer is chosen.
export type BeerInfo = { beer: string; style: string; abv: string }

type ApiBeer = {
  name: string
  abv: number
  slug: string
  hideFromSite?: boolean
  style?: { name?: string }
}

export function BeerSelect({ onSelect }: { onSelect: (b: BeerInfo) => void }) {
  const [beers, setBeers] = useState<ApiBeer[]>([])
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState("")

  useEffect(() => {
    // Same-origin path; Vite proxies it to https://lolev.beer/api (see vite.config).
    fetch("/lolev-api/beers?limit=500")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: { docs?: ApiBeer[] }) =>
        setBeers((j.docs ?? []).filter((b) => b?.name && !b.hideFromSite)),
      )
      .catch(() => setError(true))
  }, [])

  if (error) {
    return (
      <p className="text-muted-foreground text-xs">
        Couldn't reach lolev.beer — enter the fields manually.
      </p>
    )
  }

  const current = beers.find((b) => b.slug === selected)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {current
            ? current.name
            : beers.length
              ? "Pick a beer…"
              : "Loading beers…"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="Search beers…" />
          <CommandList>
            <CommandEmpty>No beer found.</CommandEmpty>
            <CommandGroup>
              {beers.map((b) => (
                <CommandItem
                  key={b.slug}
                  value={b.name}
                  onSelect={() => {
                    setSelected(b.slug)
                    setOpen(false)
                    onSelect({
                      beer: b.name,
                      style: b.style?.name ?? "",
                      abv: `${b.abv}%`,
                    })
                  }}
                >
                  {b.name}
                  <Check
                    className={cn(
                      "ml-auto",
                      selected === b.slug ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
