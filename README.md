# Formula Playground

This is a playground for testing out different formulas and functions in React,

I have created a simple interface where you can input a formula and see the result of that formula. the current available functions are:
- Gielis Superformula
- Perlin Noise Terrain Generation

## Gielis Superformula
The Gielis Superformula is a mathematical formula that can be used to generate a wide variety of shapes. The formula is defined as follows:

```
r = (abs(1/a * cos(m * theta / 4)))^n1 + (abs(1/b * sin(m * theta / 4)))^n2
```

Where:
- `r` is the radius of the shape at a given angle `theta`
- `a` and `b` are parameters that control the shape of the formula
- `m` is a parameter that controls the number of lobes in the shape
- `n1` and `n2` are parameters that control the sharpness of the lobes

You can experiment with different values of `a`, `b`, `m`, `n1`, and `n2` to see how they affect the shape of the formula.

## Perlin Noise Terrain Generation
Perlin noise is a type of gradient noise that is commonly used in computer graphics to generate natural-looking textures, terrain, and other procedural content. It was developed by Ken Perlin in the 1980s and has since become a staple of procedural generation algorithms.

In this playground, you can experiment with generating 2D terrain using Perlin noise. You can adjust the parameters of the Perlin noise function to see how they affect the resulting terrain. You can also adjust the color scheme and other settings to customize the appearance of the terrain.

## Gyroid
The Gyroid is a triply periodic minimal surface that can be approximated by the formula:

```
cos(x) * sin(y) + cos(y) * sin(z) + cos(z) * sin(x) = 0
```

This infinite surface divides space into two intertwined regions. You can adjust the scale and thickness parameters to modify the appearance of the gyroid structure.

## Cellular Noise
Cellular noise (also known as Worley noise) generates patterns that resemble cellular textures. The formula calculates distances between random feature points:

```
F(x,y) = min(distance to nearest feature point)
```

Parameters you can adjust:
- Cell density
- Distance function (Euclidean, Manhattan, etc.)
- Jitter amount

## Sine Interference
This formula creates interference patterns by combining multiple sine waves:

```
f(x,y) = sin(ax + φ1) * sin(by + φ2)
```

Where:
- a and b control the frequency of waves
- φ1 and φ2 are phase shifts
- Additional terms can be added for more complex patterns

## Möbius Transform
The Möbius transformation is a complex function of the form:

```
f(z) = (az + b)/(cz + d)
```

Where:
- z is a complex number
- a, b, c, d are complex constants
- ad - bc ≠ 0

You can experiment with different values of a, b, c, and d to create various conformal mappings.

## How to use
To use the formula playground, simply slide the sliders to adjust the parameters of the formula you want to test. or click randomize to get a random set of parameters.

The formula will be evaluated, and the result will be displayed on the screen. You can experiment with different formulas and functions to see how they behave.

## Adding New Formulas
To add a new formula, create a new class that extends `BaseFormula` in the `formulas` directory:

```typescript
import { BaseFormula } from "./BaseFormula";
import { FormulaMetadata, FormulaParams } from "../types/Formula";
import * as THREE from "three";

export class MyNewFormula extends BaseFormula {
  metadata: FormulaMetadata = {
    name: "My Formula",
    parameters: [
      { name: "param1", min: 0, max: 10, default: 5 },
      { name: "param2", min: -1, max: 1, default: 0 },
    ]
  };

  calculate(params: FormulaParams): number {
    // Implement your formula calculation here
    return params.param1 * Math.sin(params.param2);
  }

  createGeometry(params: FormulaParams): THREE.BufferGeometry {
    // Create THREE.js geometry for visualization
    const geometry = new THREE.BufferGeometry();
    // Add vertices, faces, etc.
    return geometry;
  }
}
```

Then register your formula in `formulas/index.ts`:

```typescript
import { MyNewFormula } from "./MyNewFormula";

export const formulaRegistry: Record<string, Formula> = {
  // ...existing formulas...
  myFormula: new MyNewFormula(),
};
```

The formula will automatically appear in the playground with its parameters.