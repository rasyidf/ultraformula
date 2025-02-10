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

## How to use
To use the formula playground, simply slide the sliders to adjust the parameters of the formula you want to test. or click randomize to get a random set of parameters.

The formula will be evaluated, and the result will be displayed on the screen. You can experiment with different formulas and functions to see how they behave.