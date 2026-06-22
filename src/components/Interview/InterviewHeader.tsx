
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/Interview/ui/card';
import { Badge } from '@/components/Interview/ui/badge';
import { Clock, Award, CheckCircle, SkipForward } from 'lucide-react';

interface InterviewHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  startTime: number;
  answeredCount: number;
  skippedCount: number;
  topicName?: string;
}

export const InterviewHeader: React.FC<InterviewHeaderProps> = ({
  currentIndex,
  totalQuestions,
  startTime,
  answeredCount,
  skippedCount,
  topicName = 'Mock Interview',
}) => {
  const [timeElapsed, setTimeElapsed] = useState('00:00');

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
      const seconds = (elapsed % 60).toString().padStart(2, '0');
      setTimeElapsed(`${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [startTime]);

  const progressPercentage = ((currentIndex + 1) / totalQuestions) * 100;
  const totalMarks = totalQuestions * 4;
  const earnedMarks = answeredCount * 4;

  return (
    <div className="bg-white shadow-interview-md border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Interview Title & Progress */}
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-foreground mb-2">
              Mock Interview – {topicName}
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Question {currentIndex + 1} of {totalQuestions}</span>
              <div className="flex-1 max-w-xs">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-primary transition-all duration-500 ease-smooth"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
          </div>

          {/* Statistics */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="flex items-center gap-1 bg-white text-slate-700 border border-slate-200 px-3 py-1 rounded-full">
              <Clock className="w-3 h-3" />
              {timeElapsed}
            </Badge>

            <Badge variant="outline" className="flex items-center gap-1 bg-green-100 text-green-800 border border-green-100 px-3 py-1 rounded-full">
              <CheckCircle className="w-3 h-3 text-green-700" />
              Answered: {answeredCount}
            </Badge>

            <Badge variant="outline" className="flex items-center gap-1 bg-orange-100 text-orange-800 border border-orange-100 px-3 py-1 rounded-full">
              <SkipForward className="w-3 h-3 text-orange-600" />
              Skipped: {skippedCount}
            </Badge>

            <Badge variant="default" className="flex items-center gap-1 bg-gradient-primary text-white px-3 py-1 rounded-full">
              <Award className="w-3 h-3" />
              {earnedMarks} / {totalMarks} marks
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};
