"use client"

import { useEffect, useMemo, useState, FormEvent } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Check, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { QuizImageUpload } from "@/features/quiz/components/quiz-image-upload"
import {
  BUILT_IN_THEMES,
  GRADIENT_PRESETS,
  buildThemeStyle,
  getThemeById,
  resolveGradient,
  resolvePrimaryHex,
  type CustomTheme,
} from "@/features/quiz/lib/themes"

interface EventData {
  id: string
  title: string
  description: string | null
  theme_id: string | null
  custom_theme: CustomTheme | null
  logo_url: string | null
}

/**
 * Event edit page — theme & branding settings.
 *
 * Admins can:
 *   - Pick a built-in colour theme
 *   - Override the primary colour with a custom hex
 *   - Pick a gradient preset (used for headers, hero areas, and event cards)
 *
 * The selected theme is previewed live within the form using
 * {@link buildThemeStyle}, which sets `--primary`, `--primary-foreground`,
 * `--ring`, and `--event-gradient` CSS variables on the wrapping element.
 *
 * Requirements: 15.1–15.6
 */
export default function EventEditPage() {
  const params = useParams<{ eventId: string }>()
  const { eventId } = params
  const router = useRouter()

  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedThemeId, setSelectedThemeId] = useState<string>("violet")
  const [customPrimary, setCustomPrimary] = useState("")
  const [selectedGradient, setSelectedGradient] = useState<string>("")
  const [logoUrl, setLogoUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/quiz/v1/events/${eventId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load event")
        const data = await res.json()
        const ev: EventData = data.event
        setEvent(ev)
        setTitle(ev.title ?? "")
        setDescription(ev.description ?? "")
        setSelectedThemeId(ev.theme_id ?? "violet")
        setCustomPrimary(ev.custom_theme?.primaryColor ?? "")
        setSelectedGradient(ev.custom_theme?.gradient ?? "")
        setLogoUrl(ev.logo_url ?? null)
      })
      .catch(() => toast.error("Failed to load event."))
      .finally(() => setLoading(false))
  }, [eventId])

  // Build the CustomTheme that will be sent on save (and used for the live preview).
  const customTheme = useMemo<CustomTheme | null>(() => {
    const ct: CustomTheme = {}
    if (customPrimary) ct.primaryColor = customPrimary
    if (selectedGradient) ct.gradient = selectedGradient
    return Object.keys(ct).length > 0 ? ct : null
  }, [customPrimary, selectedGradient])

  const previewStyle = useMemo(
    () => buildThemeStyle({ themeId: selectedThemeId, customTheme }),
    [selectedThemeId, customTheme]
  )

  const effectivePrimary = resolvePrimaryHex({ themeId: selectedThemeId, customTheme })
  const effectiveGradient = resolveGradient({ themeId: selectedThemeId, customTheme })

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      toast.error("Event name is required.")
      return
    }
    if (trimmedTitle.length > 100) {
      toast.error("Event name must be 100 characters or fewer.")
      return
    }
    if (description.length > 500) {
      toast.error("Description must be 500 characters or fewer.")
      return
    }

    setSaving(true)

    try {
      const body: Record<string, unknown> = {
        title: trimmedTitle,
        description: description.trim() || null,
        theme_id: selectedThemeId,
        custom_theme: customTheme,
        logo_url: logoUrl,
      }

      const res = await fetch(`/api/quiz/v1/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data?.error?.message ?? "Failed to save changes.")
        return
      }

      toast.success("Changes saved", {
        description: "Your event has been updated.",
      })
      // Return the user to the event page they came from, then refresh so the
      // server-rendered event page (and dashboard) re-fetch and show the newly
      // saved title, description, and theme instead of stale cached data.
      router.push(`/quiz/events/${eventId}`)
      router.refresh()
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <LoadingScreen variant="section" label="Loading event…" />
  }

  return (
    <div style={previewStyle} className="container mx-auto mt-8 mb-32 max-w-6xl space-y-6 px-6">
      <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push(`/quiz/events/${eventId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="font-serif text-2xl font-bold">Edit Event</h1>
          <p className="text-sm text-muted-foreground">{event?.title}</p>
        </div>
      </div>

      {/* Live preview */}
      <Card className="overflow-hidden">
        <div
          className="px-6 py-8 text-white"
          style={{ background: effectiveGradient }}
        >
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider opacity-90 mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Live Preview
          </div>
          <h2 className="text-2xl font-bold drop-shadow-sm">{title || event?.title}</h2>
          <p className="text-sm opacity-90 mt-1">
            This is how your event header and cards will appear.
          </p>
        </div>
        <CardContent className="pt-6 flex flex-wrap items-center gap-3">
          <Button>Primary Action</Button>
          <Button variant="outline">Secondary</Button>
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white"
            style={{ background: effectiveGradient }}
          >
            Live Badge
          </span>
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Event details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Details</CardTitle>
            <p className="text-xs text-muted-foreground">
              Update the event name and description shown to participants and on
              your dashboard.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="event-title">
                Event name{" "}
                <span aria-hidden="true" className="text-destructive">*</span>
              </Label>
              <Input
                id="event-title"
                type="text"
                placeholder="e.g. Team Trivia Night"
                maxLength={100}
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <p className="text-xs text-muted-foreground text-right">
                {title.length}/100
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="event-description">Description (optional)</Label>
              <textarea
                id="event-description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                placeholder="A short description of your event…"
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <p className="text-xs text-muted-foreground text-right">
                {description.length}/500
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Logo</CardTitle>
            <p className="text-xs text-muted-foreground">
              Optional logo shown on the presenter screen and join page.
            </p>
          </CardHeader>
          <CardContent>
            <QuizImageUpload
              value={logoUrl}
              onChange={setLogoUrl}
              label="Logo"
              description="Square or landscape image, up to 4 MB."
            />
          </CardContent>
        </Card>

        {/* Theme picker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Colour Theme</CardTitle>
            <p className="text-xs text-muted-foreground">
              Pick a base colour theme. Primary buttons, links and accents will
              use this colour throughout the event.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BUILT_IN_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => {
                    setSelectedThemeId(theme.id)
                    // Reset overrides so the chosen theme's defaults are used.
                    setCustomPrimary("")
                    setSelectedGradient("")
                  }}
                  className={`relative rounded-xl border-2 p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-ring overflow-hidden ${
                    selectedThemeId === theme.id
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-muted-foreground"
                  }`}
                  aria-pressed={selectedThemeId === theme.id}
                  aria-label={`Select ${theme.name} theme`}
                >
                  <div
                    className="h-12 w-full rounded-md mb-2 shadow-inner"
                    style={{ background: theme.gradient }}
                    aria-hidden="true"
                  />
                  <p className="text-xs font-semibold truncate">{theme.name}</p>
                  {selectedThemeId === theme.id && (
                    <Check className="absolute top-2 right-2 h-4 w-4 text-white drop-shadow" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom primary colour */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Primary Colour</CardTitle>
            <p className="text-xs text-muted-foreground">
              Optionally override the theme&apos;s primary colour. Affects buttons,
              links, and focus rings.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="custom-primary">Custom primary colour</Label>
              <div className="flex items-center gap-3">
                <input
                  id="custom-primary"
                  type="color"
                  value={customPrimary || (getThemeById(selectedThemeId)?.primaryColor ?? "#7c3aed")}
                  onChange={(e) => setCustomPrimary(e.target.value)}
                  className="h-10 w-16 rounded border border-input cursor-pointer"
                  aria-label="Custom primary colour"
                />
                <span className="text-sm text-muted-foreground font-mono">
                  {effectivePrimary}
                </span>
                {customPrimary && (
                  <button
                    type="button"
                    onClick={() => setCustomPrimary("")}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Reset to theme default
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gradient picker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gradient</CardTitle>
            <p className="text-xs text-muted-foreground">
              Choose a gradient for event headers, hero sections, and dashboard
              cards. Each theme comes with a default gradient — pick one below
              to override it.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Theme default gradient option */}
              <button
                type="button"
                onClick={() => setSelectedGradient("")}
                className={`relative rounded-xl border-2 p-2 text-left transition focus:outline-none focus:ring-2 focus:ring-ring ${
                  !selectedGradient
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-border hover:border-muted-foreground"
                }`}
                aria-pressed={!selectedGradient}
                aria-label="Use theme default gradient"
              >
                <div
                  className="h-14 w-full rounded-md shadow-inner"
                  style={{ background: getThemeById(selectedThemeId)?.gradient }}
                  aria-hidden="true"
                />
                <p className="text-xs font-medium mt-2 truncate">Theme default</p>
                {!selectedGradient && (
                  <Check className="absolute top-3 right-3 h-4 w-4 text-white drop-shadow" aria-hidden="true" />
                )}
              </button>
              {GRADIENT_PRESETS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedGradient(g.value)}
                  className={`relative rounded-xl border-2 p-2 text-left transition focus:outline-none focus:ring-2 focus:ring-ring ${
                    selectedGradient === g.value
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border hover:border-muted-foreground"
                  }`}
                  aria-pressed={selectedGradient === g.value}
                  aria-label={`Select ${g.name} gradient`}
                >
                  <div
                    className="h-14 w-full rounded-md shadow-inner"
                    style={{ background: g.value }}
                    aria-hidden="true"
                  />
                  <p className="text-xs font-medium mt-2 truncate">{g.name}</p>
                  {selectedGradient === g.value && (
                    <Check className="absolute top-3 right-3 h-4 w-4 text-white drop-shadow" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/quiz/events/${eventId}`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Spinner size="sm" className="text-primary-foreground" />
                Saving…
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </form>
      </div>
    </div>
  )
}
