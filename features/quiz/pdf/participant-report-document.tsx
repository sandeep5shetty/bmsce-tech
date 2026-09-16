import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import type { ParticipantDeterministicReport } from "@/features/quiz/lib/participant-report-aggregate";
import type { ParticipantReportAiFeedback } from "@/features/quiz/lib/validation";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1.4,
  },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#444", marginBottom: 16 },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 14,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 4,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 },
  stat: { width: "22%" },
  statLabel: { fontSize: 8, color: "#666" },
  statValue: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  bullet: { marginLeft: 8, marginBottom: 3 },
  question: { marginBottom: 10 },
  questionHead: { fontFamily: "Helvetica-Bold", marginBottom: 2 },
  muted: { color: "#555", fontSize: 9 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#888",
    textAlign: "center",
  },
});

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function formatMs(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function outcomeLabel(outcome: string): string {
  switch (outcome) {
    case "correct":
      return "Correct";
    case "incorrect":
      return "Incorrect";
    case "skipped":
      return "Skipped";
    default:
      return "Unscored";
  }
}

export interface ParticipantReportPdfDocumentProps {
  report: ParticipantDeterministicReport;
  aiFeedback: ParticipantReportAiFeedback | null;
}

export function ParticipantReportPdfDocument({
  report,
  aiFeedback,
}: ParticipantReportPdfDocumentProps) {
  const rankLabel =
    report.rank != null
      ? `#${report.rank} of ${report.participantCount}`
      : "—";

  return (
    <Document title={`${report.eventTitle} — Quiz Report`}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Your quiz report</Text>
        <Text style={styles.subtitle}>
          {report.eventTitle} · {report.displayName}
        </Text>

        <View style={styles.row}>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Score</Text>
            <Text style={styles.statValue}>
              {report.totalScore.toLocaleString()}
            </Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Rank</Text>
            <Text style={styles.statValue}>{rankLabel}</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Percentile</Text>
            <Text style={styles.statValue}>{report.percentile}%</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={styles.statValue}>
              {report.accuracyPercent != null
                ? `${report.accuracyPercent}%`
                : "—"}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Strengths</Text>
        {report.strengths.map((s) => (
          <Text key={s} style={styles.bullet}>
            • {s}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>Focus areas</Text>
        {report.improvements.map((s) => (
          <Text key={s} style={styles.bullet}>
            • {s}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>Pace</Text>
        <Text style={styles.muted}>
          Your average: {formatMs(report.avgResponseTimeMs)} · Session average:{" "}
          {formatMs(report.cohortAvgResponseTimeMs)} ({report.responseTimeVsCohort})
        </Text>

        {aiFeedback && (
          <>
            <Text style={styles.sectionTitle}>Coach notes</Text>
            <Text style={{ marginBottom: 6 }}>{aiFeedback.summary}</Text>
            {aiFeedback.prioritized_actions.map((a) => (
              <Text key={a} style={styles.bullet}>
                → {a}
              </Text>
            ))}
          </>
        )}

        <Text style={styles.footer}>Generated for your eyes only · Quiz report</Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.sectionTitle}>Question review</Text>
        {report.questionReview.map((q) => (
          <View key={q.questionId} style={styles.question}>
            <Text style={styles.questionHead}>
              Q{q.position}. {truncate(q.text, 200)} — {outcomeLabel(q.outcome)}
            </Text>
            {q.yourAnswerLabel ? (
              <Text style={styles.muted}>Your answer: {q.yourAnswerLabel}</Text>
            ) : null}
            {q.outcome === "incorrect" && q.correctAnswerLabel ? (
              <Text style={styles.muted}>Correct: {q.correctAnswerLabel}</Text>
            ) : null}
            <Text style={styles.muted}>
              +{q.scoreAwarded} pts · {formatMs(q.responseTimeMs)}
            </Text>
          </View>
        ))}
      </Page>
    </Document>
  );
}
