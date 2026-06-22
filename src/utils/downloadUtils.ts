import { ResumeData } from '@/types/resume';
import mcpLogo from '@/assets/microsoft-certified.png';
import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ShadingType } from 'docx';

export const downloadResumeAsDocx = async (resumeData: ResumeData) => {
  const greenFill = "C5E1C5";
  const sectionHeader = (title: string) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              shading: { type: ShadingType.CLEAR, color: 'auto', fill: greenFill },
              margins: { top: 100, bottom: 100, left: 100, right: 100 },
              children: [
                new Paragraph({
                  children: [new TextRun({ text: title, bold: true, size: 20, font: 'Calibri' })],
                }),
              ],
            }),
          ],
        }),
      ],
    });

  const fetchImageArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
    const res = await fetch(url);
    return res.arrayBuffer();
  };

  const logoBuffer = await fetchImageArrayBuffer(mcpLogo);
  const logoBytes = new Uint8Array(logoBuffer);

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header with name and contact info
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Name: ${resumeData.personalInfo.name || 'Your Name'}`,
                          bold: true,
                          size: 24,
                          font: 'Calibri',
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Email: ${resumeData.personalInfo.email || ''}`,
                          size: 20,
                          font: 'Calibri',
                        }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: `Mobile: ${resumeData.personalInfo.phone || ''}`,
                          size: 20,
                          font: 'Calibri',
                        }),
                      ],
                    }),
                     new Paragraph({
                      children: [
                        new TextRun({
                          text: `Location: ${resumeData.personalInfo.location || ''}`,
                          size: 20,
                          font: 'Calibri',
                        }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new ImageRun({
                          data: logoBytes,
                          transformation: { width: 100, height: 80 },
                          type: 'png',
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // Objective section
        ...(resumeData.personalInfo.objective ? [
          new Paragraph({ text: "" }), // spacing
          sectionHeader("OBJECTIVE:"),
          new Paragraph({
            children: [
              new TextRun({
                text: resumeData.personalInfo.objective,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
        ] : []),

        // Profile Summary section
        ...(resumeData.profileSummary.length > 0 ? [
          new Paragraph({ text: "" }), // spacing
          sectionHeader("PROFILE SUMMARY:"),
          ...resumeData.profileSummary.map(point => 
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${point}`,
                  size: 20,
                  font: 'Calibri',
                }),
              ],
              // bullet: { level: 0 },
            })
          ),
        ] : []),

        // Academic Profile section
        ...(resumeData.academicProfile ? [
          new Paragraph({ text: "" }), // spacing
          sectionHeader("ACADEMIC PROFILE:"),
          new Paragraph({
            children: [
              new TextRun({
                text: resumeData.academicProfile,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
        ] : []),

        // Certifications section
        ...(resumeData.certifications.length > 0 && resumeData.certifications.some(cert => cert.name) ? [
          new Paragraph({ text: "" }), // spacing
          sectionHeader("CERTIFICATIONS:"),
          ...resumeData.certifications.filter(cert => cert.name).map(cert => 
            new Paragraph({
              children: [
                new TextRun({
                  text: cert.name,
                  bold: true,
                  size: 20,
                  font: 'Calibri',
                }),
                new TextRun({
                  text: ` | ${cert.issuer}${cert.year ? ` | ${cert.year}` : ''}`,
                  size: 20,
                  font: 'Calibri',
                }),
              ],
            })
          ),
        ] : []),

        // Technical Skills section
        ...(Object.values(resumeData.technicalSkills).some(skill => skill) ? [
          new Paragraph({ text: "" }), // spacing
          sectionHeader("TECHNICAL SKILLS:"),
          ...(resumeData.technicalSkills.operatingSystem ? [
            new Paragraph({
              tabStops: [{ position: 2250, type: "left" }], // a bit wider because text is longer
              children: [
                new TextRun({ text: "Operating System", bold: true, size: 20, font: 'Calibri' }),
                new TextRun({ text: " \t:       ", size: 20, font: 'Calibri' }),
                new TextRun({ text: resumeData.technicalSkills.operatingSystem, size: 20, font: 'Calibri' }),
              ],
            }),
          ] : []),
          ...(resumeData.technicalSkills.cloudPlatform ? [
            new Paragraph({
              tabStops: [{ position: 2250, type: "left" }], // a bit wider because text is longer
              children: [
                new TextRun({ text: "Cloud Platform", bold: true, size: 20, font: 'Calibri' }),
                new TextRun({ text: " \t:       ", size: 20, font: 'Calibri' }),
                new TextRun({ text: resumeData.technicalSkills.cloudPlatform, size: 20, font: 'Calibri' }),
              ],
            }),
          ] : []),
          ...(resumeData.technicalSkills.orchestration ? [
            new Paragraph({
               tabStops: [{ position: 2250, type: "left" }], // a bit wider because text is longer
              children: [
                new TextRun({ text: "Orchestration", bold: true, size: 20, font: 'Calibri' }),
                new TextRun({ text: " \t:       ", size: 20, font: 'Calibri' }),
                new TextRun({ text: resumeData.technicalSkills.orchestration, size: 20, font: 'Calibri' }),
              ],
            }),
          ] : []),
          ...(resumeData.technicalSkills.ticketingTools ? [
            new Paragraph({
               tabStops: [{ position: 2250, type: "left" }], // a bit wider because text is longer

              children: [
                new TextRun({ text: "Ticketing Tools", bold: true, size: 20, font: 'Calibri' }),
                new TextRun({ text: " \t:       ", size: 20, font: 'Calibri' }),
                new TextRun({ text: resumeData.technicalSkills.ticketingTools, size: 20, font: 'Calibri' }),
              ],
            }),
          ] : []),
          ...(resumeData.technicalSkills.cicd ? [
            new Paragraph({
               tabStops: [{ position: 2250, type: "left" }], // a bit wider because text is longer

              children: [
                new TextRun({ text: "CI/CD", bold: true, size: 20, font: 'Calibri' }),
                new TextRun({ text: " \t:       ", size: 20, font: 'Calibri' }),
                new TextRun({ text: resumeData.technicalSkills.cicd, size: 20, font: 'Calibri' }),
              ],
            }),
          ] : []),
          ...(resumeData.technicalSkills.iaac ? [
            new Paragraph({
               tabStops: [{ position: 2250, type: "left" }], // a bit wider because text is longer

              children: [
                new TextRun({ text: "IaaS", bold: true, size: 20, font: 'Calibri' }),
                new TextRun({ text: " \t:       ", size: 20, font: 'Calibri' }),
                new TextRun({ text: resumeData.technicalSkills.iaac, size: 20, font: 'Calibri' }),
              ],
            }),
          ] : []),
          ...(resumeData.technicalSkills.versionControl ? [
            new Paragraph({
               tabStops: [{ position: 2250, type: "left" }], // a bit wider because text is longer

              children: [
                new TextRun({ text: "Version Control", bold: true, size: 20, font: 'Calibri' }),
                new TextRun({ text: " \t:       ", size: 20, font: 'Calibri' }),
                new TextRun({ text: resumeData.technicalSkills.versionControl, size: 20, font: 'Calibri' }),
              ],
            }),
          ] : []),
          ...(resumeData.technicalSkills.scripting ? [
            new Paragraph({
               tabStops: [{ position: 2250, type: "left" }], // a bit wider because text is longer

              children: [
                new TextRun({ text: "Scripting", bold: true, size: 20, font: 'Calibri' }),
                new TextRun({ text: " \t:       ", size: 20, font: 'Calibri' }),
                new TextRun({ text: resumeData.technicalSkills.scripting, size: 20, font: 'Calibri' }),
              ],
            }),
          ] : []),
        ] : []),

        // Work Experience section
        ...((resumeData.workExperience.position || resumeData.workExperience.company) ? [
          new Paragraph({ text: "" }), // spacing
          sectionHeader("WORK EXPERIENCE:"),
          new Paragraph({
            children: [
              new TextRun({
                text: `Working as ${resumeData.workExperience.position || ''} in ${resumeData.workExperience.company || ''}${resumeData.workExperience.location ? `, ${resumeData.workExperience.location}` : ''}${resumeData.workExperience.duration ? ` from ${resumeData.workExperience.duration}` : ''}.`,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
        ] : []),

        // Professional Experience section
        ...(resumeData.professionalExperience.length > 0 && resumeData.professionalExperience.some(exp => exp.projectName) ? [
          new Paragraph({ text: "" }), // spacing
          sectionHeader("PROFESSIONAL EXPERIENCE:"),
          ...resumeData.professionalExperience.filter(exp => exp.projectName).flatMap(exp => [
            new Paragraph({
              tabStops: [{ position: 2200, type: "left" }], // adjust spacing for "Project"
              children: [
                new TextRun({ text: "Project", bold: true, size: 20, font: 'Calibri' }),    
                new TextRun({ text: " \t:      ", size: 20, font: 'Calibri' }),
                new TextRun({ text: exp.projectName, size: 20, font: 'Calibri' }),

              ],
            }),
            ...(exp.client ? [
              new Paragraph({
              tabStops: [{ position: 2200, type: "left" }], // adjust spacing for "Project"

                children: [
                  new TextRun({ text: "Client", bold: true, size: 20, font: 'Calibri' }),
                  new TextRun({ text: " \t:      ", size: 20, font: 'Calibri' }),
                  new TextRun({ text: exp.client, size: 20, font: 'Calibri' }),
                ],
              }),
            ] : []),
            ...(exp.role ? [
              new Paragraph({
              tabStops: [{ position: 2200, type: "left" }], // adjust spacing for "Project"

                children: [
                  new TextRun({ text: "Role", bold: true, size: 20, font: 'Calibri' }),
                  new TextRun({ text: " \t:      ", size: 20, font: 'Calibri' }),
                  new TextRun({ text: exp.role, size: 20, font: 'Calibri' }),
                ],
              }),
            ] : []),
            ...(exp.designation ? [
              new Paragraph({
              tabStops: [{ position: 2200, type: "left" }], // adjust spacing for "Project"

                children: [
                  new TextRun({ text: "Designation", bold: true, size: 20, font: 'Calibri' }),
                  new TextRun({ text: " \t:      ", size: 20, font: 'Calibri' }),
                  new TextRun({ text: exp.designation, size: 20, font: 'Calibri' }),
                ],
              }),
            ] : []),
            ...(exp.duration ? [
              new Paragraph({
              tabStops: [{ position: 2200, type: "left" }], // adjust spacing for "Project"

                children: [
                  new TextRun({ text: "Duration", bold: true, size: 20, font: 'Calibri' }),
                  new TextRun({ text: " \t:      ", size: 20, font: 'Calibri' }),
                  new TextRun({ text: exp.duration, size: 20, font: 'Calibri' }),
                ],
              }),
            ] : []),
            ...(exp.rolesResponsibilities.length > 0 ? [
              new Paragraph({
                
                children: [
                  new TextRun({
                    text: "Roles & Responsibilities:",
                    bold: true,
                    size: 20,
                    font: 'Calibri',
                  }),
                ],
              }),
              ...exp.rolesResponsibilities.map(responsibility => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `• ${responsibility}`,
                      size: 20,
                      font: 'Calibri',
                    }),
                  ],
                  // bullet: { level: 0 },
                })
              ),
            ] : []),
            new Paragraph({ text: "" }), // spacing between projects
          ]),
        ] : []),

        // Key Strengths section
        ...(resumeData.strengths.length > 0 ? [
          new Paragraph({ text: "" }), // spacing
          sectionHeader("KEY STRENGTHS:"),
          ...resumeData.strengths.map(strength => 
            new Paragraph({
              children: [
                new TextRun({
                  text: `• ${strength}`,
                  size: 20,
                  font: 'Calibri',
                }),
              ],
              // bullet: { level: 0 },
            })
          ),
        ] : []),

        // Personal Profile section
        ...(Object.values(resumeData.personalProfile).some(value => value) ? [
          new Paragraph({ text: "" }), // spacing
          sectionHeader("PERSONAL PROFILE:"),
         // PERSONAL PROFILE SECTION
          ...(resumeData.personalInfo.name ? [
            new Paragraph({
              tabStops: [{ position: 2200, type: "left" }], // adjust spacing for "Name"
              children: [
                new TextRun({ text: "Name", bold: true, size: 20, font: "Calibri" }),
                new TextRun({ text: "\t:       ", size: 20, font: "Calibri" }),
                new TextRun({ text: resumeData.personalInfo.name, size: 20, font: "Calibri" }),
              ],
            }),
          ] : []),

          ...(resumeData.personalProfile.fatherName ? [
            new Paragraph({
              tabStops: [{ position: 2200, type: "left" }], // a bit wider because text is longer
              children: [
                new TextRun({ text: "Father Name", bold: true, size: 20, font: "Calibri" }),
                new TextRun({ text: " \t:       ", size: 20, font: "Calibri" }),
                new TextRun({ text: resumeData.personalProfile.fatherName, size: 20, font: "Calibri" }),
              ],
            }),
          ] : []),

          ...(resumeData.personalProfile.dob ? [
            new Paragraph({
              tabStops: [{ position: 2200, type: "left" }],
              children: [
                new TextRun({ text: "Date of Birth", bold: true, size: 20, font: "Calibri" }),
                new TextRun({ text: " \t:       ", size: 20, font: "Calibri" }),
                new TextRun({ text: resumeData.personalProfile.dob, size: 20, font: "Calibri" }),
              ],
            }),
          ] : []),

          ...(resumeData.personalProfile.nationality ? [
            new Paragraph({
              tabStops: [{ position: 2200, type: "left" }],
              children: [
                new TextRun({ text: "Nationality", bold: true, size: 20, font: "Calibri" }),
                new TextRun({ text: "\t:       ", size: 20, font: "Calibri" }),
                new TextRun({ text: resumeData.personalProfile.nationality, size: 20, font: "Calibri" }),
              ],
            }),
          ] : []),

          ...(resumeData.personalProfile.languages ? [
            new Paragraph({
              tabStops: [{ position: 2200, type: "left" }],
              children: [
                new TextRun({ text: "Languages", bold: true, size: 20, font: "Calibri" }),
                new TextRun({ text: "\t:       ", size: 20, font: "Calibri" }),
                new TextRun({ text: resumeData.personalProfile.languages, size: 20, font: "Calibri" }),
              ],
            }),
          ] : []),

          ...(resumeData.personalProfile.maritalStatus ? [
            new Paragraph({
              tabStops: [{ position: 2200, type: "left" }],
              children: [
                new TextRun({ text: "Marital Status", bold: true, size: 20, font: "Calibri" }),
                new TextRun({ text: " \t:       ", size: 20, font: "Calibri" }),
                new TextRun({ text: resumeData.personalProfile.maritalStatus, size: 20, font: "Calibri" }),
              ],
            }),
          ] : []),
                  ] : []),

        // Declaration section
        ...((resumeData.declaration.text || resumeData.declaration.date || resumeData.declaration.place) ? [
          new Paragraph({ text: "" }), // spacing
          sectionHeader("DECLARATION:"),
          ...(resumeData.declaration.text ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: resumeData.declaration.text,
                  size: 20,
                  font: 'Calibri',
                }),
              ],
            }),
          ] : []),
          new Paragraph({ text: "" }), // spacing
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.NONE },
              bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.NONE },
              right: { style: BorderStyle.NONE },
              insideHorizontal: { style: BorderStyle.NONE },
              insideVertical: { style: BorderStyle.NONE },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      ...(resumeData.declaration.date ? [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Date", bold: true, size: 20, font: 'Calibri' }),
                            new TextRun({ text: " : ", size: 20, font: 'Calibri' }),
                            new TextRun({ text: resumeData.declaration.date, size: 20, font: 'Calibri' }),
                          ],
                        }),
                      ] : []),
                      ...(resumeData.declaration.place ? [
                        new Paragraph({
                          children: [
                            new TextRun({ text: "Place", bold: true, size: 20, font: 'Calibri' }),
                            new TextRun({ text: " : ", size: 20, font: 'Calibri' }),
                            new TextRun({ text: resumeData.declaration.place, size: 20, font: 'Calibri' }),
                          ],
                        }),
                      ] : []),
                    ],
                  }),
                  new TableCell({
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      ...(resumeData.declaration.signature ? [
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [
                            new TextRun({
                              text: resumeData.declaration.signature,
                              bold: true,
                              size: 20,
                              font: 'Calibri',
                            }),
                          ],
                        }),
                        new Paragraph({
                          alignment: AlignmentType.RIGHT,
                          children: [
                            new TextRun({
                              text: "Signature",
                              size: 16,
                              font: 'Calibri',
                            }),
                          ],
                        }),
                      ] : []),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ] : []),
      ],
    }],
  });

  try {
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resumeData.personalInfo.name || 'Resume'}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error creating DOCX:', error);
    throw error;
  }
};

export const downloadResumeAsPdf = (resumeData: ResumeData) => {
  // For PDF, we'll use the browser's print functionality to save as PDF
  const htmlContent = generateResumeHTML(resumeData);
  
  // Create a new window with the resume content
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${resumeData.personalInfo.name || 'Resume'}</title>
          <style>
            body { 
              font-family: Calibri, Arial, sans-serif; 
              line-height: 1.4; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px;
              color: #000;
            }
            h1 { 
              color: #000; 
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 5px;
              text-align: left;
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: flex-start; 
              margin-bottom: 20px;
              padding-bottom: 10px;
            }
            .contact-info { 
              text-align: left; 
              margin-bottom: 10px; 
              color: #000;
              font-size: 14px;
            }
            .microsoft-logo {
              width: 32px;
              height: auto;
              text-align: center;
              font-size: 12px;
              padding: 5px;
            }
            .green-header {
              background-color: #c5e1c5;
              padding: 8px;
              margin: 15px 0 10px 0;
              font-weight: bold;
              font-size: 14px;
              text-transform: uppercase;
            }
            h2 { 
              color: #000; 
              font-size: 16px;
              font-weight: bold;
              border-bottom: 1px solid #000;
              padding-bottom: 5px; 
              margin: 20px 0 10px 0;
            }
            .contact-info { 
              text-align: center; 
              margin-bottom: 20px; 
              color: #6b7280;
            }
            .section { 
              margin-bottom: 20px; 
            }
              ul {
                list-style-type: none;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    
    // Automatically trigger print dialog after a short delay
    setTimeout(() => {
      printWindow.print();
      // Close the window after printing
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    }, 500);
  }
};

const generateResumeHTML = (data: ResumeData): string => {
  return `
    <div>
      <div class="header">
        <div>
          <h1>Name: ${data.personalInfo.name || 'Your Name'}</h1>
          <div class="contact-info">
            ${data.personalInfo.email ? `Email: ${data.personalInfo.email}` : ''}
            ${data.personalInfo.phone ? `<br>Mobile: ${data.personalInfo.phone}` : ''}
            ${data.personalInfo.location ? `<br>Location: ${data.personalInfo.location}`: ''}
          </div>
        </div>
        <div class="microsoft-logo">
          <img src="${mcpLogo}" alt="Microsoft Certified Professional" style="width: 32px; height: auto;">
        </div>
      </div>

      ${data.personalInfo.objective ? `
        <div class="green-header">OBJECTIVE:</div>
        <p style="margin: 10px 0; font-size: 14px; line-height: 1.5;">${data.personalInfo.objective}</p>
      ` : ''}

      ${data.profileSummary.length > 0 ? `
        <div class="green-header">PROFILE SUMMARY:</div>
        <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px; line-height: 1.5; list-style-type: none;">
          ${data.profileSummary.map(point => `<li style="margin: 5px; list-style-type: none;">• ${point}</li>`).join('')}
        </ul>
      ` : ''}

      ${data.academicProfile ? `
        <div class="green-header">ACADEMIC PROFILE:</div>
        <p style="margin: 10px 0; font-size: 14px; line-height: 1.5;">${data.academicProfile}</p>
      ` : ''}

      ${data.certifications.length > 0 && data.certifications.some(cert => cert.name) ? `
        <div class="green-header">CERTIFICATIONS:</div>
        <div style="margin: 10px 0;">
          ${data.certifications.filter(cert => cert.name).map(cert => `
            <div style="margin: 8px 0; font-size: 14px;">
              <div style="font-weight: bold;">${cert.name}</div>
              <div style="color: #666;">${cert.issuer}${cert.year ? ` | ${cert.year}` : ''}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${Object.values(data.technicalSkills).some(skill => skill) ? `
        <div class="green-header">TECHNICAL SKILLS:</div>
        <div style="margin: 10px 0; font-size: 14px; line-height: 1.5;">
          ${data.technicalSkills.operatingSystem ? `<p style="margin: 5px 0;"><strong>Operating System :</strong> ${data.technicalSkills.operatingSystem}</p>` : ''}
          ${data.technicalSkills.cloudPlatform ? `<p style="margin: 5px 0;"><strong>Cloud Platform :</strong> ${data.technicalSkills.cloudPlatform}</p>` : ''}
          ${data.technicalSkills.orchestration ? `<p style="margin: 5px 0;"><strong>Orchestration :</strong> ${data.technicalSkills.orchestration}</p>` : ''}
          ${data.technicalSkills.ticketingTools ? `<p style="margin: 5px 0;"><strong>Ticketing Tools :</strong> ${data.technicalSkills.ticketingTools}</p>` : ''}
          ${data.technicalSkills.cicd ? `<p style="margin: 5px 0;"><strong>CI/CD :</strong> ${data.technicalSkills.cicd}</p>` : ''}
          ${data.technicalSkills.iaac ? `<p style="margin: 5px 0;"><strong>IaaS :</strong> ${data.technicalSkills.iaac}</p>` : ''}
          ${data.technicalSkills.versionControl ? `<p style="margin: 5px 0;"><strong>Version Control :</strong> ${data.technicalSkills.versionControl}</p>` : ''}
          ${data.technicalSkills.scripting ? `<p style="margin: 5px 0;"><strong>Scripting :</strong> ${data.technicalSkills.scripting}</p>` : ''}
        </div>
      ` : ''}

      ${(data.workExperience.position || data.workExperience.company) ? `
        <div class="green-header">WORK EXPERIENCE:</div>
        <div style="margin: 10px 0; font-size: 14px; line-height: 1.5;">
          <div>Working as ${data.workExperience.position || ''} in ${data.workExperience.company || ''}${data.workExperience.location ? `, ${data.workExperience.location}` : ''}${data.workExperience.duration ? ` from ${data.workExperience.duration}` : ''}.</div>
        </div>
      ` : ''}

      ${data.professionalExperience.length > 0 && data.professionalExperience.some(exp => exp.projectName) ? `
        <div class="green-header">PROFESSIONAL EXPERIENCE:</div>
        <div style="margin: 10px 0; font-size: 14px; line-height: 1.5;">
          ${data.professionalExperience.filter(exp => exp.projectName).map(exp => `
            <div style="margin: 15px 0; padding-bottom: 10px;">
              <div style="font-weight: bold; font-size: 16px;">Project: ${exp.projectName}</div>
              ${exp.client ? `<p style="margin: 5px 0;"><strong>Client :</strong> ${exp.client}</p>` : ''}
              ${exp.role ? `<p style="margin: 5px 0;"><strong>Role :</strong> ${exp.role}</p>` : ''}
              ${exp.designation ? `<p style="margin: 5px 0;"><strong>Designation :</strong> ${exp.designation}</p>` : ''}
              ${exp.duration ? `<p style="margin: 5px 0;"><strong>Duration :</strong> ${exp.duration}</p>` : ''}
              ${exp.rolesResponsibilities.length > 0 ? `
                <div style="margin-top: 8px;">
                  <strong>Roles & Responsibilities:</strong>
                  <ul style="margin: 5px 0; padding-left: 20px;">
                    ${exp.rolesResponsibilities.map(responsibility => `<li style="margin: 3px 0;">${responsibility}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${data.strengths.length > 0 ? `
        <div class="green-header">KEY STRENGTHS:</div>
        <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
          ${data.strengths.map(strength => `<li style="margin: 5px 0;">${strength}</li>`).join('')}
        </ul>
      ` : ''}

      ${Object.values(data.personalProfile).some(value => value) ? `
        <div class="green-header">PERSONAL PROFILE:</div>
        <div style="margin: 10px 0; font-size: 14px; line-height: 1.5;">
        

          ${data.personalInfo.name ? `<p style="margin: 5px 0;"><strong>Name :</strong> ${data.personalInfo.name}</p>` : ''}
          ${data.personalProfile.fatherName ? `<p style="margin: 5px 0;"><strong>Father's Name :</strong> ${data.personalProfile.fatherName}</p>` : ''}
          ${data.personalProfile.dob ? `<p style="margin: 5px 0;"><strong>Date of Birth :</strong> ${data.personalProfile.dob}</p>` : ''}
          ${data.personalProfile.nationality ? `<p style="margin: 5px 0;"><strong>Nationality :</strong> ${data.personalProfile.nationality}</p>` : ''}
          ${data.personalProfile.languages ? `<p style="margin: 5px 0;"><strong>Languages :</strong> ${data.personalProfile.languages}</p>` : ''}
          ${data.personalProfile.maritalStatus ? `<p style="margin: 5px 0;"><strong>Marital Status :</strong> ${data.personalProfile.maritalStatus}</p>` : ''}
        </div>
      ` : ''}

      ${(data.declaration.text || data.declaration.date || data.declaration.place) ? `
        <div class="green-header">DECLARATION:</div>
        <div style="margin: 10px 0; font-size: 14px; line-height: 1.5;">
          ${data.declaration.text ? `<p style="margin: 10px 0;">${data.declaration.text}</p>` : ''}
          <div style="display: flex; justify-content: space-between; margin-top: 20px;">
            <div>
              ${data.declaration.date ? `<p style="margin: 5px 0;"><strong>Date :</strong> ${data.declaration.date}</p>` : ''}
              ${data.declaration.place ? `<p style="margin: 5px 0;"><strong>Place :</strong> ${data.declaration.place}</p>` : ''}
            </div>
            ${data.declaration.signature ? `
              <div style="text-align: right;">
                <p style="font-size: 12px; color: #666; margin: 5px 0;">Signature</p>
                <p style="margin: 5px 0;"><strong>${data.declaration.signature}</strong></p>

              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}
    </div>
  `;
};
