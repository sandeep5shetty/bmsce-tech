"use client";

import { useEffect, useState } from "react";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { GripVertical, Loader2, RotateCcw, Shuffle, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Student } from "@/types";

/* ── Draggable student chip ─────────────────────────────────────── */
function DraggableStudent({
  student,
  index,
  variant = "chip",
}: {
  student: Student;
  index?: number;
  variant?: "chip" | "card";
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: student.id });

  const style = transform
    ? { transform: `translate3d(${transform.x}px,${transform.y}px,0)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;

  if (variant === "card") {
    return (
      <Card
        ref={setNodeRef}
        style={style}
        className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 dark:border-blue-800 dark:from-blue-950/20 dark:to-purple-950/20 cursor-grab active:cursor-grabbing"
      >
        <CardContent className="flex items-center gap-3 px-4 py-3">
          <div {...listeners} {...attributes} className="shrink-0 cursor-grab">
            <GripVertical className="text-muted-foreground h-4 w-4" />
          </div>
          {index !== undefined && (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {index + 1}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{student.name}</p>
            <p className="text-muted-foreground truncate text-xs">{student.usn}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-muted flex cursor-grab items-center gap-2 rounded-lg border px-3 py-2 active:cursor-grabbing"
    >
      <div {...listeners} {...attributes}>
        <GripVertical className="text-muted-foreground h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{student.name}</p>
        <p className="text-muted-foreground truncate text-xs">{student.usn}</p>
      </div>
    </div>
  );
}

/* ── Droppable zone ──────────────────────────────────────────────── */
function DroppableZone({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`h-full rounded-lg transition-colors ${isOver ? "bg-blue-50 ring-2 ring-blue-400 dark:bg-blue-950/20 dark:ring-blue-600" : ""}`}
    >
      {children}
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────── */
export default function RandomPickerPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pickedStudents, setPickedStudents] = useState<Student[]>([]);
  const [alreadyPicked, setAlreadyPicked] = useState<Set<string>>(new Set());
  const [numberOfPicks, setNumberOfPicks] = useState<number | "">(1);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  /* ── Load students + restore from localStorage ── */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/students");
        if (!res.ok) throw new Error();
        const all: Student[] = await res.json();
        const sectionB = all.filter((s) => s.section === "B");
        setStudents(sectionB);

        const saved = localStorage.getItem("rp_picked");
        if (saved) {
          const ids: string[] = JSON.parse(saved);
          setAlreadyPicked(new Set(ids));
          setPickedStudents(sectionB.filter((s) => ids.includes(s.id)));
        }
      } catch {
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ── Persist alreadyPicked ── */
  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem("rp_picked", JSON.stringify([...alreadyPicked]));
    }
  }, [alreadyPicked, students.length]);

  function secureRandom(max: number) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  }

  function pickRandom(addToCurrent = false) {
    const n = Number(numberOfPicks);
    if (!n || n < 1) { toast.error("Enter a valid number (min 1)"); return; }

    const available = students.filter((s) => !alreadyPicked.has(s.id));
    if (available.length === 0) { toast.error("All students picked. Reset to continue."); return; }

    const actual = Math.min(n, available.length);
    if (actual < n) toast.warning(`Only ${actual} student(s) available`);

    setPicking(true);
    setTimeout(() => {
      const picked: Student[] = [];
      const newPicked = new Set(alreadyPicked);
      const pool = [...available];

      for (let i = 0; i < actual; i++) {
        const remaining = pool.filter((s) => !picked.includes(s));
        const idx = secureRandom(remaining.length);
        picked.push(remaining[idx]);
        newPicked.add(remaining[idx].id);
      }

      setPickedStudents(addToCurrent ? [...pickedStudents, ...picked] : picked);
      setAlreadyPicked(newPicked);
      toast.success(`Picked ${picked.length} student(s)!`);
      setPicking(false);
    }, 400);
  }

  function reset() {
    setPickedStudents([]);
    setAlreadyPicked(new Set());
    localStorage.removeItem("rp_picked");
    toast.success("Picker reset");
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const sid = active.id as string;
    const zone = over.id as string;
    const s = students.find((s) => s.id === sid);
    if (!s) return;

    const isPicked = alreadyPicked.has(sid);

    if ((zone === "picked-zone" || zone === "picked-sidebar") && !isPicked) {
      setPickedStudents([...pickedStudents, s]);
      setAlreadyPicked(new Set(alreadyPicked).add(sid));
      toast.success(`${s.name} added`);
    } else if (zone === "available-zone" && isPicked) {
      setPickedStudents(pickedStudents.filter((x) => x.id !== sid));
      const np = new Set(alreadyPicked);
      np.delete(sid);
      setAlreadyPicked(np);
      toast.success(`${s.name} removed`);
    }
  }

  const availableCount = students.length - alreadyPicked.size;
  const activeStudent = students.find((s) => s.id === activeId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground text-sm">Loading students…</p>
        </div>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="container mx-auto mt-8 mb-32 max-w-6xl px-6">
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="font-medium">No students found in database.</p>
          <p className="text-muted-foreground mt-2 text-sm">
            Seed the student database first:{" "}
            <code className="bg-muted rounded px-1">POST /api/seed-students</code>
          </p>
          <Button
            className="mt-4"
            onClick={async () => {
              const res = await fetch("/api/seed-students", { method: "POST" });
              const d = await res.json();
              if (res.ok) {
                toast.success(d.message);
                window.location.reload();
              } else {
                toast.error(d.error ?? "Seed failed");
              }
            }}
          >
            Seed Students Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <div className="container mx-auto mt-8 mb-32 max-w-6xl px-6">
        <div className="mb-6">
          <h1 className="font-serif text-3xl font-semibold">Random Student Picker</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            MCA 1st yr Sec B — {students.length} students total
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main picker card */}
          <Card className="shadow-md lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Pick Random Students
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Controls */}
              <div className="flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="count">Number to pick</Label>
                  <Input
                    id="count"
                    type="number"
                    min={1}
                    max={availableCount}
                    value={numberOfPicks}
                    onChange={(e) =>
                      setNumberOfPicks(e.target.value ? parseInt(e.target.value) : "")
                    }
                    className="w-36"
                    placeholder="e.g. 3"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => pickRandom(false)}
                    disabled={picking || availableCount === 0}
                  >
                    {picking ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Shuffle className="mr-2 h-4 w-4" />
                    )}
                    Pick Random
                  </Button>
                  {pickedStudents.length > 0 && (
                    <Button
                      variant="secondary"
                      onClick={() => pickRandom(true)}
                      disabled={picking || availableCount === 0}
                    >
                      <Shuffle className="mr-2 h-4 w-4" />
                      Pick More
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={reset}
                    disabled={alreadyPicked.size === 0}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>

              {/* Current picks */}
              {pickedStudents.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      Picked Students ({pickedStudents.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPickedStudents([])}
                    >
                      <X className="mr-1 h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                  <DroppableZone id="picked-zone">
                    <div className="grid min-h-[80px] gap-3 rounded-lg p-1">
                      {pickedStudents.map((s, i) => (
                        <DraggableStudent key={s.id} student={s} index={i} variant="card" />
                      ))}
                    </div>
                  </DroppableZone>
                </div>
              )}

              {/* Already picked history */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    Already Picked ({alreadyPicked.size})
                  </CardTitle>
                  <p className="text-muted-foreground text-xs">
                    Drag students here to mark as picked, or drag away to restore.
                  </p>
                </CardHeader>
                <CardContent>
                  <DroppableZone id="picked-sidebar">
                    {alreadyPicked.size === 0 ? (
                      <p className="text-muted-foreground py-8 text-center text-sm">
                        No students picked yet.
                      </p>
                    ) : (
                      <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                        {students
                          .filter((s) => alreadyPicked.has(s.id))
                          .map((s) => (
                            <DraggableStudent key={s.id} student={s} variant="chip" />
                          ))}
                      </div>
                    )}
                  </DroppableZone>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          {/* Available students sidebar */}
          <Card className="flex max-h-[calc(100vh-8rem)] flex-col shadow-md lg:sticky lg:top-4">
            <CardHeader className="shrink-0 pb-2">
              <CardTitle className="text-base">
                Available ({availableCount})
              </CardTitle>
              <p className="text-muted-foreground text-xs">
                Drag here to remove from picked list.
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
              <DroppableZone id="available-zone">
                {availableCount === 0 ? (
                  <p className="text-muted-foreground py-12 text-center text-sm">
                    All students have been picked!
                  </p>
                ) : (
                  <div className="h-full space-y-2 overflow-y-auto p-4">
                    {students
                      .filter((s) => !alreadyPicked.has(s.id))
                      .map((s) => (
                        <DraggableStudent key={s.id} student={s} variant="chip" />
                      ))}
                  </div>
                )}
              </DroppableZone>
            </CardContent>
          </Card>
        </div>
      </div>

      <DragOverlay>
        {activeStudent ? (
          <div className="rounded-lg border-2 border-blue-400 bg-white p-3 shadow-lg dark:bg-slate-800">
            <p className="text-sm font-medium">{activeStudent.name}</p>
            <p className="text-muted-foreground text-xs">{activeStudent.usn}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
