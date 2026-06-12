"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

/**
 * Join code entry page.
 *
 * Accepts a 6-character join code, looks up the session via
 * GET /api/quiz/v1/sessions/by-join-code?code=XXXXXX, and redirects
 * to /quiz/join/[joinCode] for name entry.
 *
 * Requirements: 5.1, 5.2, 5.5, 5.8
 */
export default function JoinPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const trimmed = code.trim().toUpperCase()
    if (trimmed.length !== 6) {
      setError("Please enter a 6-character join code.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(
        `/api/quiz/v1/sessions/by-join-code?code=${encodeURIComponent(trimmed)}`
      )

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        let msg: string
        if (res.status === 404) {
          msg = "No active session found for this code. Check the code and try again."
        } else {
          msg = data?.error?.message ?? "Something went wrong. Please try again."
        }
        setError(msg)
        toast.error(msg)
        return
      }

      // Redirect to the name/avatar selection page
      router.push(`/quiz/join/${trimmed}`)
    } catch {
      const msg = "Network error. Please check your connection and try again."
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-6 sm:space-y-8">
        {/* Brand */}
        <div className="text-center">
          <div className="text-4xl sm:text-5xl mb-2 sm:mb-3" aria-hidden="true">📋</div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">Join Quiz</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Enter the join code shown on the presenter&apos;s screen
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-2">
            <label
              htmlFor="join-code"
              className="block text-sm font-medium text-foreground"
            >
              Join Code
            </label>
            <input
              id="join-code"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              maxLength={6}
              value={code}
              onChange={(e) => {
                setError(null)
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }}
              placeholder="e.g. ABC123"
              className="w-full rounded-md border border-input bg-background px-3 py-3 text-center text-xl sm:text-2xl font-mono font-bold tracking-[0.25em] sm:tracking-widest uppercase placeholder:text-muted-foreground/50 placeholder:text-base placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              aria-describedby={error ? "join-code-error" : undefined}
              aria-invalid={error ? "true" : undefined}
              disabled={loading}
            />
            {error && (
              <p
                id="join-code-error"
                role="alert"
                className="text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || code.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? (
              <>
                <Spinner size="sm" className="text-primary-foreground" />
                Looking up…
              </>
            ) : (
              "Join"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
