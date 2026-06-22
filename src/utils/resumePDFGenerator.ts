import jsPDF from 'jspdf';
import { ResumeData } from '@/types/resume';

export class ResumePDFGenerator {
  private static readonly PRIMARY_COLOR = [34, 197, 94]; // Green-500
  private static readonly SECONDARY_COLOR = [107, 114, 128]; // Gray-500
  private static readonly TEXT_COLOR = [0, 0, 0]; // Black

  static async generateResumePDF(data: ResumeData): Promise<Blob> {
    const doc = new jsPDF();
    let yPosition = 20;

    // Personal Information Header
    yPosition = this.addPersonalInfo(doc, data, yPosition);

    // Objective
    if (data.personalInfo.objective) {
      yPosition = this.addSection(doc, 'OBJECTIVE', [data.personalInfo.objective], yPosition);
    }

    // Profile Summary
    if (data.profileSummary.length > 0) {
      yPosition = this.addSection(doc, 'PROFILE SUMMARY', data.profileSummary, yPosition);
    }

    // Academic Profile
    if (data.academicProfile) {
      yPosition = this.addSection(doc, 'ACADEMIC PROFILE', [data.academicProfile], yPosition);
    }

    // Certifications
    if (data.certifications.length > 0) {
      const certTexts = data.certifications.map(cert => 
        `${cert.name} - ${cert.issuer} (${cert.year})`
      );
      yPosition = this.addSection(doc, 'CERTIFICATIONS', certTexts, yPosition);
    }

    // Technical Skills
    yPosition = this.addTechnicalSkills(doc, data, yPosition);

    // Work Experience
    if (data.workExperience.position) {
      const workText = `${data.workExperience.position} at ${data.workExperience.company}, ${data.workExperience.location} (${data.workExperience.duration})`;
      yPosition = this.addSection(doc, 'WORK EXPERIENCE', [workText], yPosition);
    }

    // Professional Experience
    if (data.professionalExperience.length > 0) {
      yPosition = this.addProfessionalExperience(doc, data, yPosition);
    }

    // Key Strengths
    if (data.strengths.length > 0) {
      yPosition = this.addSection(doc, 'KEY STRENGTHS', data.strengths, yPosition);
    }

    // Personal Profile
    yPosition = this.addPersonalProfile(doc, data, yPosition);

    // Declaration
    if (data.declaration.text) {
      yPosition = this.addDeclaration(doc, data, yPosition);
    }

    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }

  private static addPersonalInfo(doc: jsPDF, data: ResumeData, yPosition: number): number {
    // Name
    doc.setFontSize(24);
    doc.setTextColor(this.PRIMARY_COLOR[0], this.PRIMARY_COLOR[1], this.PRIMARY_COLOR[2]);
    doc.text(data.personalInfo.name, 20, yPosition);
    yPosition += 15;

    // Contact Info
    doc.setFontSize(11);
    doc.setTextColor(this.TEXT_COLOR[0], this.TEXT_COLOR[1], this.TEXT_COLOR[2]);
    doc.text(`Email: ${data.personalInfo.email}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Phone: ${data.personalInfo.phone}`, 20, yPosition);
    yPosition += 7;
    if (data.personalInfo.location) {
      doc.text(`Location: ${data.personalInfo.location}`, 20, yPosition);
      yPosition += 7;
    }

    return yPosition + 10;
  }

  private static addSection(doc: jsPDF, title: string, items: string[], yPosition: number): number {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Section Header
    doc.setFillColor(this.PRIMARY_COLOR[0], this.PRIMARY_COLOR[1], this.PRIMARY_COLOR[2]);
    doc.rect(20, yPosition - 5, 170, 12, 'F');

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(title, 25, yPosition + 3);
    yPosition += 18;

    // Section Content
    doc.setFontSize(11);
    doc.setTextColor(this.TEXT_COLOR[0], this.TEXT_COLOR[1], this.TEXT_COLOR[2]);

    items.forEach((item) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      const lines = doc.splitTextToSize(`• ${item}`, 165);
      doc.text(lines, 25, yPosition);
      yPosition += lines.length * 6;
    });

    return yPosition + 10;
  }

  private static addTechnicalSkills(doc: jsPDF, data: ResumeData, yPosition: number): number {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    // Section Header
    doc.setFillColor(this.PRIMARY_COLOR[0], this.PRIMARY_COLOR[1], this.PRIMARY_COLOR[2]);
    doc.rect(20, yPosition - 5, 170, 12, 'F');

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('TECHNICAL SKILLS', 25, yPosition + 3);
    yPosition += 18;

    doc.setFontSize(11);
    doc.setTextColor(this.TEXT_COLOR[0], this.TEXT_COLOR[1], this.TEXT_COLOR[2]);

    const skills = [
      ['Operating System:', data.technicalSkills.operatingSystem],
      ['Cloud Platform:', data.technicalSkills.cloudPlatform],
      ['Orchestration:', data.technicalSkills.orchestration],
      ['Ticketing Tools:', data.technicalSkills.ticketingTools],
      ['CI/CD:', data.technicalSkills.cicd],
      ['IaaC:', data.technicalSkills.iaac],
      ['Version Control:', data.technicalSkills.versionControl],
      ['Scripting:', data.technicalSkills.scripting]
    ].filter(([, value]) => value);

    skills.forEach(([label, value]) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(`• ${label} ${value}`, 25, yPosition);
      yPosition += 7;
    });

    return yPosition + 10;
  }

  private static addProfessionalExperience(doc: jsPDF, data: ResumeData, yPosition: number): number {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    // Section Header
    doc.setFillColor(this.PRIMARY_COLOR[0], this.PRIMARY_COLOR[1], this.PRIMARY_COLOR[2]);
    doc.rect(20, yPosition - 5, 170, 12, 'F');

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('PROFESSIONAL EXPERIENCE', 25, yPosition + 3);
    yPosition += 18;

    doc.setFontSize(11);
    doc.setTextColor(this.TEXT_COLOR[0], this.TEXT_COLOR[1], this.TEXT_COLOR[2]);

    data.professionalExperience.forEach((exp) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Project Header
      doc.setFont('helvetica', 'bold');
      doc.text(`Project: ${exp.projectName}`, 25, yPosition);
      yPosition += 7;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Client: ${exp.client}`, 25, yPosition);
      yPosition += 7;
      doc.text(`Role: ${exp.role}`, 25, yPosition);
      yPosition += 7;
      doc.text(`Duration: ${exp.duration}`, 25, yPosition);
      yPosition += 10;

      // Roles & Responsibilities
      doc.setFont('helvetica', 'bold');
      doc.text('Roles & Responsibilities:', 25, yPosition);
      yPosition += 7;
      
      doc.setFont('helvetica', 'normal');
      exp.rolesResponsibilities.forEach((role) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        
        const lines = doc.splitTextToSize(`• ${role}`, 165);
        doc.text(lines, 35, yPosition);
        yPosition += lines.length * 6;
      });

      yPosition += 10;
    });

    return yPosition;
  }

  private static addPersonalProfile(doc: jsPDF, data: ResumeData, yPosition: number): number {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    // Section Header
    doc.setFillColor(this.PRIMARY_COLOR[0], this.PRIMARY_COLOR[1], this.PRIMARY_COLOR[2]);
    doc.rect(20, yPosition - 5, 170, 12, 'F');

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('PERSONAL PROFILE', 25, yPosition + 3);
    yPosition += 18;

    doc.setFontSize(11);
    doc.setTextColor(this.TEXT_COLOR[0], this.TEXT_COLOR[1], this.TEXT_COLOR[2]);

    const personalItems = [
      ['Father\'s Name:', data.personalProfile.fatherName],
      ['Date of Birth:', data.personalProfile.dob],
      ['Nationality:', data.personalProfile.nationality],
      ['Languages Known:', data.personalProfile.languages],
      ['Marital Status:', data.personalProfile.maritalStatus]
    ].filter(([, value]) => value);

    personalItems.forEach(([label, value]) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      
      doc.text(`${label} ${value}`, 25, yPosition);
      yPosition += 7;
    });

    return yPosition + 10;
  }

  private static addDeclaration(doc: jsPDF, data: ResumeData, yPosition: number): number {
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
    }

    // Section Header
    doc.setFillColor(this.PRIMARY_COLOR[0], this.PRIMARY_COLOR[1], this.PRIMARY_COLOR[2]);
    doc.rect(20, yPosition - 5, 170, 12, 'F');

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('DECLARATION', 25, yPosition + 3);
    yPosition += 18;

    doc.setFontSize(11);
    doc.setTextColor(this.TEXT_COLOR[0], this.TEXT_COLOR[1], this.TEXT_COLOR[2]);

    const lines = doc.splitTextToSize(data.declaration.text, 165);
    doc.text(lines, 25, yPosition);
    yPosition += lines.length * 6 + 10;

    doc.text(`Date: ${data.declaration.date}`, 25, yPosition);
    doc.text(`Place: ${data.declaration.place}`, 120, yPosition);
    yPosition += 15;
    doc.text(`Signature: ${data.declaration.signature}`, 25, yPosition);

    return yPosition;
  }

  static downloadPDF(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}