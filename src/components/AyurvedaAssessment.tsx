import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { QuestionnaireSection, PlatformQuizQuestion } from "@/lib/platform-api";

interface AyurvedaAssessmentProps {
  sections: QuestionnaireSection[];
  answers: Record<string, string | string[]>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string | string[]>>>;
}

export const AyurvedaAssessment: React.FC<AyurvedaAssessmentProps> = ({
  sections,
  answers,
  setAnswers,
}) => {
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const currentSection = sections[currentSectionIndex];

  // Calculate total questions for progress
  const totalQuestions = sections.reduce((sum, section) => sum + section.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;
  const progress = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

  const handleAnswerChange = (questionId: string, value: string | boolean) => {
    setAnswers((prev) => {
      const question = findQuestionById(questionId);
      const questionType = question?.question_type || "radio";

      if (questionType === "checkbox") {
        // For checkbox type questions (Yes/No), store as boolean
        // true = Yes, false = No, undefined = not answered
        return { ...prev, [questionId]: value as boolean };
      } else {
        // For radio, set single value
        return { ...prev, [questionId]: value as string };
      }
    });
  };

  const findQuestionById = (questionId: string): PlatformQuizQuestion | undefined => {
    for (const section of sections) {
      const question = section.questions.find((q) => q.id === questionId);
      if (question) return question;
    }
    return undefined;
  };

  const isQuestionAnswered = (questionId: string): boolean => {
    const answer = answers[questionId];
    // For checkbox type (Yes/No), answer is boolean (true or false means answered)
    if (typeof answer === "boolean") {
      return true; // Both Yes (true) and No (false) count as answered
    }
    if (Array.isArray(answer)) {
      return answer.length > 0;
    }
    return !!answer;
  };

  const getCurrentAnswer = (questionId: string): string | boolean => {
    const answer = answers[questionId];
    // For checkbox type (Yes/No), answer is boolean
    // For radio type, answer is string (A, B, C, etc.)
    if (typeof answer === "boolean") {
      return answer;
    }
    if (Array.isArray(answer)) {
      // Legacy support: if answer is array, check if "Yes" is included
      return answer.includes("Yes");
    }
    return answer as string;
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Section {currentSectionIndex + 1} of {sections.length}</span>
          <span>{answeredQuestions} of {totalQuestions} questions answered</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current Section */}
      <Card>
        <CardHeader>
          <CardTitle>{currentSection.section_title}</CardTitle>
          {currentSection.section_description && (
            <CardDescription>{currentSection.section_description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          {currentSection.questions.map((question, qIndex) => {
            const questionType = question.question_type || "radio";
            const isAnswered = isQuestionAnswered(question.id);
            const currentAnswer = getCurrentAnswer(question.id);

            return (
              <div key={question.id} className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                    {qIndex + 1}
                  </span>
                  <div className="flex-1">
                    <Label className="text-base font-semibold">
                      {question.question_text}
                      {!isAnswered && <span className="text-destructive ml-2">*</span>}
                    </Label>
                  </div>
                </div>

                {questionType === "checkbox" ? (
                  // Radio buttons for Yes/No (Section 8 - Complaints)
                  <RadioGroup
                    value={currentAnswer === true ? "Yes" : currentAnswer === false ? "No" : undefined}
                    onValueChange={(value) => handleAnswerChange(question.id, value === "Yes")}
                    className="ml-11 space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                      <RadioGroupItem value="Yes" id={`${question.id}_yes`} />
                      <Label htmlFor={`${question.id}_yes`} className="flex-1 cursor-pointer font-normal">
                        Yes
                        {question.dosha_a && (
                          <span className="ml-2 text-xs text-primary">({question.dosha_a})</span>
                        )}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                      <RadioGroupItem value="No" id={`${question.id}_no`} />
                      <Label htmlFor={`${question.id}_no`} className="flex-1 cursor-pointer font-normal">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                ) : (
                  // Radio buttons for single-select
                  <RadioGroup
                    value={currentAnswer as string}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                    className="ml-11 space-y-3"
                  >
                    {question.option_a && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                        <RadioGroupItem value="A" id={`${question.id}_a`} />
                        <Label htmlFor={`${question.id}_a`} className="flex-1 cursor-pointer font-normal">
                          {question.option_a}
                          {question.dosha_a && (
                            <span className="ml-2 text-xs text-primary">({question.dosha_a})</span>
                          )}
                        </Label>
                      </div>
                    )}

                    {question.option_b && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                        <RadioGroupItem value="B" id={`${question.id}_b`} />
                        <Label htmlFor={`${question.id}_b`} className="flex-1 cursor-pointer font-normal">
                          {question.option_b}
                          {question.dosha_b && (
                            <span className="ml-2 text-xs text-primary">({question.dosha_b})</span>
                          )}
                        </Label>
                      </div>
                    )}

                    {question.option_c && (
                      <div className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                        <RadioGroupItem value="C" id={`${question.id}_c`} />
                        <Label htmlFor={`${question.id}_c`} className="flex-1 cursor-pointer font-normal">
                          {question.option_c}
                          {question.dosha_c && (
                            <span className="ml-2 text-xs text-primary">({question.dosha_c})</span>
                          )}
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Section Navigation */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={() => setCurrentSectionIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentSectionIndex === 0}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous Section
        </button>

        <div className="flex gap-2">
          {sections.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentSectionIndex(index)}
              className={`w-3 h-3 rounded-full ${
                index === currentSectionIndex
                  ? "bg-primary"
                  : sections[index].questions.some((q) => isQuestionAnswered(q.id))
                  ? "bg-primary/50"
                  : "bg-gray-300"
              }`}
              title={sections[index].section_title}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCurrentSectionIndex((prev) => Math.min(sections.length - 1, prev + 1))}
          disabled={currentSectionIndex === sections.length - 1}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next Section
        </button>
      </div>

      {/* Section List Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Questionnaire Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {sections.map((section, index) => {
              const sectionAnsweredCount = section.questions.filter((q) => isQuestionAnswered(q.id)).length;
              const sectionTotal = section.questions.length;
              const isCurrent = index === currentSectionIndex;

              return (
                <button
                  key={section.section_id}
                  type="button"
                  onClick={() => setCurrentSectionIndex(index)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isCurrent
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{section.section_title}</div>
                      {section.section_description && (
                        <div className="text-sm text-muted-foreground">{section.section_description}</div>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {sectionAnsweredCount}/{sectionTotal}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

