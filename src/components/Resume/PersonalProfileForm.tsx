import { Input } from "@/components/Resume/ui/input";
import { Label } from "@/components/Resume/ui/label";

interface PersonalProfileFormProps {
  data: {
    fatherName: string;
    dob: string;
    nationality: string;
    languages: string;
    maritalStatus: string;
  };
  onChange: (personalProfile: any) => void;
}

const PersonalProfileForm = ({ data, onChange }: PersonalProfileFormProps) => {
  const updateField = (field: string, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="father-name">Father Name</Label>
        <Input
          id="father-name"
          value={data.fatherName}
          onChange={(e) => updateField('fatherName', e.target.value)}
          placeholder="G DAVEEDU"
        />
      </div>
      
      <div>
        <Label htmlFor="dob">Date of Birth</Label>
        <Input
          id="dob"
          value={data.dob}
          onChange={(e) => updateField('dob', e.target.value)}
          placeholder="15/09/2000"
        />
      </div>
      
      <div>
        <Label htmlFor="nationality">Nationality</Label>
        <Input
          id="nationality"
          value={data.nationality}
          onChange={(e) => updateField('nationality', e.target.value)}
          placeholder="Indian"
        />
      </div>
      
      <div>
        <Label htmlFor="languages">Languages</Label>
        <Input
          id="languages"
          value={data.languages}
          onChange={(e) => updateField('languages', e.target.value)}
          placeholder="English, Hindi, Telugu"
        />
      </div>
      
      <div>
        <Label htmlFor="marital-status">Marital Status</Label>
        <Input
          id="marital-status"
          value={data.maritalStatus}
          onChange={(e) => updateField('maritalStatus', e.target.value)}
          placeholder="unmarried"
        />
      </div>
    </div>
  );
};

export default PersonalProfileForm;