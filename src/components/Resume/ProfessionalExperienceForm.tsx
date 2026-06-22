import { useState } from "react";
import { Button } from "@/components/Resume/ui/button";
import { Input } from "@/components/Resume/ui/input";
import { Label } from "@/components/Resume/ui/label";
import { Textarea } from "@/components/Resume/ui/textarea";
import { Plus, X, Trash2 } from "lucide-react";

interface ProfessionalExperienceFormProps {
  data: Array<{
    id: string;
    projectName: string;
    client: string;
    role: string;
    designation: string;
    duration: string;
    rolesResponsibilities: string[];
  }>;
  onChange: (projects: any[]) => void;
}

const ProfessionalExperienceForm = ({ data, onChange }: ProfessionalExperienceFormProps) => {
  const [newResponsibility, setNewResponsibility] = useState<Record<string, string>>({});

  const addProject = () => {
    onChange([
      ...data,
      {
        id: Date.now().toString(),
        projectName: "",
        client: "",
        role: "",
        designation: "",
        duration: "",
        rolesResponsibilities: []
      }
    ]);
  };

  const removeProject = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updateProject = (index: number, field: string, value: any) => {
    const updated = [...data];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const addResponsibility = (projectIndex: number) => {
    const responsibility = newResponsibility[projectIndex];
    if (responsibility?.trim()) {
      const updated = [...data];
      updated[projectIndex].rolesResponsibilities.push(responsibility.trim());
      updateProject(projectIndex, 'rolesResponsibilities', updated[projectIndex].rolesResponsibilities);
      setNewResponsibility(prev => ({ ...prev, [projectIndex]: "" }));
    }
  };

  const removeResponsibility = (projectIndex: number, responsibilityIndex: number) => {
    const updated = [...data];
    updated[projectIndex].rolesResponsibilities = updated[projectIndex].rolesResponsibilities.filter((_, i) => i !== responsibilityIndex);
    onChange(updated);
  };

  return (
    <div className="space-y-6">
      {data.map((project, index) => (
        <div key={project.id} className="p-4 border rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-semibold">Project {index + 1}</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removeProject(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Project Name</Label>
              <Input
                value={project.projectName}
                onChange={(e) => updateProject(index, 'projectName', e.target.value)}
                placeholder="BAJAJ FINSERV"
              />
            </div>
            
            <div>
              <Label>Client</Label>
              <Input
                value={project.client}
                onChange={(e) => updateProject(index, 'client', e.target.value)}
                placeholder="BAJAJ FINSERV"
              />
            </div>
            
            <div>
              <Label>Role</Label>
              <Input
                value={project.role}
                onChange={(e) => updateProject(index, 'role', e.target.value)}
                placeholder="Senior Azure Cloud Engineer"
              />
            </div>
            
            <div>
              <Label>Designation</Label>
              <Input
                value={project.designation}
                onChange={(e) => updateProject(index, 'designation', e.target.value)}
                placeholder="Senior associate"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label>Duration</Label>
              <Input
                value={project.duration}
                onChange={(e) => updateProject(index, 'duration', e.target.value)}
                placeholder="July 2021 to till now"
              />
            </div>
          </div>
          
          <div>
            <Label>Roles & Responsibilities</Label>
            <div className="space-y-2 mt-2">
              {project.rolesResponsibilities.map((responsibility, respIndex) => (
                <div key={respIndex} className="flex gap-2">
                  <Textarea
                    value={responsibility}
                    onChange={(e) => {
                      const updated = [...project.rolesResponsibilities];
                      updated[respIndex] = e.target.value;
                      updateProject(index, 'rolesResponsibilities', updated);
                    }}
                    className="flex-1"
                    rows={2}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeResponsibility(index, respIndex)}
                    className="shrink-0 mt-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              <div className="flex gap-2">
                <Textarea
                  value={newResponsibility[index] || ""}
                  onChange={(e) => setNewResponsibility(prev => ({ ...prev, [index]: e.target.value }))}
                  placeholder="Add new responsibility..."
                  rows={2}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => addResponsibility(index)}
                  className="shrink-0 mt-1"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
      
      <Button
        type="button"
        onClick={addProject}
        className="w-full"
        variant="outline"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Project
      </Button>
    </div>
  );
};

export default ProfessionalExperienceForm;