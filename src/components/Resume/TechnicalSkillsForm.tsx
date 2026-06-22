import { Input } from "@/components/Resume/ui/input";
import { Label } from "@/components/Resume/ui/label";

interface TechnicalSkillsFormProps {
  data: {
    operatingSystem: string;
    cloudPlatform: string;
    orchestration: string;
    ticketingTools: string;
    cicd: string;
    iaac: string;
    versionControl: string;
    scripting: string;
  };
  onChange: (skills: any) => void;
}

const TechnicalSkillsForm = ({ data, onChange }: TechnicalSkillsFormProps) => {
  const updateSkill = (field: string, value: string) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="operating-system">Operating System</Label>
        <Input
          id="operating-system"
          value={data.operatingSystem}
          onChange={(e) => updateSkill('operatingSystem', e.target.value)}
          placeholder="Linux Flavors, Windows Server Family"
        />
      </div>
      
      <div>
        <Label htmlFor="cloud-platform">Cloud Platform</Label>
        <Input
          id="cloud-platform"
          value={data.cloudPlatform}
          onChange={(e) => updateSkill('cloudPlatform', e.target.value)}
          placeholder="Microsoft Azure (IAAS, PAAS and SAAS)"
        />
      </div>
      
      <div>
        <Label htmlFor="orchestration">Orchestration</Label>
        <Input
          id="orchestration"
          value={data.orchestration}
          onChange={(e) => updateSkill('orchestration', e.target.value)}
          placeholder="KUBERNETES"
        />
      </div>
      
      <div>
        <Label htmlFor="ticketing-tools">Ticketing Tools</Label>
        <Input
          id="ticketing-tools"
          value={data.ticketingTools}
          onChange={(e) => updateSkill('ticketingTools', e.target.value)}
          placeholder="Service now"
        />
      </div>
      
      <div>
        <Label htmlFor="cicd">CI/CD</Label>
        <Input
          id="cicd"
          value={data.cicd}
          onChange={(e) => updateSkill('cicd', e.target.value)}
          placeholder="VSTS"
        />
      </div>
      
      <div>
        <Label htmlFor="iaac">IAAC</Label>
        <Input
          id="iaac"
          value={data.iaac}
          onChange={(e) => updateSkill('iaac', e.target.value)}
          placeholder="Terraform"
        />
      </div>
      
      <div>
        <Label htmlFor="version-control">Version Control</Label>
        <Input
          id="version-control"
          value={data.versionControl}
          onChange={(e) => updateSkill('versionControl', e.target.value)}
          placeholder="Git, GitHub, Azure Git Repos"
        />
      </div>
      
      <div>
        <Label htmlFor="scripting">Scripting</Label>
        <Input
          id="scripting"
          value={data.scripting}
          onChange={(e) => updateSkill('scripting', e.target.value)}
          placeholder="Json, Power Shell"
        />
      </div>
    </div>
  );
};

export default TechnicalSkillsForm;