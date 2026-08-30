"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Download, ArrowLeft, Users, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { Spinner } from "@/components/ui/spinner"
import { ConfirmActionDialog } from "@/features/quiz/components/confirm-action-dialog"
import {
  SessionAnalytics,
  type AnalyticsAnswer,
  type AnalyticsParticipant,
  type AnalyticsSnapshot,
} from "@/features/quiz/components/session-analytics"

interface AnalyticsData {
  sessionId: string
  participantCount: number
  participants?: AnalyticsParticipant[]
  answers?: AnalyticsAnswer[]
  snapshots: AnalyticsSnapshot[]
}

/**
 * Analytics summary page for a completed session.
 *
 * Overview charts (accuracy per question, answer outcomes), a leaderboard
 * table, and a per-question breakdown that names who picked each option —
 * plus CSV export and session delete.
 */
export default function AnalyticsPage() {
  const params = useParams<{ eventId: string; sessionId: string }>()
  const { eventId, sessionId } = params
  const router = useRouter()

  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/quiz/v1/analytics/${sessionId}`)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          setError(body?.error?.message ?? "Failed to load analytics.")
          return
        }
        const body = await res.json()
        setData(body)
      })
      .catch(() => setError("Network error. Please try again."))
      .finally(() => setLoading(false))
  }, [sessionId])

  const handleDownloadCsv = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/quiz/v1/analytics/${sessionId}/export`)
      if (!res.ok) throw new Error("Export failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `session-${sessionId}-results.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("CSV downloaded")
    } catch {
      toast.error("Failed to download CSV. Please try again.")
    } finally {
      setDownloading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/quiz/v1/analytics/${sessionId}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        toast.error(body?.error?.message ?? "Failed to delete session.")
        return
      }
      toast.success("Session deleted")
      setDeleteConfirmOpen(false)
      router.push(`/quiz/events/${eventId}`)
    } catch {
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <LoadingScreen variant="section" label="Loading analytics…" emoji="📊" />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-destructive text-sm">{error}</p>
        <Button variant="outline" onClick={() => router.push(`/quiz/events/${eventId}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Event
        </Button>
      </div>
    )
  }

  const snapshots = data?.snapshots ?? []

  return (
    <>
      <ConfirmActionDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete session?"
        description="This will permanently delete the session and all of its analytics. This action cannot be undone."
        confirmLabel="Delete Session"
        onConfirm={handleDelete}
        loading={deleting}
        destructive
      />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push(`/quiz/events/${eventId}/analytics`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Session Analytics</h1>
              <p className="text-sm text-muted-foreground">
                <Users className="inline h-3.5 w-3.5 mr-1" />
                {data?.participantCount ?? 0} participants
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleDownloadCsv} disabled={downloading} variant="outline">
              {downloading ? (
                <>
                  <Spinner size="sm" />
                  Downloading…
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </>
              )}
            </Button>
            <Button onClick={() => setDeleteConfirmOpen(true)} disabled={deleting} variant="destructive">
              {deleting ? (
                <>
                  <Spinner size="sm" className="text-destructive-foreground" />
                  Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </div>

        {snapshots.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground text-sm">
              No analytics data available yet. Analytics are generated when a session ends.
            </CardContent>
          </Card>
        ) : (
          <SessionAnalytics
            participants={data?.participants ?? []}
            answers={data?.answers ?? []}
            snapshots={snapshots}
          />
        )}
      </div>
    </>
  )
}
