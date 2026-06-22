import { useState } from "react";
import { Button } from "@/components/Resume/ui/button";
import { Textarea } from "@/components/Resume/ui/textarea";
import { Label } from "@/components/Resume/ui/label";
import { Plus, X } from "lucide-react";

interface ProfileSummaryFormProps {
  data: string[];
  onChange: (profileSummary: string[]) => void;
}

const ProfileSummaryForm = ({ data, onChange }: ProfileSummaryFormProps) => {
  const [newPoint, setNewPoint] = useState("");

  const addPoint = () => {
    if (newPoint.trim()) {
      onChange([...data, newPoint.trim()]);
      setNewPoint("");
    }
  };

  const removePoint = (index: number) => {
    onChange(data.filter((_, i) => i !== index));
  };

  const updatePoint = (index: number, value: string) => {
    const updated = [...data];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {data.map((point, index) => (
          <div key={index} className="flex gap-2">
            <Textarea
              value={point}
              onChange={(e) => updatePoint(index, e.target.value)}
              placeholder="Enter profile summary point..."
              className="flex-1"
              rows={2}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => removePoint(index)}
              className="shrink-0 mt-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
      
      <div className="flex gap-2">
        <Textarea
          value={newPoint}
          onChange={(e) => setNewPoint(e.target.value)}
          placeholder="Add new profile summary point..."
          rows={2}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={addPoint}
          className="shrink-0 mt-1"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProfileSummaryForm;