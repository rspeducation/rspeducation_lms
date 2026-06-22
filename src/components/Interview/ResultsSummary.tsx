import React, { useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import write_blob from "capacitor-blob-writer";
import { FileOpener } from "@capacitor-community/file-opener";
import { useToast } from "@/hooks/Interview/use-toast";
// Replace these with your own UI controls
import { Button } from "@/components/Interview/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Interview/ui/card";
import { Badge } from "@/components/Interview/ui/badge";
import { VoiceConfidenceChart } from "./VoiceConfidenceChart";
import { PDFGenerator, PDFReportData } from "@/utils/pdfGenerator";
import { AudioUtils } from "@/utils/audioUtils";
import {
  CheckCircle,
  Clock,
  RotateCcw,
  Download,
  Home,
  Mic,
  TrendingUp,
  Star,
  Target,
  BookOpen,
  FileText,
  Music
} from "lucide-react";

// Data types
interface VoiceConfidenceData {
  transcript: string;
  confidence: number;
  timestamp: number;
}
interface ConfidenceAnalysis {
  average: number;
  highest: number;
  lowest: number;
  totalSegments: number;
  highConfidenceCount: number;
  lowConfidenceCount: number;
}
interface ResultsSummaryProps {
  interviewState: any;
  questions: string[];
  audioBlob: Blob | null;
  videoBlob?: Blob | null;
  onRestart: () => void;
  topicName: string;
  userFormData: any;
  confidenceData?: VoiceConfidenceData[];
  confidenceAnalysis?: ConfidenceAnalysis;
}

// Utility for base64 conversion for fallback
const blobToBase64 = async (blob: Blob) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Cross-platform file saver (audio, video, pdf)
const saveFile = async (
  blob: Blob,
  fileName: string,
  mimeType: string,
  toast: any
) => {
  try {
    if (Capacitor.isNativePlatform()) {
      // Native: Write with blob-writer, then open
      const result = await write_blob({
        path: fileName,
        blob,
        directory: Directory.Documents,
        recursive: true,
        on_fallback: async () => {
          // Fallback: Filesystem API
          const base64Data = await blobToBase64(blob);
          await Filesystem.writeFile({
            path: fileName,
            data: base64Data,
            directory: Directory.Documents,
            encoding: Encoding.UTF8,
          });
        }
      });
      await FileOpener.open({
        filePath: result.uri || fileName,
        contentType: mimeType,
      });
      toast({
        title: "Success",
        description: `${fileName} saved & opened.`,
      });
    } else {
      // Web: Download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast({
        title: "Downloaded",
        description: `Saved ${fileName} to your computer.`,
      });
    }
  } catch (err) {
    toast({
      title: "File Save Error",
      description: String(err),
      variant: "destructive",
    });
  }
};

export const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  interviewState,
  questions,
  audioBlob,
  videoBlob,
  onRestart,
  topicName,
  userFormData,
  confidenceData = [],
  confidenceAnalysis
}) => {
  const { toast } = useToast();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Calculate score
  const getOverallScore = () => {
    const completionRate = (interviewState.answeredCount / questions.length) * 100;
    const voiceQuality = confidenceAnalysis ? (confidenceAnalysis.average * 100) : 50;
    const timeBonus = interviewState.skippedCount === 0 ? 10 : 0;
    return Math.min(100, Math.round((completionRate * 0.6) + (voiceQuality * 0.3) + timeBonus));
  };
  const overallScore = getOverallScore();

  // Score colors
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };
  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  // PDF Report Generator
  const generatePDFReport = async () => {
    setIsGeneratingPDF(true);
    try {
      const pdfData: PDFReportData = {
        userName: userFormData?.userName || "Interview Candidate",
        userEmail: userFormData?.userEmail || "candidate@example.com",
        date: AudioUtils.formatDate(new Date()),
        jobRole: topicName,
        level: userFormData?.level || "Not specified",
        experience: userFormData?.experience || "Not specified",
        totalQuestions: questions.length,
        answeredQuestions: interviewState.answeredCount,
        skippedQuestions: interviewState.skippedCount,
        timeSpent: formatTime(Math.floor((Date.now() - interviewState.startTime) / 1000)),
        score: overallScore,
        questions: questions.map((question: string, index: number) => ({
          question,
          answer: interviewState.answers[index] || "",
          isSkipped: !interviewState.answers[index]?.trim()
        })),
        strengths: [
          "Clear communication skills",
          "Good technical understanding",
          "Structured approach to problem-solving",
          ...(interviewState.skippedCount === 0 ? ["Completed all questions"] : []),
          ...(confidenceAnalysis && confidenceAnalysis.average > 0.7 ? ["Excellent voice clarity"] : [])
        ],
        improvements: [
          "Provide more detailed examples",
          "Practice explaining complex concepts simply",
          "Include more real-world scenarios in answers",
          ...(interviewState.skippedCount > 2 ? ["Try to answer more questions completely"] : []),
          ...(confidenceAnalysis && confidenceAnalysis.average < 0.6 ? ["Work on speech clarity and pace"] : [])
        ],
        recommendations: [
          "Review advanced concepts in your chosen field",
          "Practice mock interviews regularly",
          "Build more hands-on projects",
          "Stay updated with latest industry trends",
          ...(confidenceAnalysis ? ["Practice speaking clearly for better voice recognition"] : [])
        ],
        voiceAnalysis: confidenceAnalysis ? {
          averageConfidence: confidenceAnalysis.average,
          highestConfidence: confidenceAnalysis.highest,
          lowestConfidence: confidenceAnalysis.lowest,
          totalSegments: confidenceAnalysis.totalSegments,
          highConfidenceCount: confidenceAnalysis.highConfidenceCount,
          lowConfidenceCount: confidenceAnalysis.lowConfidenceCount
        } : undefined
      };

      const pdfBlob = await PDFGenerator.generateInterviewReport(pdfData);
      const fileName = `Interview_Report_${AudioUtils.formatDate(new Date()).replace(/\//g, "-")}.pdf`;
      await saveFile(pdfBlob, fileName, "application/pdf", toast);
      toast({
        title: "PDF Generated Successfully",
        description: "Your interview report has been downloaded with enhanced design and voice analysis",
      });
    } catch (error) {
      toast({
        title: "PDF Generation Failed",
        description: "There was an error generating your report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Audio download handler (MP3)
  const downloadAudioRecording = async () => {
    if (audioBlob) {
      try {
        const mp3Blob = await AudioUtils.convertBlobToMP3(audioBlob);
        const fileName = `Interview_Recording_${AudioUtils.formatDate(new Date()).replace(/\//g, "-")}.mp3`;
        await saveFile(mp3Blob, fileName, "audio/mp3", toast);
        toast({
          title: "Audio Downloaded",
          description: "Your interview recording has been downloaded as MP3 format",
        });
      } catch (error) {
        toast({
          title: "Audio Download Failed",
          description: "There was an error downloading your audio recording.",
          variant: "destructive",
        });
      }
    }
  };

  // Video download handler (MP4)
  const downloadVideoRecording = async () => {
    setIsDownloadingVideo(true);
    try {
      if (videoBlob) {
        const fileName = `Interview_Video_${AudioUtils.formatDate(new Date()).replace(/\//g, "-")}.mp4`;
        await saveFile(videoBlob, fileName, "video/mp4", toast);
        toast({
          title: "Video Downloaded",
          description: "Your interview video has been downloaded as MP4 format",
        });
      }
    } catch (error) {
      toast({
        title: "Video Download Failed",
        description: "Error downloading video recording.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingVideo(false);
    }
  };

  return (
    <div className="min-h-screen bg-interview-bg p-4">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Interview Results</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => window.location.href = "/"}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button variant="outline"
              onClick={generatePDFReport}
              disabled={isGeneratingPDF}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              {isGeneratingPDF ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {isGeneratingPDF ? "Generating PDF..." : "Download PDF Report"}
            </Button>
            {audioBlob && (
              <Button variant="outline"
                onClick={downloadAudioRecording}
                className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
              >
                <Music className="h-4 w-4 mr-2" />
                Download MP3 Audio
              </Button>
            )}
            {videoBlob && (
              <Button variant="outline"
                onClick={downloadVideoRecording}
                disabled={isDownloadingVideo}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <Download className="h-4 w-4 mr-2" />
                {isDownloadingVideo ? "Downloading..." : "Download MP4 Video"}
              </Button>
            )}
            <Button onClick={onRestart} variant="interview-primary">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>

        {/* OVERALL SCORE */}
        <Card className={`border-2 ${getScoreBg(overallScore)}`}>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className={`text-6xl font-bold ${getScoreColor(overallScore)} mb-2`}>
                {overallScore}
              </div>
              <div className="text-2xl text-gray-400 mb-4">/100</div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {topicName} Interview Complete
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {interviewState.answeredCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Answered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {interviewState.skippedCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Skipped</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round((interviewState.answeredCount / questions.length) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Completion</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {confidenceAnalysis ? `${(confidenceAnalysis.average * 100).toFixed(1)}%` : "N/A"}
                  </div>
                  <div className="text-sm text-muted-foreground">Voice Quality</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* VOICE CHART */}
        {confidenceData.length > 0 && (
          <VoiceConfidenceChart confidenceData={confidenceData} />
        )}

        {/* QUESTION REVIEW */}
        <Card>
          <CardHeader>
            <CardTitle>Question Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.map((question, index) => {
                const answer = interviewState.answers[index] || "";
                const isSkipped = !answer.trim();

                return (
                  <div key={index} className="border-l-4 border-l-blue-500 pl-4 py-3">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      {isSkipped ? (
                        <Badge variant="outline" className="text-orange-600">
                          Skipped
                        </Badge>
                      ) : (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Answered
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">{question}</p>
                    {!isSkipped && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm">{answer}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* PERFORMANCE INSIGHTS */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {interviewState.answeredCount > questions.length * 0.8 && (
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Excellent completion rate</span>
                  </li>
                )}
                {confidenceAnalysis && confidenceAnalysis.average > 0.7 && (
                  <li className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Clear and confident speech</span>
                  </li>
                )}
                {interviewState.skippedCount === 0 && (
                  <li className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Attempted all questions</span>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Areas for Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {interviewState.skippedCount > 0 && (
                  <li className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Try to answer all questions</span>
                  </li>
                )}
                {confidenceAnalysis && confidenceAnalysis.average < 0.6 && (
                  <li className="flex items-center gap-2">
                    <Mic className="h-4 w-4 text-red-500" />
                    <span className="text-sm">Work on speech clarity</span>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Practice with more examples</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* AUDIO & VIDEO PLAYERS */}
        {audioBlob && (
          <Card>
            <CardHeader>
              <CardTitle>Interview Audio Recording</CardTitle>
            </CardHeader>
            <CardContent>
              <audio controls src={URL.createObjectURL(audioBlob)} className="w-full" />
            </CardContent>
          </Card>
        )}
        {videoBlob && (
          <Card>
            <CardHeader>
              <CardTitle>Interview Video Recording</CardTitle>
            </CardHeader>
            <CardContent>
              <video controls src={URL.createObjectURL(videoBlob)} className="w-full" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
