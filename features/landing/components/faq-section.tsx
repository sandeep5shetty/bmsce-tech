"use client";

import { useState } from "react";

import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/button";

import ChevronUp from "@/components/icons/chevron-up";

import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "What is BMSCE.tech",
    answer:
      "BMSCE.tech is an open source community for students of BMS College of Engineering Bangalore, where you can create and share posts abour your learnings and projects.The main goal of BMSCE.tech is to help students to build connections, showcase their work, and learn from each other.",
  },
  {
    question: "Is BMSCE.tech free to use?",
    answer:
      "Yes! BMSCE.tech is completely free and open source. You can create unlimited posts, receive feedbacks, and share with your entire community without any cost.",
  },
  {
    question: "What features does BMSCE.tech offer?s",
    answer:
      "BMSCE.tech website currently offers features like creating posts, sharing projects, receiving feedbacks. Also there are some more features like Random Student Picker and forms to collect responses.",
  },
  {
    question: "Can I contribute to BMSCE.tech?",
    answer:
      "Absolutely! BMSCE.tech is an open source project, and we welcome contributions from the community. You can contribute by reporting issues, suggesting new features, or even submitting code changes via pull requests on our GitHub repository.",
  },
  {
    question: "Is it backed by the college?",
    answer:
      "BMSCE.tech is an independent initiative led by some of the students and is not officially affiliated with or endorsed by BMS College of Engineering. However, we aim to complement the college's efforts in fostering a collaborative learning environment among students.",
  },
];

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      className="relative z-20 mx-auto max-w-3xl scroll-mt-24 px-4 pt-16"
      id="faq"
    >
      {/* Section Header */}
      <div className="mb-12 space-y-3 text-center">
        <h2 className="text-foreground font-serif text-2xl font-semibold tracking-wider sm:text-3xl md:text-4xl">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground mx-auto max-w-md text-sm md:text-base">
          Got questions? We&apos;ve got answers. If you can&apos;t find what
          you&apos;re looking for, feel free to reach out.
        </p>
      </div>

      {/* FAQ Items */}
      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <FAQCard
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onClick={() => toggleFAQ(index)}
          />
        ))}
      </div>
    </section>
  );
};

interface FAQCardProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FAQCard = ({ question, answer, isOpen, onClick }: FAQCardProps) => {
  return (
    <motion.div
      className={cn(
        "group cursor-pointer overflow-hidden rounded-xl border transition-colors duration-200",
        isOpen
          ? "border-border bg-card"
          : "border-border/50 hover:border-border hover:bg-card/50",
      )}
      initial={false}
      onClick={onClick}
    >
      {/* Question Header */}
      <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
        <h3
          className={cn(
            "text-left font-serif text-base font-semibold tracking-wider transition-colors sm:text-lg",
            isOpen ? "text-foreground" : "text-foreground/80",
          )}
        >
          {question}
        </h3>

        {/* Toggle Icon */}
        <Button variant="outline" size="icon-sm">
          <motion.div
            initial={{ rotate: 180 }}
            animate={{ rotate: isOpen ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <ChevronUp />
          </motion.div>
        </Button>
      </div>

      {/* Answer Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{
              height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
            }}
          >
            <div className="border-t px-4 pt-4 pb-5 sm:px-5">
              <motion.p
                className="text-muted-foreground text-sm leading-relaxed sm:text-base"
                initial={{ opacity: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(4px)" }}
                transition={{
                  duration: 0.4,
                }}
              >
                {answer}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FAQSection;
