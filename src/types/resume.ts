
export interface ResumeData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    objective: string;
  };
  profileSummary: string[];
  academicProfile: string;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    year: string;
  }>;
  technicalSkills: {
    operatingSystem: string;
    cloudPlatform: string;
    orchestration: string;
    ticketingTools: string;
    cicd: string;
    iaac: string;
    versionControl: string;
    scripting: string;
  };
  workExperience: {
    position: string;
    company: string;
    location: string;
    duration: string;
  };
  professionalExperience: Array<{
    id: string;
    projectName: string;
    client: string;
    role: string;
    designation: string;
    duration: string;
    rolesResponsibilities: string[];
  }>;
  strengths: string[];
  personalProfile: {
    fatherName: string;
    dob: string;
    nationality: string;
    languages: string;
    maritalStatus: string;
  };
  declaration: {
    text: string;
    date: string;
    place: string;
    signature: string;
  };
}
