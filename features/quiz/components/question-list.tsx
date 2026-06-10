"use client";



import Link from "next/link";



import { EmptyAddCard } from "@/components/common/empty-add-card";



import {

  QuestionCard,

  type Question,

} from "@/features/quiz/components/question-card";



interface QuestionListProps {

  questions: Question[];

  eventId: string;

}



export function QuestionList({ questions, eventId }: QuestionListProps) {

  if (questions.length === 0) {

    return (

      <EmptyAddCard

        title="Add your first question"

        description="Add questions manually or use AI to generate a batch from a topic."

        href={`/quiz/events/${eventId}/questions/new`}

      />

    );

  }



  return (

    <ol className="space-y-3" aria-label="Questions">

      {questions.map((question) => (

        <li key={question.id}>

          <QuestionCard question={question} eventId={eventId} />

        </li>

      ))}

    </ol>

  );

}

