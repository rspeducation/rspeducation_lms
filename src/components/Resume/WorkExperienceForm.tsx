import { Input } from "@/components/Resume/ui/input";
import { Label } from "@/components/Resume/ui/label";

interface WorkExperienceFormProps {
  data: {
    position: string;
    company: string;
    location: string;
    duration: string;
  };
  onChange: (workExperience: any) => void;
}

const WorkExperienceForm = ({ data, onChange }: WorkExperienceFormProps) => {
  const updateField = (field: string, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="work-position">Position</Label>
        <Input
          id="work-position"
          value={data.position}
          onChange={(e) => updateField('position', e.target.value)}
          placeholder="Senior Azure Cloud Operations Engineer"
        />
      </div>
      
      <div>
        <Label htmlFor="work-company">Company</Label>
        <Input
          id="work-company"
          value={data.company}
          onChange={(e) => updateField('company', e.target.value)}
          placeholder="NOVITAS TECHNOLOGIES PRIVATE LIMITED"
        />
      </div>
      
      <div>
        <Label htmlFor="work-location">Location</Label>
        <Input
          id="work-location"
          value={data.location}
          onChange={(e) => updateField('location', e.target.value)}
          placeholder="BENGALORE"
        />
      </div>
      
      <div>
        <Label htmlFor="work-duration">Duration</Label>
        <Input
          id="work-duration"
          value={data.duration}
          onChange={(e) => updateField('duration', e.target.value)}
          placeholder="September 2019 to present"
        />
      </div>
    </div>
  );
};

export default WorkExperienceForm;