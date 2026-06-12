"use client"

import { useState, FormEvent, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Spinner } from "@/components/ui/spinner"

/**
 * Name entry page — avatar is chosen in the play lobby while waiting for the host.
 */
export default function JoinNamePage() {
  const router = useRouter()
  const params = useParams<{ joinCode: string }>()
  const joinCode = params.joinCode?.toUpperCase() ?? ""

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [eventTitle, setEventTitle] = useState<string>("")
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookupLoading, setLookupLoading] = useState(true)

  const [displayName, setDisplayName] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!joinCode) {
      setLookupError("Invalid join code.")
      setLookupLoading(false)
      return
    }

    fetch(`/api/quiz/v1/sessions/by-join-code?code=${encodeURIComponent(joinCode)}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          if (res.status === 404) {
            setLookupError(
              "No active session found for this code. The session may have already started or ended."
            )
          } else {
            setLookupError(data?.error?.message ?? "Failed to look up session.")
          }
          return
        }
        const data = await res.json()
        setSessionId(data.sessionId)
        setEventTitle(data.eventTitle ?? "")
      })
      .catch(() => {
        setLookupError("Network error. Please check your connection and try again.")
      })
      .finally(() => {
        setLookupLoading(false)
      })
  }, [joinCode])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!sessionId) return

    const trimmedName = displayName.trim()
    if (trimmedName.length < 1 || trimmedName.length > 30) {
      setSubmitError("Display name must be between 1 and 30 characters.")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/quiz/v1/sessions/${sessionId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joinCode,
          displayName: trimmedName,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const code = data?.error?.code
        let msg: string
        if (code === "DISPLAY_NAME_TAKEN") {
          msg = "This name is already taken. Please choose a different name."
        } else if (code === "SESSION_ALREADY_STARTED") {
          msg = "This session has already started. You can no longer join."
        } else if (code === "SESSION_AT_CAPACITY") {
          msg = "This session is full (150 participants maximum)."
        } else if (code === "JOIN_CODE_NOT_FOUND") {
          msg = "Invalid join code. Please go back and try again."
        } else {
          msg = data?.error?.message ?? "Failed to join. Please try again."
        }
        setSubmitError(msg)
        toast.error(msg)
        return
      }

      sessionStorage.setItem("quiz_participant_token", data.participantToken)
      sessionStorage.setItem("quiz_session_id", sessionId)
      sessionStorage.setItem("quiz_display_name", data.displayName)
      sessionStorage.setItem("quiz_avatar", data.avatar)
      if (data.participantId) {
        sessionStorage.setItem("quiz_participant_id", data.participantId)
      }

      toast.success(`Joined as ${data.displayName}`)
      router.push(`/quiz/play/${sessionId}`)
    } catch {
      const msg = "Network error. Please check your connection and try again."
      setSubmitError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (lookupLoading) {
    return <LoadingScreen label="Looking up session…" />
  }

  if (lookupError) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="text-5xl" aria-hidden="true">😕</div>
          <div>
            <h1 className="text-xl font-bold">Session Not Found</h1>
            <p className="mt-2 text-muted-foreground text-sm">{lookupError}</p>
          </div>
          <Link
            href="/quiz/join"
            className="inline-block rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition"
          >
            Try a different code
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] flex items-start sm:items-center justify-center bg-background px-3 sm:px-4 py-6 sm:py-8">
      <div className="w-full max-w-md space-y-6 sm:space-y-8">
        <div className="text-center">
          <div className="text-3xl sm:text-4xl mb-2" aria-hidden="true">🦉</div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight break-words">
            {eventTitle || "Join Session"}
          </h1>
          <p className="mt-1 text-muted-foreground text-sm">
            Code: <span className="font-mono font-bold">{joinCode}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6" noValidate>
          <div className="space-y-2">
            <label
              htmlFor="display-name"
              className="block text-sm font-medium text-foreground"
            >
              Your Name
            </label>
            <input
              id="display-name"
              type="text"
              autoComplete="nickname"
              maxLength={30}
              value={displayName}
              onChange={(e) => {
                setSubmitError(null)
                setDisplayName(e.target.value)
              }}
              placeholder="Enter your name"
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition"
              aria-describedby={submitError ? "submit-error" : undefined}
              disabled={submitting}
            />
            <p className="text-xs text-muted-foreground">
              1–30 characters. Letters, digits, spaces, hyphens, and underscores only.
            </p>
          </div>

          {submitError && (
            <p id="submit-error" role="alert" className="text-sm text-destructive">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !displayName.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? (
              <>
                <Spinner size="sm" className="text-primary-foreground" />
                Joining…
              </>
            ) : (
              "Join Session"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
