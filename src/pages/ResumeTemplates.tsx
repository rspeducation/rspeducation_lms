import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Resume/ui/card";
import { Button } from "@/components/Resume/ui/button";
import { Download, FileText, Eye, EyeOff, User, GraduationCap, Briefcase, Award, Wrench, Target, Settings, MapPin, FileUser, ArrowLeft } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/Resume/ui/resizable";
import PersonalInfoForm from "@/components/Resume/PersonalInfoForm";
import ProfileSummaryForm from "@/components/Resume/ProfileSummaryForm";
import AcademicProfileForm from "@/components/Resume/AcademicProfileForm";
import TechnicalSkillsForm from "@/components/Resume/TechnicalSkillsForm";
import WorkExperienceForm from "@/components/Resume/WorkExperienceForm";
import ProfessionalExperienceForm from "@/components/Resume/ProfessionalExperienceForm";
import PersonalProfileForm from "@/components/Resume/PersonalProfileForm";
import DeclarationForm from "@/components/Resume/DeclarationForm";
import ResumePreview from "@/components/Resume/ResumePreview";
import { ResumeData } from "@/types/resume";
import { downloadResumeAsDocx } from "@/utils/downloadUtils";
// import { ResumePDFGenerator } from "@/utils/resumePDFGenerator";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import write_blob from "capacitor-blob-writer";
import { FileOpener } from "@capacitor-community/file-opener";

const Index = () => {
  const initialResumeData: ResumeData = {
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      location: "",
      objective: ""
    },
    profileSummary: [],
    academicProfile: "",
    certifications: [],
    technicalSkills: {
      operatingSystem: "",
      cloudPlatform: "",
      orchestration: "",
      ticketingTools: "",
      cicd: "",
      iaac: "",
      versionControl: "",
      scripting: ""
    },
    workExperience: {
      position: "",
      company: "",
      location: "",
      duration: ""
    },
    professionalExperience: [],
    strengths: [],
    personalProfile: {
      fatherName: "",
      dob: "",
      nationality: "",
      languages: "",
      maritalStatus: ""
    },
    declaration: {
      text: "I hereby solemnly declare that all statements made above are true and correct to the best of my knowledge and belief.",
      date: "",
      place: "",
      signature: ""
    }
  };

  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);

  const [showPreview, setShowPreview] = useState(false);
  const navigate = useNavigate();

  const updatePersonalInfo = (field: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }));
  };

  const updateProfileSummary = (profileSummary: string[]) => {
    setResumeData(prev => ({ ...prev, profileSummary }));
  };

  const updateAcademicProfile = (academicProfile: string) => {
    setResumeData(prev => ({ ...prev, academicProfile }));
  };

  const updateTechnicalSkills = (technicalSkills: any) => {
    setResumeData(prev => ({ ...prev, technicalSkills }));
  };

  const updateWorkExperience = (workExperience: any) => {
    setResumeData(prev => ({ ...prev, workExperience }));
  };

  const updateProfessionalExperience = (professionalExperience: any[]) => {
    setResumeData(prev => ({ ...prev, professionalExperience }));
  };

  const updateCertifications = (certifications: any[]) => {
    setResumeData(prev => ({ ...prev, certifications }));
  };

  const updateStrengths = (strengths: string[]) => {
    setResumeData(prev => ({ ...prev, strengths }));
  };

  const updatePersonalProfile = (personalProfile: any) => {
    setResumeData(prev => ({ ...prev, personalProfile }));
  };

  const updateDeclaration = (declaration: any) => {
    setResumeData(prev => ({ ...prev, declaration }));
  };

  const handleCreateResume = () => {
    if (!resumeData.personalInfo.name || !resumeData.personalInfo.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in at least your name and email address.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Resume Updated!",
      description: "Your resume preview has been updated with the latest information."
    });
  };

  const handleDownload = async (format: 'docx' | 'pdf') => {
    if (!resumeData.personalInfo.name) {
      toast({
        title: "Cannot Download",
        description: "Please enter your name before downloading.",
        variant: "destructive"
      });
      return;
    }

    try {
      let blob: Blob | undefined;
      let fileName = "";
      let mimeType = "";

      if (format === 'docx') {
        blob = await downloadResumeAsDocx(resumeData);
        fileName = `${resumeData.personalInfo.name}_Resume.docx`;
        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else {
        // PDF generation is currently disabled/commented out. If you
        // re-enable PDF support, import ResumePDFGenerator above and
        // restore the call to generateResumePDF.
        toast({
          title: "PDF Not Supported",
          description: "PDF download is currently disabled. Please use DOCX or enable the PDF generator.",
          variant: "destructive"
        });
        return;
      }

      if (!blob) throw new Error('No file blob generated');

      if (Capacitor.getPlatform() === "web") {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Download Started", description: `Resume downloading as ${format.toUpperCase()}` });
      } else {
        // Use capacitor-blob-writer to write the blob to device storage
        await write_blob({ path: fileName, directory: Directory.Documents, blob });
        const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Documents });
        await FileOpener.open({ filePath: uri, contentType: mimeType });
        toast({ title: "File saved", description: `Saved and opened Resume (${format.toUpperCase()}) in app` });
      }
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Download Failed",
        description: error?.message ? String(error.message) : "There was an error downloading your resume. Please try again.",
        variant: "destructive"
      });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br  from-blue-50 via-white to-purple-50 overflow-x-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="w-full px-4 py-4 lg:py-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate">
                  RSP Education Resume builder
                </h1>
                <p className="text-xs lg:text-sm text-gray-600 hidden sm:block">Create your professional resume in minutes</p>
              </div>
            </div>
            <div className="flex gap-2 lg:gap-3 flex-wrap">
              {/* <Button
                variant="ghost"
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span> Go to Dashboard</span>
              </Button> */}
              <Button
                onClick={() => setShowPreview(!showPreview)}
                variant="outline"
                size="sm"
                className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm"
              >
                {showPreview ? <EyeOff className="w-3 h-3 lg:w-4 lg:h-4" /> : <Eye className="w-3 h-3 lg:w-4 lg:h-4" />}
                <span className="hidden sm:inline">{showPreview ? "Hide Preview" : "Show Preview"}</span>
                <span className="sm:hidden">{showPreview ? "Hide" : "Show"}</span>
              </Button>
              <Button
                onClick={() => handleDownload('docx')}
                size="sm"
                className="flex items-center gap-1 lg:gap-2 bg-blue-600 hover:bg-blue-700 text-xs lg:text-sm"
                disabled={!resumeData.personalInfo.name}
              >
                <Download className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Download DOCX</span>
                <span className="sm:hidden">DOCX</span>
              </Button>
              {/* <Button
                onClick={() => handleDownload('pdf')}
                size="sm"
                className="flex items-center gap-1 lg:gap-2 bg-red-600 hover:bg-red-700 text-xs lg:text-sm"
                disabled={!resumeData.personalInfo.name}
              >
                <Download className="w-3 h-3 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Download PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button> */}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-2 lg:px-4 py-4 lg:py-8 overflow-x-hidden">
        {/* Desktop Layout with Resizable Panels */}
        <div className="hidden lg:block h-[calc(100vh-120px)]">
          <ResizablePanelGroup key={showPreview ? "with-preview" : "no-preview"} direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={showPreview ? 45 : 100} minSize={35} maxSize={showPreview ? 65 : 100}>
              <div className={showPreview ? "pr-4 h-full overflow-y-auto" : "h-full overflow-y-auto"}>
                <div className="space-y-8 max-w-4xl">
                  {/* Personal Information */}
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PersonalInfoForm
                        data={resumeData.personalInfo}
                        onChange={updatePersonalInfo}
                      />
                    </CardContent>
                  </Card>

                  {/* Profile Summary */}
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-white" />
                        </div>
                        Profile Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProfileSummaryForm
                        data={resumeData.profileSummary}
                        onChange={updateProfileSummary}
                      />
                    </CardContent>
                  </Card>

                  {/* Academic Profile */}
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                          <GraduationCap className="w-4 h-4 text-white" />
                        </div>
                        Academic Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <AcademicProfileForm
                        data={resumeData.academicProfile}
                        onChange={updateAcademicProfile}
                      />
                    </CardContent>
                  </Card>

                  {/* Certifications */}
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                          <Award className="w-4 h-4 text-white" />
                        </div>
                        Certifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {resumeData.certifications.map((cert, index) => (
                          <div key={cert.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="text-sm font-medium">Certification Name</label>
                              <input
                                className="w-full p-2 border rounded"
                                value={cert.name}
                                onChange={(e) => {
                                  const newCerts = [...resumeData.certifications];
                                  newCerts[index].name = e.target.value;
                                  updateCertifications(newCerts);
                                }}
                                placeholder="Microsoft Certified Azure Administrator Associate"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Issuing Organization</label>
                              <input
                                className="w-full p-2 border rounded"
                                value={cert.issuer}
                                onChange={(e) => {
                                  const newCerts = [...resumeData.certifications];
                                  newCerts[index].issuer = e.target.value;
                                  updateCertifications(newCerts);
                                }}
                                placeholder="Microsoft"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Year</label>
                              <input
                                className="w-full p-2 border rounded"
                                value={cert.year}
                                onChange={(e) => {
                                  const newCerts = [...resumeData.certifications];
                                  newCerts[index].year = e.target.value;
                                  updateCertifications(newCerts);
                                }}
                                placeholder="2024"
                              />
                            </div>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            updateCertifications([
                              ...resumeData.certifications,
                              {
                                id: Date.now().toString(),
                                name: "",
                                issuer: "",
                                year: ""
                              }
                            ]);
                          }}
                          className="w-full"
                        >
                          Add Certification
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Technical Skills */}
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                          <Settings className="w-4 h-4 text-white" />
                        </div>
                        Technical Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TechnicalSkillsForm
                        data={resumeData.technicalSkills}
                        onChange={updateTechnicalSkills}
                      />
                    </CardContent>
                  </Card>

                  {/* Work Experience */}
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                          <Briefcase className="w-4 h-4 text-white" />
                        </div>
                        Work Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <WorkExperienceForm
                        data={resumeData.workExperience}
                        onChange={updateWorkExperience}
                      />
                    </CardContent>
                  </Card>

                  {/* Professional Experience */}
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 text-white" />
                        </div>
                        Professional Experience
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProfessionalExperienceForm
                        data={resumeData.professionalExperience}
                        onChange={updateProfessionalExperience}
                      />
                    </CardContent>
                  </Card>

                  {/* Strengths */}
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                          <Wrench className="w-4 h-4 text-white" />
                        </div>
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {resumeData.strengths.map((strength, index) => (
                          <input
                            key={index}
                            className="w-full p-2 border rounded"
                            value={strength}
                            onChange={(e) => {
                              const newStrengths = [...resumeData.strengths];
                              newStrengths[index] = e.target.value;
                              updateStrengths(newStrengths);
                            }}
                            placeholder="Work Commitment and dedication"
                          />
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => updateStrengths([...resumeData.strengths, ""])}
                          className="w-full"
                        >
                          Add Strength
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Personal Profile */}
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                          <FileUser className="w-4 h-4 text-white" />
                        </div>
                        Personal Profile
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <PersonalProfileForm
                        data={resumeData.personalProfile}
                        onChange={updatePersonalProfile}
                      />
                    </CardContent>
                  </Card>

                  {/* Declaration */}
                  <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-xl">
                        <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-white" />
                        </div>
                        Declaration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DeclarationForm
                        data={resumeData.declaration}
                        onChange={updateDeclaration}
                      />
                    </CardContent>
                  </Card>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                    <Button
                      onClick={handleCreateResume}
                      size="lg"
                      className="flex items-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-6"
                    >
                      <FileText className="w-5 h-5" />
                      Create Resume
                    </Button>
                    <Button
                      onClick={() => handleDownload('docx')}
                      variant="outline"
                      size="lg"
                      className="flex items-center gap-3 text-lg px-8 py-6"
                      disabled={!resumeData.personalInfo.name}
                    >
                      <Download className="w-5 h-5" />
                      Download DOCX
                    </Button>
                    {/* <Button
              onClick={() => handleDownload('pdf')}
              variant="outline"
              size="lg"
              className="flex items-center gap-3 text-lg px-8 py-6"
              disabled={!resumeData.personalInfo.name}
            >
              <Download className="w-5 h-5" />
              Download PDF
            </Button> */}
                  </div>
                </div>
              </div>
            </ResizablePanel>

            {showPreview && <ResizableHandle withHandle />}

            {showPreview && (
              <ResizablePanel defaultSize={55} minSize={35} maxSize={65}>
                <div className="pl-4 h-full overflow-y-auto bg-gray-50/50 rounded-lg">
                  <div className="sticky top-0 bg-white/90 backdrop-blur-sm p-4 border-b border-gray-200 rounded-t-lg mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Resume Preview</h2>
                    <p className="text-sm text-gray-600">Live preview updates as you type</p>
                  </div>
                  <div className="px-4 pb-4">
                    <ResumePreview data={resumeData} />
                  </div>
                </div>
              </ResizablePanel>
            )}
          </ResizablePanelGroup>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden">
          {!showPreview ? (
            <div className="space-y-6 max-w-2xl mx-auto">
              {/* All form sections for mobile */}
              {/* Personal Information */}
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PersonalInfoForm
                    data={resumeData.personalInfo}
                    onChange={updatePersonalInfo}
                  />
                </CardContent>
              </Card>

              {/* Profile Summary */}
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-3.5 h-3.5 text-white" />
                    </div>
                    Profile Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfileSummaryForm
                    data={resumeData.profileSummary}
                    onChange={updateProfileSummary}
                  />
                </CardContent>
              </Card>

              {/* Academic Profile */}
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-7 h-7 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-3.5 h-3.5 text-white" />
                    </div>
                    Academic Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <AcademicProfileForm
                    data={resumeData.academicProfile}
                    onChange={updateAcademicProfile}
                  />
                </CardContent>
              </Card>

              {/* Technical Skills */}
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-7 h-7 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                      <Settings className="w-3.5 h-3.5 text-white" />
                    </div>
                    Technical Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TechnicalSkillsForm
                    data={resumeData.technicalSkills}
                    onChange={updateTechnicalSkills}
                  />
                </CardContent>
              </Card>

              {/* Work Experience */}
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-7 h-7 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-3.5 h-3.5 text-white" />
                    </div>
                    Work Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WorkExperienceForm
                    data={resumeData.workExperience}
                    onChange={updateWorkExperience}
                  />
                </CardContent>
              </Card>

              {/* Professional Experience */}
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Target className="w-3.5 h-3.5 text-white" />
                    </div>
                    Professional Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProfessionalExperienceForm
                    data={resumeData.professionalExperience}
                    onChange={updateProfessionalExperience}
                  />
                </CardContent>
              </Card>

              {/* Strengths */}
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-7 h-7 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <Wrench className="w-3.5 h-3.5 text-white" />
                    </div>
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {resumeData.strengths.map((strength, index) => (
                      <input
                        key={index}
                        className="w-full p-2 border rounded text-sm"
                        value={strength}
                        onChange={(e) => {
                          const newStrengths = [...resumeData.strengths];
                          newStrengths[index] = e.target.value;
                          updateStrengths(newStrengths);
                        }}
                        placeholder="Work Commitment and dedication"
                      />
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => updateStrengths([...resumeData.strengths, ""])}
                      className="w-full"
                      size="sm"
                    >
                      Add Strength
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Personal Profile */}
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <FileUser className="w-3.5 h-3.5 text-white" />
                    </div>
                    Personal Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PersonalProfileForm
                    data={resumeData.personalProfile}
                    onChange={updatePersonalProfile}
                  />
                </CardContent>
              </Card>

              {/* Declaration */}
              <Card className="shadow-lg border-0 bg-white/70 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="w-7 h-7 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-white" />
                    </div>
                    Declaration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DeclarationForm
                    data={resumeData.declaration}
                    onChange={updateDeclaration}
                  />
                </CardContent>
              </Card>

              {/* Mobile Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 pb-8">
                <Button
                  onClick={handleCreateResume}
                  className="flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-base py-4"
                >
                  <FileText className="w-4 h-4" />
                  Create Resume
                </Button>
                <div className="grid ">
                  <Button
                    onClick={() => handleDownload('docx')}
                    variant="outline"
                    className="flex items-center justify-center gap-2 text-sm py-3"
                    disabled={!resumeData.personalInfo.name}
                  >
                    <Download className="w-3 h-3" />
                    DOCX
                  </Button>
                  {/* <Button
                    onClick={() => handleDownload('pdf')}
                    variant="outline"
                    className="flex items-center justify-center gap-2 text-sm py-3"
                    disabled={!resumeData.personalInfo.name}
                  >
                    <Download className="w-3 h-3" />
                    PDF
                  </Button> */}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="bg-white/90 backdrop-blur-sm p-4 border-b border-gray-200 rounded-t-lg mb-4 sticky top-16 z-10">
                <h2 className="text-lg font-semibold text-gray-800">Resume Preview</h2>
                <p className="text-sm text-gray-600">Live preview updates as you type</p>
              </div>
              <div className="px-2">
                <ResumePreview data={resumeData} />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 py-4 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-600">
            RSP Education Resume builder developed by{" "}
            <a
              href="https://rspeducations.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
            >
              RSP
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;