import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { PresetGallery } from "@/components/preset-gallery"

export default function Page() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-md bg-foreground text-background">
            <span className="text-xs font-bold">C</span>
          </div>
          <span className="font-mono text-sm font-semibold tracking-tight">city48</span>
        </div>
        <Link
          href="/editor"
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-wide text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        >
          Blank editor
          <ArrowRight className="size-3.5" />
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-10 pt-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Shader presets</p>
        <h1 className="mt-3 max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Pick a look. Start creating.
        </h1>
        <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted-foreground">
          Choose a preset to open the editor pre-loaded with a stack of tuned shader effects. Swap in your own image or
          video and fine-tune every parameter.
        </p>
      </section>

      {/* Preset grid */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <PresetGallery />
      </section>
    </main>
  )
}
