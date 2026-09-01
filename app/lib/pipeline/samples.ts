import type { FormulaParams } from "~/types/Formula";
import { defaultConfig, defaultParams, type RFEdge, type RFNode } from "./graphHelpers";

interface Built {
  nodes: RFNode[];
  edges: RFEdge[];
}

class GraphBuilder {
  nodes: RFNode[] = [];
  edges: RFEdge[] = [];
  private counter = 0;

  add(
    type: string,
    x: number,
    y: number,
    params: FormulaParams = {},
    opts: { config?: Record<string, string>; expanded?: boolean } = {},
  ): string {
    const id = `s${++this.counter}`;
    this.nodes.push({
      id,
      type: "pipelineNode",
      position: { x, y },
      data: {
        nodeType: type,
        params: { ...defaultParams(type), ...params },
        config: { ...defaultConfig(type), ...(opts.config ?? {}) },
        expanded: opts.expanded ?? false,
      },
    });
    return id;
  }

  link(source: string, sourceHandle: string, target: string, targetHandle: string) {
    this.edges.push({
      id: `${source}:${sourceHandle}->${target}:${targetHandle}`,
      source,
      sourceHandle,
      target,
      targetHandle,
    });
  }

  build(): Built {
    return { nodes: this.nodes, edges: this.edges };
  }
}

export interface PipelineSample {
  id: string;
  name: string;
  description: string;
  build: () => Built;
}

export const pipelineSamples: PipelineSample[] = [
  {
    id: "rolling-hills",
    name: "Rolling Hills",
    description: "Perlin fBm straight to a mesh",
    build: () => {
      const g = new GraphBuilder();
      const p = g.add("gen:terrainGen", 40, 140, {
        scale: 42, octaves: 5, persistence: 0.5, lacunarity: 2, seed: 12, fbmMode: 0,
      });
      const c = g.add("curve", 300, 140, { gain: 3 });
      const o = g.add("output", 540, 160);
      g.link(p, "field", c, "in");
      g.link(c, "out", o, "in");
      return g.build();
    },
  },
  {
    id: "wind-carved-ridges",
    name: "Wind-Carved Ridges",
    description: "Ridged noise pushed sideways by a domain warp",
    build: () => {
      const g = new GraphBuilder();
      const p = g.add("gen:terrainGen", 40, 140, {
        scale: 34, octaves: 6, persistence: 0.5, lacunarity: 2, seed: 7, fbmMode: 1,
      });
      const w = g.add("domainWarp", 280, 140, { warpStrength: 1.6, warpScale: 0.4 });
      const c = g.add("curve", 500, 140, { gain: 4, gamma: 1.2 });
      const o = g.add("output", 720, 160);
      g.link(p, "field", w, "in");
      g.link(w, "out", c, "in");
      g.link(c, "out", o, "in");
      return g.build();
    },
  },
  {
    id: "eroded-mountains",
    name: "Eroded Mountains",
    description: "Ridged terrain carved by a droplet erosion sim",
    build: () => {
      const g = new GraphBuilder();
      const p = g.add("gen:terrainGen", 40, 140, {
        scale: 30, octaves: 6, persistence: 0.5, lacunarity: 2, seed: 42, fbmMode: 1,
      });
      const e = g.add("erosion", 300, 140, {
        heightScale: 14, resolution: 96, iterations: 40000,
      });
      const o = g.add("output", 560, 160);
      g.link(p, "field", e, "in");
      g.link(e, "out", o, "in");
      return g.build();
    },
  },
  {
    id: "layered-strata",
    name: "Layered Strata",
    description: "Terrace a smooth field into flat plateaus",
    build: () => {
      const g = new GraphBuilder();
      const p = g.add("gen:terrainGen", 40, 140, {
        scale: 46, octaves: 4, persistence: 0.55, lacunarity: 2, seed: 3, fbmMode: 0,
      });
      const t = g.add("terrace", 280, 140, { steps: 7, stepScale: 0.5, sharpness: 0.8 });
      const c = g.add("curve", 500, 140, { gain: 6 });
      const o = g.add("output", 720, 160);
      g.link(p, "field", t, "in");
      g.link(t, "out", c, "in");
      g.link(c, "out", o, "in");
      return g.build();
    },
  },
  {
    id: "continent-and-detail",
    name: "Continent + Detail",
    description: "Add a low-frequency base and a high-frequency detail layer",
    build: () => {
      const g = new GraphBuilder();
      const base = g.add("gen:terrainGen", 40, 60, {
        scale: 70, octaves: 3, persistence: 0.5, lacunarity: 2, seed: 1, fbmMode: 0,
      });
      const detail = g.add("gen:terrainGen", 40, 260, {
        scale: 14, octaves: 5, persistence: 0.45, lacunarity: 2.2, seed: 88, fbmMode: 0,
      });
      const b = g.add("blend", 300, 150, { mode: 0, mix: 0.5 });
      const c = g.add("curve", 520, 150, { gain: 3.5 });
      const o = g.add("output", 740, 170);
      g.link(base, "field", b, "a");
      g.link(detail, "field", b, "b");
      g.link(b, "out", c, "in");
      g.link(c, "out", o, "in");
      return g.build();
    },
  },
  {
    id: "island",
    name: "Island",
    description: "Multiply terrain by a radial falloff mask, add a sea",
    build: () => {
      const g = new GraphBuilder();
      const p = g.add("gen:terrainGen", 40, 60, {
        scale: 26, octaves: 5, persistence: 0.5, lacunarity: 2, seed: 21, fbmMode: 0,
      });
      const r = g.add("radialGradient", 40, 260, { radius: 20, falloff: 2.4 });
      const b = g.add("blend", 300, 150, { mode: 1 });
      const c = g.add("curve", 520, 150, { gain: 8 });
      const o = g.add("output", 740, 170, { colorMap: 1, waterLevel: 0.32 });
      g.link(p, "field", b, "a");
      g.link(r, "field", b, "b");
      g.link(b, "out", c, "in");
      g.link(c, "out", o, "in");
      return g.build();
    },
  },
  {
    id: "biome-driven-terrain",
    name: "Biome-Driven Terrain",
    description: "WFC biome map converted to a height field, plus noise detail",
    build: () => {
      const g = new GraphBuilder();
      const w = g.add("gen:waveFunctionCollapse", 40, 60, {
        gridWidth: 28, gridHeight: 28, seed: 9,
      });
      const tf = g.add("tileToField", 260, 60, { mode: 0, heightScale: 1, smooth: 1 });
      const detail = g.add("gen:terrainGen", 40, 260, {
        scale: 9, octaves: 4, persistence: 0.5, lacunarity: 2, seed: 3, fbmMode: 0,
      });
      const b = g.add("blend", 480, 150, { mode: 4, mix: 0.18 });
      const c = g.add("curve", 690, 150, { gain: 8 });
      const o = g.add("output", 900, 170, { colorMap: 2, waterLevel: 0.22 });
      g.link(w, "tilegrid", tf, "in");
      g.link(tf, "out", b, "a");
      g.link(detail, "field", b, "b");
      g.link(b, "out", c, "in");
      g.link(c, "out", o, "in");
      return g.build();
    },
  },
  {
    id: "thermal-talus",
    name: "Thermal Talus",
    description: "Relax steep slopes into rounded scree",
    build: () => {
      const g = new GraphBuilder();
      const p = g.add("gen:terrainGen", 40, 140, {
        scale: 28, octaves: 6, persistence: 0.5, lacunarity: 2, seed: 5, fbmMode: 1,
      });
      const th = g.add("thermalErosion", 300, 140, {
        heightScale: 12, resolution: 128, iterations: 60, talus: 0.5, strength: 0.6,
      });
      const o = g.add("output", 560, 160);
      g.link(p, "field", th, "in");
      g.link(th, "out", o, "in");
      return g.build();
    },
  },
  {
    id: "shared-seed",
    name: "Shared Seed",
    description: "One Seed node drives two noise layers — bump it to re-roll both",
    build: () => {
      const g = new GraphBuilder();
      const seed = g.add("seed", 20, 150, { seed: 1337 });
      const base = g.add(
        "gen:terrainGen",
        260, 40,
        { scale: 55, octaves: 3, persistence: 0.5, lacunarity: 2, fbmMode: 0 },
        { expanded: true },
      );
      const detail = g.add(
        "gen:terrainGen",
        260, 300,
        { scale: 15, octaves: 5, persistence: 0.45, lacunarity: 2.2, fbmMode: 1 },
        { expanded: true },
      );
      const b = g.add("blend", 560, 160, { mode: 0, mix: 0.5 });
      const c = g.add("curve", 760, 160, { gain: 3.5 });
      const o = g.add("output", 960, 180);
      g.link(seed, "number", base, "param:seed");
      g.link(seed, "number", detail, "param:seed");
      g.link(base, "field", b, "a");
      g.link(detail, "field", b, "b");
      g.link(b, "out", c, "in");
      g.link(c, "out", o, "in");
      return g.build();
    },
  },
  {
    id: "warped-cells",
    name: "Warped Cells",
    description: "Worley cellular noise distorted by a domain warp",
    build: () => {
      const g = new GraphBuilder();
      const p = g.add("gen:cellularNoise", 40, 140, {
        scale: 18, octaves: 2, persistence: 0.5, lacunarity: 2, seed: 15,
      });
      const w = g.add("domainWarp", 280, 140, { warpStrength: 1.1, warpScale: 0.6 });
      const c = g.add("curve", 500, 140, { gain: 3 });
      const o = g.add("output", 720, 160);
      g.link(p, "field", w, "in");
      g.link(w, "out", c, "in");
      g.link(c, "out", o, "in");
      return g.build();
    },
  },
  {
    id: "biome-map",
    name: "Biome Map (WFC)",
    description: "Wave Function Collapse over the terrain-ramp tileset",
    build: () => {
      const g = new GraphBuilder();
      const w = g.add("gen:waveFunctionCollapse", 60, 140, {
        gridWidth: 40, gridHeight: 40, seed: 7,
      });
      const o = g.add("output", 340, 160);
      g.link(w, "tilegrid", o, "in");
      return g.build();
    },
  },
  {
    id: "expression-waves",
    name: "Expression Surface",
    description: "A field defined by a hand-written math expression",
    build: () => {
      const g = new GraphBuilder();
      const x = g.add(
        "expression",
        60,
        140,
        { amplitude: 3 },
        { config: { expr: "= sin(sqrt(x*x + z*z) * 0.6) * 3 + cos(x * 0.2) * 1.5" } },
      );
      const o = g.add("output", 340, 160);
      g.link(x, "field", o, "in");
      return g.build();
    },
  },
];
