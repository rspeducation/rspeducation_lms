
import { Input } from "@/components/Resume/ui/input";
import { Textarea } from "@/components/Resume/ui/textarea";
import { Label } from "@/components/Resume/ui/label";
import { Mail, Phone, MapPin, Target } from "lucide-react";

interface PersonalInfoFormProps {
  data: {
    name: string;
    email: string;
    phone: string;
    location: string;
    objective: string;
  };
  onChange: (field: string, value: string) => void;
}

const PersonalInfoForm = ({ data, onChange }: PersonalInfoFormProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onChange('name', e.target.value)}
            placeholder="John Doe"
            className="h-11"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address *
          </Label>
          <Input
            id="email"
            type="email"
            value={data.email}
            onChange={(e) => onChange('email', e.target.value)}
            placeholder="john.doe@email.com"
            className="h-11"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={data.phone}
            onChange={(e) => onChange('phone', e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Location
          </Label>
          <Input
            id="location"
            value={data.location}
            onChange={(e) => onChange('location', e.target.value)}
            placeholder="New York, NY"
            className="h-11"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="objective" className="text-sm font-medium flex items-center gap-2">
          <Target className="w-4 h-4" />
          Professional Objective
        </Label>
        <Textarea
          id="objective"
          value={data.objective}
          onChange={(e) => onChange('objective', e.target.value)}
          placeholder="A brief statement about your career goals and what you bring to the role..."
          className="min-h-[100px] resize-none"
        />
      </div>
    </div>
  );
};

export default PersonalInfoForm;
