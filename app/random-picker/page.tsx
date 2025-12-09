"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Student } from "@/lib/types";
import {
  X,
  Github,
  ArrowLeft,
  Shuffle,
  RotateCcw,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Footer } from "@/components/footer";
import { Spinner } from "@/components/ui/spinner";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";

export default function RandomPickerPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [pickedStudents, setPickedStudents] = useState<Student[]>([]);
  const [alreadyPicked, setAlreadyPicked] = useState<Set<string>>(new Set());
  const [numberOfPicks, setNumberOfPicks] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedPickedIds = localStorage.getItem("randomPicker_pickedStudents");
    if (savedPickedIds) {
      try {
        const ids = JSON.parse(savedPickedIds) as string[];
        setAlreadyPicked(new Set(ids));
      } catch (error) {
        console.error("Error loading saved picks:", error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/students?search=");
        if (response.ok) {
          const data = await response.json();
          // Filter only Section B students
          const sectionBStudents = data.filter(
            (s: Student) => s.section === "B"
          );
          setStudents(sectionBStudents);

          // Restore picked students from localStorage after students are loaded
          const savedPickedIds = localStorage.getItem(
            "randomPicker_pickedStudents"
          );
          if (savedPickedIds) {
            try {
              const ids = JSON.parse(savedPickedIds) as string[];
              const restoredStudents = sectionBStudents.filter((s: Student) =>
                ids.includes(s.id)
              );
              setPickedStudents(restoredStudents);
            } catch (error) {
              console.error("Error restoring picked students:", error);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching students:", error);
        toast.error("Failed to load students");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  // Save to localStorage whenever pickedStudents or alreadyPicked changes
  useEffect(() => {
    if (students.length > 0) {
      const pickedIds = Array.from(alreadyPicked);
      localStorage.setItem(
        "randomPicker_pickedStudents",
        JSON.stringify(pickedIds)
      );
    }
  }, [alreadyPicked, students]);

  // Crypto-strong random number generator
  const getSecureRandomInt = (max: number): number => {
    const randomBuffer = new Uint32Array(1);
    crypto.getRandomValues(randomBuffer);
    return randomBuffer[0] % max;
  };

  const pickRandomStudents = (addToCurrent = false) => {
    if (numberOfPicks < 1) {
      toast.error("Please enter a valid number (minimum 1)");
      return;
    }

    if (students.length === 0) {
      toast.error("No students available");
      return;
    }

    const availableStudents = students.filter((s) => !alreadyPicked.has(s.id));

    if (availableStudents.length === 0) {
      toast.error("All students have been picked. Please reset to continue.");
      return;
    }

    const actualPickCount = Math.min(numberOfPicks, availableStudents.length);

    if (actualPickCount < numberOfPicks) {
      toast.warning(`Only ${actualPickCount} student(s) available to pick`);
    }

    setPicking(true);

    // Simulate picking animation
    setTimeout(() => {
      const picked: Student[] = [];
      const newAlreadyPicked = new Set(alreadyPicked);

      for (let i = 0; i < actualPickCount; i++) {
        const remainingStudents = availableStudents.filter(
          (s) => !picked.includes(s)
        );
        const randomIndex = getSecureRandomInt(remainingStudents.length);
        const selectedStudent = remainingStudents[randomIndex];
        picked.push(selectedStudent);
        newAlreadyPicked.add(selectedStudent.id);
      }

      // Add to current list or replace
      if (addToCurrent) {
        setPickedStudents([...pickedStudents, ...picked]);
        toast.success(`Added ${picked.length} more student(s)!`);
      } else {
        setPickedStudents(picked);
        toast.success(`Picked ${picked.length} student(s)!`);
      }

      setAlreadyPicked(newAlreadyPicked);
      setPicking(false);
    }, 500);
  };

  const resetPicker = () => {
    setPickedStudents([]);
    setAlreadyPicked(new Set());
    localStorage.removeItem("randomPicker_pickedStudents");
    toast.success("Picker reset successfully");
  };

  const handleDragStart = (event: DragEndEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const draggedStudentId = active.id as string;
    const dropZone = over.id as string;

    const draggedStudent = students.find((s) => s.id === draggedStudentId);
    if (!draggedStudent) return;

    const isPicked = alreadyPicked.has(draggedStudentId);

    if (
      (dropZone === "picked-zone" || dropZone === "picked-zone-sidebar") &&
      !isPicked
    ) {
      // Move from not-picked to picked
      setPickedStudents([...pickedStudents, draggedStudent]);
      setAlreadyPicked(new Set(alreadyPicked).add(draggedStudentId));
      toast.success(`${draggedStudent.name} added to picked list`);
    } else if (dropZone === "available-zone" && isPicked) {
      // Move from picked to not-picked
      setPickedStudents(
        pickedStudents.filter((s) => s.id !== draggedStudentId)
      );
      const newAlreadyPicked = new Set(alreadyPicked);
      newAlreadyPicked.delete(draggedStudentId);
      setAlreadyPicked(newAlreadyPicked);
      toast.success(`${draggedStudent.name} removed from picked list`);
    }
  };

  const copyResults = () => {
    if (pickedStudents.length === 0) {
      toast.error("No students picked yet");
      return;
    }

    const resultText = pickedStudents
      .map((s, i) => `${i + 1}. ${s.name} (${s.usn})`)
      .join("\n");

    navigator.clipboard.writeText(resultText);
    setCopied(true);
    toast.success("Results copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const availableCount = students.length - alreadyPicked.size;

  // Draggable Student Component
  const DraggableStudent = ({
    student,
    index,
    isPicked,
  }: {
    student: Student;
    index?: number;
    isPicked: boolean;
  }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: student.id,
      });

    const style = transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          opacity: isDragging ? 0.5 : 1,
        }
      : undefined;

    if (isPicked && index !== undefined) {
      return (
        <Card
          ref={setNodeRef}
          style={style}
          className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800 cursor-grab active:cursor-grabbing"
        >
          <CardContent className="pt-3 pb-3 sm:pt-4 sm:pb-4 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-4">
              <div
                {...listeners}
                {...attributes}
                className="cursor-grab active:cursor-grabbing flex-shrink-0"
              >
                <GripVertical className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-600 text-white font-bold text-sm sm:text-lg flex-shrink-0">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-lg truncate">
                  {student.name}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {student.usn}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center gap-2">
          <div
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{student.name}</p>
            <p className="text-xs text-muted-foreground">{student.usn}</p>
          </div>
        </div>
      </div>
    );
  };

  // Droppable Zone Component
  const DroppableZone = ({
    id,
    children,
  }: {
    id: string;
    children: React.ReactNode;
  }) => {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
      <div
        ref={setNodeRef}
        className={`transition-colors h-full ${
          isOver
            ? "bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-400 dark:border-blue-600 rounded-lg"
            : ""
        }`}
      >
        {children}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Spinner size="lg" />
          <p className="text-sm text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col">
        <nav className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-2 flex flex-col sm:flex-row items-center justify-between gap-0 lg:gap-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.svg"
                alt="BMSCE.tech"
                width={100}
                height={100}
              />
            </Link>
            <a
              href="https://github.com/sandeep5shetty/bmsce-tech"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:block"
            >
              <Button variant="outline" size="sm" className="gap-2">
                <Github className="w-4 h-4" />
                View on GitHub
              </Button>
            </a>
          </div>
        </nav>

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 max-sm:py-3">
          <Link href="/" className="inline-block mb-4">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Picker Card */}
            <Card className="shadow-lg lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2 flex-wrap">
                  <Shuffle className="h-5 w-5 sm:h-6 sm:w-6" />
                  <span>Random Student Picker</span>
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  MCA 1st yr Sec B - {students.length} students total
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Controls */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-2 w-full sm:w-auto">
                      <Label htmlFor="count" className="text-sm">
                        Number of students to pick
                      </Label>
                      <Input
                        id="count"
                        type="number"
                        min="1"
                        max={availableCount}
                        value={numberOfPicks || ""}
                        onChange={(e) =>
                          setNumberOfPicks(parseInt(e.target.value) || 0)
                        }
                        className="text-base w-full"
                        placeholder="Enter no. of students"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <Button
                        onClick={() => pickRandomStudents(false)}
                        disabled={picking || availableCount === 0}
                        className="flex-1 sm:flex-initial min-w-[120px]"
                        size="default"
                      >
                        {picking ? (
                          <>
                            <Spinner size="sm" className="mr-1 sm:mr-2" />
                            <span className="text-sm">Picking...</span>
                          </>
                        ) : (
                          <>
                            <Shuffle className="h-4 w-4 mr-1 sm:mr-2" />
                            <span className="text-sm">Pick Random</span>
                          </>
                        )}
                      </Button>
                      {pickedStudents.length > 0 && (
                        <Button
                          onClick={() => pickRandomStudents(true)}
                          disabled={picking || availableCount === 0}
                          className="flex-1 sm:flex-initial min-w-[120px]"
                          size="default"
                          variant="secondary"
                        >
                          {picking ? (
                            <>
                              <Spinner size="sm" className="mr-1 sm:mr-2" />
                              <span className="text-sm">Picking...</span>
                            </>
                          ) : (
                            <>
                              <Shuffle className="h-4 w-4 mr-1 sm:mr-2" />
                              <span className="text-sm">Pick More</span>
                            </>
                          )}
                        </Button>
                      )}
                      <Button
                        onClick={resetPicker}
                        variant="outline"
                        size="default"
                        disabled={alreadyPicked.size === 0}
                        className="flex-1 sm:flex-initial min-w-[100px]"
                      >
                        <RotateCcw className="h-4 w-4 mr-1 sm:mr-2" />
                        <span className="text-sm">Reset</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Results */}
                {pickedStudents.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-semibold">
                        Picked Students ({pickedStudents.length})
                      </h3>
                      <Button
                        onClick={() => {
                          setPickedStudents([]);
                          toast.success("Picked students list cleared");
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="text-xs sm:text-sm">Clear Picked</span>
                      </Button>
                    </div>

                    <DroppableZone id="picked-zone">
                      <div className="grid gap-3 min-h-[100px] p-2 rounded-lg">
                        {pickedStudents.map((student, index) => (
                          <DraggableStudent
                            key={student.id}
                            student={student}
                            index={index}
                            isPicked={true}
                          />
                        ))}
                      </div>
                    </DroppableZone>
                  </div>
                )}

                {/* Already Picked Students */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base sm:text-lg">
                      Already Picked ({alreadyPicked.size})
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Drag students here to add, or drag away to remove
                    </p>
                  </CardHeader>
                  <CardContent>
                    <DroppableZone id="picked-zone-sidebar">
                      {alreadyPicked.size === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-8 p-2 rounded-lg min-h-[100px]">
                          No students picked yet. Drag students here to add.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 p-2 rounded-lg min-h-[100px]">
                          {students
                            .filter((s) => alreadyPicked.has(s.id))
                            .map((student) => (
                              <DraggableStudent
                                key={student.id}
                                student={student}
                                isPicked={false}
                              />
                            ))}
                        </div>
                      )}
                    </DroppableZone>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>

            {/* Available Students */}
            <Card
              className="shadow-lg lg:sticky lg:top-4 flex flex-col max-lg:mt-6"
              style={{ height: "calc(100vh - 2rem)" }}
            >
              <CardHeader className="flex-shrink-0">
                <CardTitle className="text-base sm:text-lg">
                  Available Students ({availableCount})
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Drag students here to remove from picked
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                <DroppableZone id="available-zone">
                  {availableCount === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8 p-2 rounded-lg h-full flex items-center justify-center">
                      All students have been picked
                    </div>
                  ) : (
                    <div className="space-y-2 h-full overflow-y-auto p-4 sm:p-6">
                      {students
                        .filter((s) => !alreadyPicked.has(s.id))
                        .map((student) => (
                          <DraggableStudent
                            key={student.id}
                            student={student}
                            isPicked={false}
                          />
                        ))}
                    </div>
                  )}
                </DroppableZone>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border-2 border-blue-400 shadow-lg opacity-90">
            <p className="font-medium text-sm">
              {students.find((s) => s.id === activeId)?.name}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
