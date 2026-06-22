import { ResumeData } from '@/types/resume';
import mcpLogo from '@/assets/microsoft-certified.png';
import { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType, BorderStyle, AlignmentType, ShadingType } from 'docx';

// Utility to fetch a local image as arrayBuffer
const fetchImageArrayBuffer = async (url: string): Promise<ArrayBuffer> => {
  const res = await fetch(url);
  return res.arrayBuffer();
};

export const downloadResumeAsDocx = async (resumeData: ResumeData): Promise<Blob | undefined> => {
  // Use this utility for section headers (green fill, bigger, with top/bottom padding)
  const sectionHeader = (text: string) => new Paragraph({
    children: [
      new TextRun({ text, bold: true, font: "Calibri", size: 28 }),
    ],
    alignment: AlignmentType.LEFT,
    shading: { type: ShadingType.CLEAR, color: "auto", fill: "C5E1C5" },
    spacing: { before: 180, after: 180 }, // Adds padding above and below the green bar
  });

  // Load MCP logo as buffer
  const logoBuffer = await fetchImageArrayBuffer(mcpLogo);
  const logoBytes = new Uint8Array(logoBuffer);

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Header: Table for Name/contact left, logo right
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.NONE },
            bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE },
            insideHorizontal: { style: BorderStyle.NONE },
            insideVertical: { style: BorderStyle.NONE }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 70, type: WidthType.PERCENTAGE },
                  borders: {},
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ text: `Name: ${resumeData.personalInfo.name || ""}`, bold: true, font: "Calibri", size: 26 }),
                      ],
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: `Email: ${resumeData.personalInfo.email || ""}`, font: "Calibri", size: 22 }),
                      ]
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: `Mobile: ${resumeData.personalInfo.phone || ""}`, font: "Calibri", size: 22 }),
                      ]
                    }),
                    new Paragraph({
                      children: [
                        new TextRun({ text: `Location: ${resumeData.personalInfo.location || ""}`, font: "Calibri", size: 22 }),
                      ]
                    }),
                  ],
                }),
                new TableCell({
                  width: { size: 30, type: WidthType.PERCENTAGE },
                  borders: {},
                  children: [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      children: [
                        new ImageRun(({ data: logoBuffer, transformation: { width: 100, height: 80 } } as any)),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // OBJECTIVE section
        ...(resumeData.personalInfo.objective ? [
          sectionHeader("OBJECTIVE:"),
          new Paragraph({ children: [ new TextRun({ text: resumeData.personalInfo.objective, font: "Calibri", size: 22 }) ] }),
        ] : []),

        // PROFILE SUMMARY
        ...(resumeData.profileSummary?.length ? [
          sectionHeader("PROFILE SUMMARY:"),
          ...resumeData.profileSummary.map(point =>
            new Paragraph({
              children: [new TextRun({ text: `• ${point}`, font: "Calibri", size: 22 })]
            })
          )
        ] : []),

        // ACADEMIC PROFILE
        ...(resumeData.academicProfile ? [
          sectionHeader("ACADEMIC PROFILE:"),
          new Paragraph({ children: [ new TextRun({ text: resumeData.academicProfile, font: "Calibri", size: 22 }) ] }),
        ] : []),

        // CERTIFICATIONS
        ...(resumeData.certifications?.length ? [
          sectionHeader("CERTIFICATIONS:"),
          ...resumeData.certifications.filter(cert => cert.name).map(cert =>
            new Paragraph({
              children: [
                new TextRun({ text: cert.name, bold: true, font: "Calibri", size: 22 }),
                new TextRun({ text: ` | ${cert.issuer}${cert.year ? ` | ${cert.year}` : ""}`, font: "Calibri", size: 22 })
              ]
            })
          ),
        ] : []),

        // TECHNICAL SKILLS
        ...(Object.values(resumeData.technicalSkills ?? {}).some(Boolean) ? [
          sectionHeader("TECHNICAL SKILLS:"),
          ...Object.entries(resumeData.technicalSkills).filter(([_, v]) => v).map(
            ([key, value]) => new Paragraph({
              children: [
                new TextRun({ text: `${key.replace(/([A-Z])/g, " $1")}: `, bold: true, font: "Calibri", size: 22 }),
                new TextRun({ text: value as string, font: "Calibri", size: 22 })
              ]
            })
          ),
        ] : []),

        // WORK EXPERIENCE
        ...((resumeData.workExperience?.position || resumeData.workExperience?.company) ? [
          sectionHeader("WORK EXPERIENCE:"),
          new Paragraph({ children: [ new TextRun({ text: `Working as ${resumeData.workExperience.position || ""} in ${resumeData.workExperience.company || ""}${resumeData.workExperience.location ? `, ${resumeData.workExperience.location}` : ""}${resumeData.workExperience.duration ? ` from ${resumeData.workExperience.duration}` : ""}.`, font: "Calibri", size: 22 }) ] }),
        ] : []),

        // PROFESSIONAL EXPERIENCE
        ...(resumeData.professionalExperience?.length ? [
          sectionHeader("PROFESSIONAL EXPERIENCE:"),
          ...resumeData.professionalExperience.filter(exp => exp.projectName).flatMap(exp => [
            new Paragraph({
              children: [
                new TextRun({ text: "Project: ", bold: true, font: "Calibri", size: 22 }),
                new TextRun({ text: exp.projectName, font: "Calibri", size: 22 }),
              ]
            }),
            ...(exp.client ? [
              new Paragraph({
                children: [
                  new TextRun({ text: "Client: ", bold: true, font: "Calibri", size: 22 }),
                  new TextRun({ text: exp.client, font: "Calibri", size: 22 }),
                ]
              })
            ] : []),
            ...(exp.role ? [
              new Paragraph({
                children: [
                  new TextRun({ text: "Role: ", bold: true, font: "Calibri", size: 22 }),
                  new TextRun({ text: exp.role, font: "Calibri", size: 22 }),
                ]
              })
            ] : []),
            ...(exp.designation ? [
              new Paragraph({
                children: [
                  new TextRun({ text: "Designation: ", bold: true, font: "Calibri", size: 22 }),
                  new TextRun({ text: exp.designation, font: "Calibri", size: 22 }),
                ]
              })
            ] : []),
            ...(exp.duration ? [
              new Paragraph({
                children: [
                  new TextRun({ text: "Duration: ", bold: true, font: "Calibri", size: 22 }),
                  new TextRun({ text: exp.duration, font: "Calibri", size: 22 }),
                ]
              })
            ] : []),
            ...(exp.rolesResponsibilities?.length ? [
              new Paragraph({
                children: [new TextRun({ text: "Roles & Responsibilities:", bold: true, font: "Calibri", size: 22 })]
              }),
              ...exp.rolesResponsibilities.map(responsibility =>
                new Paragraph({
                  children: [new TextRun({ text: `• ${responsibility}`, font: "Calibri", size: 22 })]
                })
              )
            ] : [])
          ]),
        ] : []),

        // KEY STRENGTHS
        ...(resumeData.strengths?.length ? [
          sectionHeader("KEY STRENGTHS:"),
          ...resumeData.strengths.map(
            s => new Paragraph({ children: [new TextRun({ text: `• ${s}`, font: "Calibri", size: 22 })] })
          )
        ] : []),

        // PERSONAL PROFILE
        ...(resumeData.personalProfile && Object.values(resumeData.personalProfile).some(Boolean) ? [
          sectionHeader("PERSONAL PROFILE:"),
          ...(resumeData.personalProfile.fatherName ? [
            new Paragraph({
              children: [
                new TextRun({ text: "Father Name: ", bold: true, font: "Calibri", size: 22 }),
                new TextRun({ text: resumeData.personalProfile.fatherName, font: "Calibri", size: 22 }),
              ]
            })
          ] : []),
          ...(resumeData.personalProfile.dob ? [
            new Paragraph({
              children: [
                new TextRun({ text: "Date of Birth: ", bold: true, font: "Calibri", size: 22 }),
                new TextRun({ text: resumeData.personalProfile.dob, font: "Calibri", size: 22 }),
              ]
            })
          ] : []),
          ...(resumeData.personalProfile.nationality ? [
            new Paragraph({
              children: [
                new TextRun({ text: "Nationality: ", bold: true, font: "Calibri", size: 22 }),
                new TextRun({ text: resumeData.personalProfile.nationality, font: "Calibri", size: 22 }),
              ]
            })
          ] : []),
          ...(resumeData.personalProfile.languages ? [
            new Paragraph({
              children: [
                new TextRun({ text: "Languages: ", bold: true, font: "Calibri", size: 22 }),
                new TextRun({ text: resumeData.personalProfile.languages, font: "Calibri", size: 22 }),
              ]
            })
          ] : []),
          ...(resumeData.personalProfile.maritalStatus ? [
            new Paragraph({
              children: [
                new TextRun({ text: "Marital Status: ", bold: true, font: "Calibri", size: 22 }),
                new TextRun({ text: resumeData.personalProfile.maritalStatus, font: "Calibri", size: 22 }),
              ]
            })
          ] : []),
        ] : []),

        // DECLARATION
        ...(resumeData.declaration?.text ? [
          sectionHeader("DECLARATION:"),
          new Paragraph({ children: [ new TextRun({ text: resumeData.declaration.text, font: "Calibri", size: 22 }) ] }),
          ...(resumeData.declaration.date || resumeData.declaration.place ? [
            new Paragraph({
              children: [
                ...(resumeData.declaration.date ? [
                  new TextRun({ text: `Date: ${resumeData.declaration.date}     `, font: "Calibri", size: 20 })
                ] : []),
                ...(resumeData.declaration.place ? [
                  new TextRun({ text: `Place: ${resumeData.declaration.place}`, font: "Calibri", size: 20 })
                ] : []),
              ]
            })
          ] : [])
        ] : [])
      ]
    }]
  });

  try {
    const blob = await Packer.toBlob(doc);
    // Immediate download in browser
    if (typeof window !== "undefined" && window.navigator && window.document) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resumeData.personalInfo.name || "Resume"}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    return blob;
  } catch (e) {
    console.error("Error creating DOCX:", e);
    return undefined;
  }
};



// export const downloadResumeAsPdf = (resumeData: ResumeData) => {
//   // For PDF, we'll use the browser's print functionality to save as PDF
//   const htmlContent = generateResumeHTML(resumeData);
  
//   // Create a new window with the resume content
//   const printWindow = window.open('', '_blank');
//   if (printWindow) {
//     printWindow.document.write(`
//       <!DOCTYPE html>
//       <html>
//         <head>
//           <title>${resumeData.personalInfo.name || 'Resume'}</title>
//           <style>
//             body { 
//               font-family: Calibri, Arial, sans-serif; 
//               line-height: 1.4; 
//               max-width: 800px; 
//               margin: 0 auto; 
//               padding: 20px;
//               color: #000;
//             }
//             h1 { 
//               color: #000; 
//               font-size: 18px;
//               font-weight: bold;
//               margin-bottom: 5px;
//               text-align: left;
//             }
//             .header { 
//               display: flex; 
//               justify-content: space-between; 
//               align-items: flex-start; 
//               margin-bottom: 20px;
//               padding-bottom: 10px;
//             }
//             .contact-info { 
//               text-align: left; 
//               margin-bottom: 10px; 
//               color: #000;
//               font-size: 14px;
//             }
//             .microsoft-logo {
//               width: 32px;
//               height: auto;
//               text-align: center;
//               font-size: 12px;
//               padding: 5px;
//             }
//             .green-header {
//               background-color: #c5e1c5;
//               padding: 8px;
//               margin: 15px 0 10px 0;
//               font-weight: bold;
//               font-size: 14px;
//               text-transform: uppercase;
//             }
//             h2 { 
//               color: #000; 
//               font-size: 16px;
//               font-weight: bold;
//               border-bottom: 1px solid #000;
//               padding-bottom: 5px; 
//               margin: 20px 0 10px 0;
//             }
//             .contact-info { 
//               text-align: center; 
//               margin-bottom: 20px; 
//               color: #6b7280;
//             }
//             .section { 
//               margin-bottom: 20px; 
//             }
//               ul {
//                 list-style-type: none;
//             }
//             @media print {
//               body { margin: 0; padding: 15px; }
//               .no-print { display: none; }
//             }
//           </style>
//         </head>
//         <body>
//           ${htmlContent}
//         </body>
//       </html>
//     `);
//     printWindow.document.close();
    
//     // Automatically trigger print dialog after a short delay
//     setTimeout(() => {
//       printWindow.print();
//       // Close the window after printing
//       setTimeout(() => {
//         printWindow.close();
//       }, 1000);
//     }, 500);
//   }
// };


// const generateResumeHTML = (data: ResumeData): string => {
//   return `
//     <div>
//       <div class="header">
//         <div>
//           <h1>Name: ${data.personalInfo.name || 'Your Name'}</h1>
//           <div class="contact-info">
//             ${data.personalInfo.email ? `Email: ${data.personalInfo.email}` : ''}
//             ${data.personalInfo.phone ? `<br>Mobile: ${data.personalInfo.phone}` : ''}
//             ${data.personalInfo.location ? `<br>Location: ${data.personalInfo.location}`: ''}
//           </div>
//         </div>
//         <div class="microsoft-logo">
//           <img src="${mcpLogo}" alt="Microsoft Certified Professional" style="width: 32px; height: auto;">
//         </div>
//       </div>

//       ${data.personalInfo.objective ? `
//         <div class="green-header">OBJECTIVE:</div>
//         <p style="margin: 10px 0; font-size: 14px; line-height: 1.5;">${data.personalInfo.objective}</p>
//       ` : ''}

//       ${data.profileSummary.length > 0 ? `
//         <div class="green-header">PROFILE SUMMARY:</div>
//         <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px; line-height: 1.5; list-style-type: none;">
//           ${data.profileSummary.map(point => `<li style="margin: 5px; list-style-type: none;">• ${point}</li>`).join('')}
//         </ul>
//       ` : ''}

//       ${data.academicProfile ? `
//         <div class="green-header">ACADEMIC PROFILE:</div>
//         <p style="margin: 10px 0; font-size: 14px; line-height: 1.5;">${data.academicProfile}</p>
//       ` : ''}

//       ${data.certifications.length > 0 && data.certifications.some(cert => cert.name) ? `
//         <div class="green-header">CERTIFICATIONS:</div>
//         <div style="margin: 10px 0;">
//           ${data.certifications.filter(cert => cert.name).map(cert => `
//             <div style="margin: 8px 0; font-size: 14px;">
//               <div style="font-weight: bold;">${cert.name}</div>
//               <div style="color: #666;">${cert.issuer}${cert.year ? ` | ${cert.year}` : ''}</div>
//             </div>
//           `).join('')}
//         </div>
//       ` : ''}

//       ${Object.values(data.technicalSkills).some(skill => skill) ? `
//         <div class="green-header">TECHNICAL SKILLS:</div>
//         <div style="margin: 10px 0; font-size: 14px; line-height: 1.5;">
//           ${data.technicalSkills.operatingSystem ? `<p style="margin: 5px 0;"><strong>Operating System :</strong> ${data.technicalSkills.operatingSystem}</p>` : ''}
//           ${data.technicalSkills.cloudPlatform ? `<p style="margin: 5px 0;"><strong>Cloud Platform :</strong> ${data.technicalSkills.cloudPlatform}</p>` : ''}
//           ${data.technicalSkills.orchestration ? `<p style="margin: 5px 0;"><strong>Orchestration :</strong> ${data.technicalSkills.orchestration}</p>` : ''}
//           ${data.technicalSkills.ticketingTools ? `<p style="margin: 5px 0;"><strong>Ticketing Tools :</strong> ${data.technicalSkills.ticketingTools}</p>` : ''}
//           ${data.technicalSkills.cicd ? `<p style="margin: 5px 0;"><strong>CI/CD :</strong> ${data.technicalSkills.cicd}</p>` : ''}
//           ${data.technicalSkills.iaac ? `<p style="margin: 5px 0;"><strong>IaaS :</strong> ${data.technicalSkills.iaac}</p>` : ''}
//           ${data.technicalSkills.versionControl ? `<p style="margin: 5px 0;"><strong>Version Control :</strong> ${data.technicalSkills.versionControl}</p>` : ''}
//           ${data.technicalSkills.scripting ? `<p style="margin: 5px 0;"><strong>Scripting :</strong> ${data.technicalSkills.scripting}</p>` : ''}
//         </div>
//       ` : ''}

//       ${(data.workExperience.position || data.workExperience.company) ? `
//         <div class="green-header">WORK EXPERIENCE:</div>
//         <div style="margin: 10px 0; font-size: 14px; line-height: 1.5;">
//           <div>Working as ${data.workExperience.position || ''} in ${data.workExperience.company || ''}${data.workExperience.location ? `, ${data.workExperience.location}` : ''}${data.workExperience.duration ? ` from ${data.workExperience.duration}` : ''}.</div>
//         </div>
//       ` : ''}

//       ${data.professionalExperience.length > 0 && data.professionalExperience.some(exp => exp.projectName) ? `
//         <div class="green-header">PROFESSIONAL EXPERIENCE:</div>
//         <div style="margin: 10px 0; font-size: 14px; line-height: 1.5;">
//           ${data.professionalExperience.filter(exp => exp.projectName).map(exp => `
//             <div style="margin: 15px 0; padding-bottom: 10px;">
//               <div style="font-weight: bold; font-size: 16px;">Project: ${exp.projectName}</div>
//               ${exp.client ? `<p style="margin: 5px 0;"><strong>Client :</strong> ${exp.client}</p>` : ''}
//               ${exp.role ? `<p style="margin: 5px 0;"><strong>Role :</strong> ${exp.role}</p>` : ''}
//               ${exp.designation ? `<p style="margin: 5px 0;"><strong>Designation :</strong> ${exp.designation}</p>` : ''}
//               ${exp.duration ? `<p style="margin: 5px 0;"><strong>Duration :</strong> ${exp.duration}</p>` : ''}
//               ${exp.rolesResponsibilities.length > 0 ? `
//                 <div style="margin-top: 8px;">
//                   <strong>Roles & Responsibilities:</strong>
//                   <ul style="margin: 5px 0; padding-left: 20px;">
//                     ${exp.rolesResponsibilities.map(responsibility => `<li style="margin: 3px 0;">${responsibility}</li>`).join('')}
//                   </ul>
//                 </div>
//               ` : ''}
//             </div>
//           `).join('')}
//         </div>
//       ` : ''}

//       ${data.strengths.length > 0 ? `
//         <div class="green-header">KEY STRENGTHS:</div>
//         <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
//           ${data.strengths.map(strength => `<li style="margin: 5px 0;">${strength}</li>`).join('')}
//         </ul>
//       ` : ''}

//       ${Object.values(data.personalProfile).some(value => value) ? `
//         <div class="green-header">PERSONAL PROFILE:</div>
//         <div style="margin: 10px 0; font-size: 14px; line-height: 1.5;">
        

//           ${data.personalInfo.name ? `<p style="margin: 5px 0;"><strong>Name :</strong> ${data.personalInfo.name}</p>` : ''}
//           ${data.personalProfile.fatherName ? `<p style="margin: 5px 0;"><strong>Father's Name :</strong> ${data.personalProfile.fatherName}</p>` : ''}
//           ${data.personalProfile.dob ? `<p style="margin: 5px 0;"><strong>Date of Birth :</strong> ${data.personalProfile.dob}</p>` : ''}
//           ${data.personalProfile.nationality ? `<p style="margin: 5px 0;"><strong>Nationality :</strong> ${data.personalProfile.nationality}</p>` : ''}
//           ${data.personalProfile.languages ? `<p style="margin: 5px 0;"><strong>Languages :</strong> ${data.personalProfile.languages}</p>` : ''}
//           ${data.personalProfile.maritalStatus ? `<p style="margin: 5px 0;"><strong>Marital Status :</strong> ${data.personalProfile.maritalStatus}</p>` : ''}
//         </div>
//       ` : ''}

//       ${(data.declaration.text || data.declaration.date || data.declaration.place) ? `
//         <div class="green-header">DECLARATION:</div>
//         <div style="margin: 10px 0; font-size: 14px; line-height: 1.5;">
//           ${data.declaration.text ? `<p style="margin: 10px 0;">${data.declaration.text}</p>` : ''}
//           <div style="display: flex; justify-content: space-between; margin-top: 20px;">
//             <div>
//               ${data.declaration.date ? `<p style="margin: 5px 0;"><strong>Date :</strong> ${data.declaration.date}</p>` : ''}
//               ${data.declaration.place ? `<p style="margin: 5px 0;"><strong>Place :</strong> ${data.declaration.place}</p>` : ''}
//             </div>
//             ${data.declaration.signature ? `
//               <div style="text-align: right;">
//                 <p style="font-size: 12px; color: #666; margin: 5px 0;">Signature</p>
//                 <p style="margin: 5px 0;"><strong>${data.declaration.signature}</strong></p>

//               </div>
//             ` : ''}
//           </div>
//         </div>
//       ` : ''}
//     </div>
//   `;
// };
