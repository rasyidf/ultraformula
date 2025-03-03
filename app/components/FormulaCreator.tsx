
import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { DynamicFormula } from "~/lib/FormulaFactory";
import { FormulaParser } from "~/lib/FormulaParser";
import type { ParameterMetadata } from "~/types/Formula";

interface FormulaCreatorProps {
  onComplete?: () => void;
}

export const FormulaCreator: React.FC<FormulaCreatorProps> = ({ onComplete }) => {
  const [formulaString, setFormulaString] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [parameters, setParameters] = useState<Record<string, ParameterMetadata>>({});
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const detectParameters = (formula: string): Record<string, ParameterMetadata> => {
    const variables = FormulaParser.extractVariables(formula);

    return variables.reduce((acc, param) => ({
      ...acc,
      [param]: {
        name: param,
        type: 'number',
        description: '',
        defaultValue: 0
      }
    }), {});
  };

  const handleFormulaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newFormula = e.target.value;
    if (!newFormula.startsWith('=')) {
      setFormulaString('=' + newFormula);
    } else {
      setFormulaString(newFormula);
    }
  };

  const handleFormulaBlur = () => {
    if (formulaString) {
      const detectedParams = detectParameters(formulaString);
      setParameters(prevParams => ({
        ...prevParams,
        ...detectedParams
      }));
    }
  };

  const handleFormulaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormulaBlur();
    }
  };

  const createFormula = async () => {
    if (!name || !formulaString) {
      setStatus('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const newFormula = new DynamicFormula(
        {
          name,
          description,
          parameters
        },
        formulaString
      );

      if (newFormula.validate()) {
        setStatus('Formula created successfully!');
        onComplete?.();
      } else {
        setStatus('Invalid formula!');
      }
    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="space-y-2">
        <Label htmlFor="name">Formula Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter formula name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter formula description"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="formula">Formula Expression</Label>
        <Textarea
          id="formula"
          value={formulaString}
          onChange={handleFormulaChange}
          onBlur={handleFormulaBlur}
          onKeyDown={handleFormulaKeyDown}
          placeholder="Enter your formula (e.g., =sin(x) + cos(y))"
          rows={4}
          required
        />
      </div>

      <ParameterEditor
        parameters={parameters}
        onParametersChange={setParameters}
      />

      {status && (
        <Alert variant={status.includes('Error') ? 'destructive' : 'default'}>
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={createFormula}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Creating...' : 'Create Formula'}
      </Button>
    </div>
  );
};

interface ParameterEditorProps {
  parameters: Record<string, ParameterMetadata>;
  onParametersChange: (params: Record<string, ParameterMetadata>) => void;
}

const ParameterEditor: React.FC<ParameterEditorProps> = ({
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