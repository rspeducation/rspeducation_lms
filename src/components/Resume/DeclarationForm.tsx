import { Input } from "@/components/Resume/ui/input";
import { Label } from "@/components/Resume/ui/label";
import { Textarea } from "@/components/Resume/ui/textarea";

interface DeclarationFormProps {
  data: {
    text: string;
    date: string;
    place: string;
    signature: string;
  };
  onChange: (declaration: any) => void;
}

const DeclarationForm = ({ data, onChange }: DeclarationFormProps) => {
  const updateField = (field: string, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="declaration-text">Declaration Text</Label>
        <Textarea
          id="declaration-text"
          value={data.text}
          onChange={(e) => updateField('text', e.target.value)}
          placeholder="I hereby solemnly declare that all statements made above are true and correct to the best of my knowledge and belief."
          rows={3}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="declaration-date">Date</Label>
          <Input
            id="declaration-date"
            value={data.date}
            onChange={(e) => updateField('date', e.target.value)}
            placeholder="Enter date"
            type="date"
          />
        </div>
        
        <div>
          <Label htmlFor="declaration-place">Place</Label>
          <Input
            id="declaration-place"
            value={data.place}
            onChange={(e) => updateField('place', e.target.value)}
            placeholder="Enter place"
          />
        </div>
        
        <div>
          <Label htmlFor="declaration-signature">Signature</Label>
          <Input
            id="declaration-signature"
            value={data.signature}
            onChange={(e) => updateField('signature', e.target.value)}
            placeholder="(YOUR NAME)"
          />
        </div>
      </div>
    </div>
  );
};

export default DeclarationForm;