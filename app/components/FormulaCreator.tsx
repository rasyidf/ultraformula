import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { DynamicFormula } from '~/lib/FormulaFactory';
import { FormulaParser } from '~/lib/FormulaParser';
import type { Formula, ParameterMetadata } from '~/types/Formula';
import { ParameterEditor } from './ParameterEditor';

export interface FormulaCreatorProps {
  onComplete?: (formula?: Formula) => void;
}

export const FormulaCreator: React.FC<FormulaCreatorProps> = ({ onComplete }) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [formulaString, setFormulaString] = useState<string>('');
  const [formula2DString, setFormula2DString] = useState<string>('');
  const [parameters, setParameters] = useState<Record<string, ParameterMetadata>>({});
  const [constants, setConstants] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [supportedDimensions, setSupportedDimensions] = useState<('2d' | '3d')[]>(['3d']);

  const handleFormulaBlur = () => {
    if (formulaString) {
      // Detect custom constants (e.g., K=1.414)
      const assignMatch = formulaString.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\d\.eE+-]+)\s*;?/);
      if (assignMatch) {
        const [, key, val] = assignMatch;
        setConstants(prev => ({ ...prev, [key]: Number(val) }));
      }
      const detectedParams = FormulaParser.detectParameters(formulaString);
      const paramObj = { ...parameters };
      detectedParams.forEach(p => { paramObj[p.name] = p; });
      setParameters(paramObj);
      // Validate formula and show error if invalid
      if (!FormulaParser.validateFormula(formulaString)) {
        setError('Invalid formula syntax or unsupported function.');
      } else {
        setError('');
      }
    }
  };

  const handleFormula2DBlur = () => {
    if (formula2DString) {
      const detectedParams = FormulaParser.detectParameters(formula2DString);
      const paramObj = { ...parameters };
      detectedParams.forEach(p => { paramObj[p.name] = p; });
      setParameters(paramObj);
      if (!FormulaParser.validateFormula(formula2DString)) {
        setError('Invalid 2D formula syntax or unsupported function.');
      } else {
        setError('');
      }
    }
  };

  const handleFormulaKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleFormulaBlur();
    }
  };

  const toggleDimension = (dimension: '2d' | '3d') => {
    setSupportedDimensions(prev => {
      if (prev.includes(dimension)) {
        return prev.filter(d => d !== dimension);
      } else {
        return [...prev, dimension];
      }
    });
  };

  const createFormula = async () => {
    setError('');
    if (!name || !formulaString) {
      setStatus('Please fill in all required fields');
      return;
    }
    if (supportedDimensions.length === 0) {
      setStatus('Please select at least one supported dimension');
      return;
    }
    if (!FormulaParser.validateFormula(formulaString)) {
      setError('Formula syntax error or unsupported function.');
      setStatus('');
      return;
    }
    if (supportedDimensions.includes('2d') && formula2DString && !FormulaParser.validateFormula(formula2DString)) {
      setError('2D formula syntax error or unsupported function.');
      setStatus('');
      return;
    }
    setLoading(true);
    try {
      const newFormula = new DynamicFormula(
        {
          name,
          description,
          supportedDimensions,
          parameters
        },
        formulaString,
        formula2DString || undefined
      );
      if (newFormula.validate()) {
        setStatus('Formula created successfully!');
        setError('');
        onComplete?.(newFormula);
      } else {
        setStatus('Invalid formula!');
      }
    } catch (error) {
      if (error instanceof Error) {
        setStatus(`Error: ${error.message}`);
        setError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 md:p-4 rounded-lg bg-background   max-w-xl w-full">
      <div className="space-y-6">
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
            placeholder="Describe what your formula does"
            rows={2}
          />
        </div>
        <div className="space-y-2">
          <Label>Supported Dimensions</Label>
          <div className="flex gap-4 mt-1">
            <div className="flex items-center gap-2">
              <Checkbox
                id="support3d"
                checked={supportedDimensions.includes('3d')}
                onCheckedChange={() => toggleDimension('3d')}
              />
              <Label htmlFor="support3d" className="font-normal">3D</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="support2d"
                checked={supportedDimensions.includes('2d')}
                onCheckedChange={() => toggleDimension('2d')}
              />
              <Label htmlFor="support2d" className="font-normal">2D</Label>
            </div>
          </div>
        </div>
        <Accordion type="single" collapsible defaultValue='formula' className="w-full">
          <AccordionItem value="formula">
            <AccordionTrigger>Formula Definition</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                <Label htmlFor="formula">Formula Expression</Label>
                <Textarea
                  id="formula"
                  value={formulaString}
                  onChange={(e) => setFormulaString(e.target.value)}
                  onBlur={handleFormulaBlur}
                  onKeyDown={handleFormulaKeyDown}
                  placeholder="e.g. K=1.414;=K*x+PI or =Math.sin(params.phi)*params.amplitude"
                  rows={5}
                  required
                />
                <p className="text-xs text-gray-500">
                  Supports custom constants (e.g. <b>K=1.414;</b>), built-in constants (PI, E, TAU, PHI), and scientific notation.<br />
                  Use JavaScript syntax. Parameters are auto-detected.<br />
                  Hit Enter or Tab to detect parameters.
                </p>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                {Object.keys(constants).length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <b>Detected Constants:</b> {Object.entries(constants).map(([k, v]) => `${k}=${v}`).join(', ')}
                  </div>
                )}
                {Object.keys(parameters).length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <b>Detected Parameters:</b> {Object.keys(parameters).join(', ')}
                  </div>
                )}
              </div>
              {supportedDimensions.includes('2d') && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="formula2d">2D Cartesian Formula (optional)</Label>
                  <Textarea
                    id="formula2d"
                    value={formula2DString}
                    onChange={(e) => setFormula2DString(e.target.value)}
                    onBlur={handleFormula2DBlur}
                    placeholder="e.g. params.a * Math.sin(x * params.frequency)"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    For 2D plotting, specify how y is calculated for a given x value.<br />
                    If not provided, a default will be generated from the main formula.
                  </p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="parameters">
            <AccordionTrigger>Parameters</AccordionTrigger>
            <AccordionContent>
              <ParameterEditor
                parameters={parameters}
                onParametersChange={setParameters}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <Button
          onClick={createFormula}
          disabled={loading}
          className="w-full mt-4"
        >
          {loading ? 'Creating...' : 'Create Formula'}
        </Button>
        {status && (
          <Alert variant={status.startsWith('Error') ? 'destructive' : 'default'}>
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};