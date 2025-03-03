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
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [supportedDimensions, setSupportedDimensions] = useState<('2d' | '3d')[]>(['3d']);

  const handleFormulaBlur = () => {
    if (formulaString) {
      const detectedParams = FormulaParser.detectParameters(formulaString);
      setParameters(prevParams => ({
        ...prevParams,
        ...detectedParams
      }));
    }
  };

  const handleFormula2DBlur = () => {
    if (formula2DString) {
      // Also detect parameters from the 2D formula
      const detectedParams = FormulaParser.detectParameters(formula2DString);
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
    if (!name || !formulaString) {
      setStatus('Please fill in all required fields');
      return;
    }

    if (supportedDimensions.length === 0) {
      setStatus('Please select at least one supported dimension');
      return;
    }

    // If 2D is selected but no 2D formula is provided, we'll use a default implementation
    if (supportedDimensions.includes('2d') && !formula2DString) {
      console.log("Using default 2D formula implementation");
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
        onComplete?.(newFormula);
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
      <div className="space-y-4">
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

        <Accordion type="single" collapsible className="w-full">
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
                  placeholder="Enter your formula using JavaScript syntax, e.g. Math.sin(params.phi) * params.amplitude"
                  rows={5}
                  required
                />
                <p className="text-xs text-gray-500">
                  Use JavaScript syntax. Parameters are accessed via params.paramName.
                  Hit Enter or Tab to detect parameters.
                </p>
              </div>

              {supportedDimensions.includes('2d') && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="formula2d">2D Cartesian Formula (optional)</Label>
                  <Textarea
                    id="formula2d"
                    value={formula2DString}
                    onChange={(e) => setFormula2DString(e.target.value)}
                    onBlur={handleFormula2DBlur}
                    placeholder="Enter 2D formula variant: e.g., params.a * Math.sin(x * params.frequency)"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    For 2D plotting, specify how y is calculated for a given x value.
                    If not provided, we'll generate one from the main formula.
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