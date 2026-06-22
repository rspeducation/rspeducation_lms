import { Card, CardContent } from "@/components/Resume/ui/card";
import { Badge } from "@/components/Resume/ui/badge";
import { Mail, Phone, MapPin, Calendar } from "lucide-react";
import { ResumeData } from "@/types/resume";
import microsoftCertified from "@/assets/microsoft-certified.png";

interface ResumePreviewProps {
  data: ResumeData;
}

const ResumePreview = ({ data }: ResumePreviewProps) => {
  return (
    <Card className="max-w-4xl mx-auto bg-white shadow-2xl">
      <CardContent className="p-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="mb-4">
              <div className="text-lg font-bold text-black">Name: <span className="font-normal">{data.personalInfo.name || "Your Name"}</span></div>
              <div className="text-lg font-bold text-black">Email: <span className="font-normal">{data.personalInfo.email || "your.email@example.com"}</span></div>
              <div className="text-lg font-bold text-black">Mobile: <span className="font-normal">{data.personalInfo.phone || "Your Phone"}</span></div>
              <div className="text-lg font-bold text-black">Location: <span className="font-normal">{data.personalInfo.location || "Your Phone"}</span></div>
            </div>
          </div>
          <div className="flex-shrink-0">
            <img src={microsoftCertified} alt="Microsoft Certified Professional" className="w-32 h-auto" />
          </div>
        </div>

        {/* Objective */}
        {data.personalInfo.objective && (
          <div className="mb-6">
            <div className="bg-green-100 border border-black p-2 mb-2">
              <h2 className="text-lg font-bold text-black uppercase">OBJECTIVE:</h2>
            </div>
            <p className="text-black leading-relaxed text-base">
              {data.personalInfo.objective}
            </p>
          </div>
        )}

        {/* Profile Summary */}
        {data.profileSummary.length > 0 && (
          <div className="mb-6">
            <div className="bg-green-100 border border-black p-2 mb-2">
              <h2 className="text-lg font-bold text-black uppercase">PROFILE SUMMARY:</h2>
            </div>
            <ul className="space-y-1 text-black text-base">
              {data.profileSummary.map((point, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Academic Profile */}
        {data.academicProfile && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
              Academic Profile
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {data.academicProfile}
            </p>
          </div>
        )}

        {/* Certifications */}
        {data.certifications.length > 0 && data.certifications.some(cert => cert.name) && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
              Certifications
            </h2>
            <div className="space-y-2">
              {data.certifications.filter(cert => cert.name).map((cert) => (
                <div key={cert.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {cert.name}
                    </h3>
                    {cert.issuer && (
                      <p className="text-gray-700">{cert.issuer}</p>
                    )}
                  </div>
                  {cert.year && (
                    <div className="text-gray-600 mt-1 sm:mt-0">
                      {cert.year}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Technical Skills */}
        {Object.values(data.technicalSkills).some(skill => skill) && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3 border-b border-gray-300 pb-1">
              Technical Skills
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.technicalSkills.operatingSystem && (
                <div>
                  <h3 className="font-semibold text-gray-800">Operating System:</h3>
                  <p className="text-gray-700">{data.technicalSkills.operatingSystem}</p>
                </div>
              )}
              {data.technicalSkills.cloudPlatform && (
                <div>
                  <h3 className="font-semibold text-gray-800">Cloud Platform:</h3>
                  <p className="text-gray-700">{data.technicalSkills.cloudPlatform}</p>
                </div>
              )}
              {data.technicalSkills.orchestration && (
                <div>
                  <h3 className="font-semibold text-gray-800">Orchestration:</h3>
                  <p className="text-gray-700">{data.technicalSkills.orchestration}</p>
                </div>
              )}
              {data.technicalSkills.ticketingTools && (
                <div>
                  <h3 className="font-semibold text-gray-800">Ticketing Tools:</h3>
                  <p className="text-gray-700">{data.technicalSkills.ticketingTools}</p>
                </div>
              )}
              {data.technicalSkills.cicd && (
                <div>
                  <h3 className="font-semibold text-gray-800">CI/CD:</h3>
                  <p className="text-gray-700">{data.technicalSkills.cicd}</p>
                </div>
              )}
              {data.technicalSkills.iaac && (
                <div>
                  <h3 className="font-semibold text-gray-800">IaaC:</h3>
                  <p className="text-gray-700">{data.technicalSkills.iaac}</p>
                </div>
              )}
              {data.technicalSkills.versionControl && (
                <div>
                  <h3 className="font-semibold text-gray-800">Version Control:</h3>
                  <p className="text-gray-700">{data.technicalSkills.versionControl}</p>
                </div>
              )}
              {data.technicalSkills.scripting && (
                <div>
                  <h3 className="font-semibold text-gray-800">Scripting:</h3>
                  <p className="text-gray-700">{data.technicalSkills.scripting}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Work Experience */}
        {(data.workExperience.position || data.workExperience.company) && (
          <div className="mb-6">
            <div className="bg-green-100 border border-black p-2 mb-2">
              <h2 className="text-lg font-bold text-black uppercase">WORK EXPERIENCE:</h2>
            </div>
            <p className="text-black text-base">
              Working as <strong>{data.workExperience.position}</strong> in <strong>{data.workExperience.company}</strong>
              {data.workExperience.location && `, ${data.workExperience.location}`}
              {data.workExperience.duration && ` from ${data.workExperience.duration}`}.
            </p>
          </div>
        )}

        {/* Professional Experience */}
        {data.professionalExperience.length > 0 && data.professionalExperience.some(exp => exp.projectName) && (
          <div className="mb-6">
            <div className="bg-green-100 border border-black p-2 mb-2">
              <h2 className="text-lg font-bold text-black uppercase">PROFESSIONALEXPERIENCE:</h2>
            </div>
            <div className="space-y-6">
              {data.professionalExperience.filter(exp => exp.projectName).map((exp) => (
                <div key={exp.id}>
                  <div className="text-black text-base space-y-1">
                    <p><em>Project (present)</em> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{exp.projectName}</strong></p>
                    {exp.client && <p><em>Client</em> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <strong>{exp.client}</strong></p>}
                    {exp.role && <p><em>Role</em> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <em>{exp.role}</em></p>}
                    {exp.designation && <p><em>Designation</em> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <em>{exp.designation}</em></p>}
                    {exp.duration && <p><em>Duration</em> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <em>{exp.duration}</em></p>}
                  </div>
                  {exp.rolesResponsibilities.length > 0 && (
                    <div className="mt-3">
                      <p className="font-bold text-black text-base mb-2 underline">Roles & Responsibilities:</p>
                      <ul className="space-y-1 text-black text-base">
                        {exp.rolesResponsibilities.map((responsibility, index) => (
                          <li key={index} className="flex items-start">
                            <span className="mr-2">✓</span>
                            <span>{responsibility}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {data.strengths.length > 0 && (
          <div className="mb-6">
            <div className="bg-green-100 border border-black p-2 mb-2">
              <h2 className="text-lg font-bold text-black uppercase">STRENGTHS:</h2>
            </div>
            <ul className="space-y-1 text-black text-base">
              {data.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Personal Profile */}
        {Object.values(data.personalProfile).some(value => value) && (
          <div className="mb-6">
            <div className="bg-green-100 border border-black p-2 mb-2">
              <h2 className="text-lg font-bold text-black uppercase">PERSONAL PROFILE:</h2>
            </div>
            <div className="space-y-1 text-black text-base">
              <p>
                <span className="font-normal">Name</span>
                <span className="ml-20">: {data.personalInfo.name}</span>
              </p>
              {data.personalProfile.fatherName && (
                <p>
                  <span className="font-normal">FatherName</span>
                  <span className="ml-9">: {data.personalProfile.fatherName}</span>
                </p>
              )}
              {data.personalProfile.dob && (
                <p>
                  <span className="font-normal">Date of Birth</span>
                  <span className="ml-8">: {data.personalProfile.dob}</span>
                </p>
              )}
              {data.personalProfile.nationality && (
                <p>
                  <span className="font-normal">Nationality</span>
                  <span className="ml-11">: {data.personalProfile.nationality}</span>
                </p>
              )}
              {data.personalProfile.languages && (
                <p>
                  <span className="font-normal">Languages</span>
                  <span className="ml-11">: {data.personalProfile.languages}</span>
                </p>
              )}
              {data.personalProfile.maritalStatus && (
                <p>
                  <span className="font-normal">Marital Status</span>
                  <span className="ml-6">: {data.personalProfile.maritalStatus}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Declaration */}
        {(data.declaration.text || data.declaration.date || data.declaration.place) && (
          <div className="mb-6">
            <p className="font-bold text-black text-base mb-4 underline">Declaration:</p>
            {data.declaration.text && (
              <p className="text-black text-base mb-4 ml-8">{data.declaration.text}</p>
            )}
            <div className="flex justify-between items-end mt-12">
              <div>
                {data.declaration.date && (
                  <p className="text-black text-base">
                    <strong>Date:</strong> {data.declaration.date}
                  </p>
                )}
                {data.declaration.place && (
                  <p className="text-black text-base">
                    <strong>Place:</strong> {data.declaration.place}
                  </p>
                )}
              </div>
              {data.declaration.signature && (
                <div className="text-right">
                  <p className="text-black text-base">Signature</p>
                  <p className="text-black font-semibold text-base">{data.declaration.signature}</p>

                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ResumePreview;