import { Input } from "@/components/Resume/ui/input";
import { Label } from "@/components/Resume/ui/label";

interface AcademicProfileFormProps {
  data: string;
  onChange: (academicProfile: string) => void;
}

const AcademicProfileForm = ({ data, onChange }: AcademicProfileFormProps) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="academic-profile">Academic Qualification</Label>
        <Input
          id="academic-profile"
          value={data}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g., Completed B.com computer application from Acharya Nagarjuna University, Guntur."
        />
      </div>
    </div>
  );
};

export default AcademicProfileForm;