
import type { ParameterMetadata } from "~/types/Formula";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ParameterEditorProps {
  parameters: Record<string, ParameterMetadata>;
  onParametersChange: (params: Record<string, ParameterMetadata>) => void;
}

export const ParameterEditor: React.FC<ParameterEditorProps> = ({
  parameters,
  onParametersChange
}) => {
  const updateParameter = (paramName: string, updates: Partial<ParameterMetadata>) => {
    onParametersChange({
      ...parameters,
      [paramName]: {
        ...parameters[paramName],
        ...updates
      }
    });
  };

  const removeParameter = (paramName: string) => {
    const newParameters = { ...parameters };
    delete newParameters[paramName];
    onParametersChange(newParameters);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Parameters</h3>
      <Accordion type="single" collapsible className="w-full">
        {Object.entries(parameters).map(([paramName, param]) => (
          <AccordionItem key={paramName} value={paramName}>
            <AccordionTrigger>{paramName}</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={param.description}
                    onChange={(e) => updateParameter(paramName, { description: e.target.value })}
                    placeholder="Parameter description"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Default Value</Label>
                  <Input
                    type="number"
                    value={param.default}
                    onChange={(e) => updateParameter(paramName, { default: Number(e.target.value) })}
                    placeholder="Default value"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeParameter(paramName)}
                  className="w-full mt-2"
                >
                  Remove Parameter
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};