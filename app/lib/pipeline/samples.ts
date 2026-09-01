import type { FormulaParams } from "~/types/Formula";
import { tidyGraph } from "./autoLayout";
import { defaultConfig, defaultParams, type RFEdge, type RFNode } from "./graphHelpers";
import { getNodeDefinition } from "./nodes";

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
    params: FormulaParams = {},
    opts: { config?: Record<string, string>; expanded?: boolean } = {},
  ): string {
    const id = `s${++this.counter}`;
    this.nodes.push({
      id,
      type: "pipelineNode",
      position: { x: 0, y: 0 },
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

  /** field -> Heightmap. Returns the new node id (its "out" is a heightmap). */
  bake(src: string, srcHandle: string, params: FormulaParams = {}): string {
    const h = this.add("heightmap", params);
    this.link(src, srcHandle, h, "in");
    return h;
  }

  /** Colorize + Output tail. `src`/`srcHandle` feed the Colorize node. */
  finish(src: string, srcHandle: string, colorize: FormulaParams = {}) {
    const col = this.add("colorize", { colorMap: 1, ...colorize });
    const out = this.add("output");
    const srcNode = this.nodes.find((n) => n.id === src)!;
    const srcType = getNodeDefinition(srcNode.data.nodeType)?.outputs.find(
      (p) => p.id === srcHandle,
    )?.type;
    this.link(src, srcHandle, col, srcType === "heightmap" ? "heightmap" : "field");
    this.link(col, "out", out, "in");
  }

  /** bake() then finish() — the common terrain tail. */
  bakeAndFinish(
    src: string,
    srcHandle: string,
    heightmap: FormulaParams = {},
    colorize: FormulaParams = {},
  ) {
    this.finish(this.bake(src, srcHandle, heightmap), "out", colorize);
  }

  build(): Built {
    return { nodes: tidyGraph(this.nodes, this.edges), edges: this.edges };
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
    description: "Perlin fBm → Levels → Heightmap → Colorize",
    build: () => {
      const g = new GraphBuilder();
      const p = g.add("gen:terrainGen", {
        scale: 42, octaves: 5, persistence: 0.5, lacunarity: 2, seed: 12, fbmMode: 0,
      });
      const lv = g.add("levels", { gamma: 1.3 });
      g.link(p, "field", lv, "in");
      g.bakeAndFinish(lv, "out", { heightScale: 9 });
      return g.build();
    },
  },
  {
    id: "wind-carved-ridges",
    name: "Wind-Carved Ridges",
    description: "Ridged noise pushed sideways by a domain warp",
    build: () => {
      const g = new GraphBuilder();
      const p = g.add("gen:terrainGen", {
        scale: 34, octaves: 6, persistence: 0.5, lacunarity: 2, seed: 7, fbmMode: 1,
      });
      const w = g.add("domainWarp", { warpStrength: 1.6, warpScale: 0.4 });
      const lv = g.add("levels", { gamma: 1.2 });
      g.link(p, "field", w, "in");
      g.link(w, "out", lv, "in");
      g.bakeAndFinish(lv, "out", { heightScale: 12 });
      return g.build();
    },
  },
  {
    id: "eroded-mountains",
    name: "Eroded Mountains",
    description: "Ridged terrain carved by a droplet erosion sim",
    build: () => {
      const g = new GraphBuilder();
      const p = g.add("gen:terrainGen", {
        scale: 30, octaves: 6, persistence: 0.5, lacunarity: 2, seed: 42, fbmMode: 1,
      });
      const e = g.add("erosion", {
        heightScale: 14, resolution: 96, iterations: 40000,
      });
      g.link(p, "field", e, "in");
      g.finish(e, "out");
      return g.build();
    },
  },
  {
    id: "layered-strata",
    name: "Layered Strata",
    description: "Terrace a smooth field into flat plateaus",
    build: () => {
      const g = new GraphBuilder();
      const p = g.add("gen:terrainGen", {
        scale: 46, octaves: 4, persistence: 0.55, lacunarity: 2, seed: 3, fbmMode: 0,
      });
      const t = g.add("terrace", { steps: 7, stepScale: 0.5, sharpness: 0.8 });
      g.link(p, "field", t, "in");
      g.bakeAndFinish(t, "out", { heightScale: 12 });
      return g.build();
    },
  },
  {
    id: "continent-and-detail",
    name: "Continent + Detail",
    description: "Add a low-frequency base and a high-frequency detail layer",
    build: () => {
      const g = new GraphBuilder();
      const base = g.add("gen:terrainGen", {
        scale: 70, octaves: 3, persistence: 0.5, lacunarity: 2, seed: 1, fbmMode: 0,
      });
      const detail = g.add("gen:terrainGen", {
        scale: 14, octaves: 5, persistence: 0.45, lacunarity: 2.2, seed: 88, fbmMode: 0,
      });
      const cb = g.add("combine", { mode: 0, mix: 0.5 });
      const lv = g.add("levels", { gamma: 1.2 });
      g.link(base, "field", cb, "a");
      g.link(detail, "field", cb, "b");
      g.link(cb, "out", lv, "in");
      g.bakeAndFinish(lv, "out", { heightScale: 10 });
      return g.build();
    },
  },
  {
    id: "island",
    name: "Island",
    description: "Terrain × radial mask, Threshold for the sea, Heightmap, Colorize",
    build: () => {
      const g = new GraphBuilder();
      const p = g.add("gen:terrainGen", {
        scale: 26, octaves: 5, persistence: 0.5, lacunarity: 2, seed: 21, fbmMode: 0,
      });
      const r = g.add("radialGradient", { radius: 20, falloff: 2.4 });
      const cb = g.add("combine", { mode: 1 });
      const sea = g.add("threshold", { mode: 0, level: -0.15, softness: 0.08 });
      g.link(p, "field", cb, "a");
      g.link(r, "field", cb, "b");
      g.link(cb, "out", sea, "in");
      g.bakeAndFinish(sea, "out", { heightScale: 13 });
      return g.build();
    },
  },
  {
    id: "biome-driven-terrain",
    name: "Biome-Driven Terrain",
    description: "WFC biome map → height field + noise detail, Biome theme",
    build: () => {
      const g = new GraphBuilder();
      const w = g.add("gen:waveFunctionCollapse", {
        gridWidth: 28, gridHeight: 28, seed: 9,
      });
      const tf = g.add("tileToField", { mode: 0, heightScale: 1, smooth: 1 });
      const detail = g.add("gen:terrainGen", {
        scale: 9, octaves: 4, persistence: 0.5, lacunarity: 2, seed: 3, fbmMode: 0,
      });
      const cb = g.add("combine", { mode: 4, mix: 0.18 });
      const sea = g.add("threshold", { mode: 0, level: -0.4, softness: 0.15 });
      g.link(w, "tilegrid", tf, "in");
      g.link(tf, "out", cb, "a");
      g.link(detail, "field", cb, "b");
      g.link(cb, "out", sea, "in");
      g.bakeAndFinish(sea, "out", { heightScale: 9 }, { colorMap: 2 });
      return g.build();
    },
  },
  {
    id: "thermal-talus",
    name: "Thermal Talus",
    description: "Relax steep slopes into rounded scree",
    build: () => {
      const g = new GraphBuilder();
      const p = g.add("gen:terrainGen", {
        scale: 28, octaves: 6, persistence: 0.5, lacunarity: 2, seed: 5, fbmMode: 1,
      });
      const th = g.add("thermalErosion", {
        heightScale: 12, resolution: 128, iterations: 60, talus: 0.5, strength: 0.6,
      });
      g.link(p, "field", th, "in");
      g.finish(th, "out");
      return g.build();
    },
  },
  {
    id: "shared-seed",
    name: "Shared Seed",
    description: "One Seed node drives two noise layers — bump it to re-roll both",
    build: () => {
      const g = new GraphBuilder();
      const seed = g.add("seed", { seed: 1337 });
      const base = g.add(
        "gen:terrainGen",
        { scale: 55, octaves: 3, persistence: 0.5, lacunarity: 2, fbmMode: 0 },
        { expanded: true },
      );
      const detail = g.add(
        "gen:terrainGen",
        { scale: 15, octaves: 5, persistence: 0.45, lacunarity: 2.2, fbmMode: 1 },
        { expanded: true },
      );
      const cb = g.add("combine", { mode: 0, mix: 0.5 });
      const lv = g.add("levels", { gamma: 1.15 });
      g.link(seed, "number", base, "param:seed");
      g.link(seed, "number", detail, "param:seed");
      g.link(base, "field", cb, "a");
      g.link(detail, "field", cb, "b");
      g.link(cb, "out", lv, "in");
      g.bakeAndFinish(lv, "out", { heightScale: 10 });
      return g.build();
    },
  },
  {
    id: "warped-cells",
    name: "Warped Cells",
    description: "Worley cellular noise distorted by a domain warp",
    build: () => {
      const g = new GraphBuilder();
      const p = g.add("gen:cellularNoise", {
        scale: 18, octaves: 2, persistence: 0.5, lacunarity: 2, seed: 15,
      });
      const w = g.add("domainWarp", { warpStrength: 1.1, warpScale: 0.6 });
      const lv = g.add("levels", { gamma: 1.1 });
      g.link(p, "field", w, "in");
      g.link(w, "out", lv, "in");
      g.bakeAndFinish(lv, "out", { heightScale: 8 }, { colorMap: 4 });
      return g.build();
    },
  },
  {
    id: "eroded-archipelago",
    name: "Eroded Archipelago",
    description: "Noise layers, radial mask, sea Threshold, then droplet erosion",
    build: () => {
      const g = new GraphBuilder();
      const base = g.add("gen:terrainGen", {
        scale: 34, octaves: 5, persistence: 0.5, lacunarity: 2, seed: 11, fbmMode: 0,
      });
      const detail = g.add("gen:terrainGen", {
        scale: 12, octaves: 5, persistence: 0.45, lacunarity: 2.1, seed: 60, fbmMode: 0,
      });
      const radial = g.add("radialGradient", { radius: 22, falloff: 1.8 });
      const combine = g.add("combine", { mode: 0, mix: 0.5 });
      const mask = g.add("combine", { mode: 1 });
      const sea = g.add("threshold", { mode: 0, level: -0.2, softness: 0.1 });
      const e = g.add("erosion", {
        heightScale: 12, resolution: 96, iterations: 45000,
      });
      g.link(base, "field", combine, "a");
      g.link(detail, "field", combine, "b");
      g.link(combine, "out", mask, "a");
      g.link(radial, "field", mask, "b");
      g.link(mask, "out", sea, "in");
      g.link(sea, "out", e, "in");
      g.finish(e, "out");
      return g.build();
    },
  },
  {
    id: "canyonlands",
    name: "Canyonlands",
    description:
      "Seed-driven ridged + billowed noise → warp → terrace → thermal erosion",
    build: () => {
      const g = new GraphBuilder();
      const seed = g.add("seed", { seed: 808 });
      const ridged = g.add(
        "gen:terrainGen",
        { scale: 26, octaves: 6, persistence: 0.5, lacunarity: 2, fbmMode: 1 },
        { expanded: true },
      );
      const billow = g.add(
        "gen:terrainGen",
        { scale: 40, octaves: 4, persistence: 0.5, lacunarity: 2, fbmMode: 2 },
        { expanded: true },
      );
      const cb = g.add("combine", { mode: 3 });
      const warp = g.add("domainWarp", { warpStrength: 1.3, warpScale: 0.35 });
      const terrace = g.add("terrace", { steps: 9, stepScale: 0.4, sharpness: 0.85 });
      const thermal = g.add("thermalErosion", {
        heightScale: 13, resolution: 128, iterations: 50, talus: 0.4, strength: 0.55,
      });
      g.link(seed, "number", ridged, "param:seed");
      g.link(seed, "number", billow, "param:seed");
      g.link(ridged, "field", cb, "a");
      g.link(billow, "field", cb, "b");
      g.link(cb, "out", warp, "in");
      g.link(warp, "out", terrace, "in");
      g.link(terrace, "out", thermal, "in");
      g.finish(thermal, "out");
      return g.build();
    },
  },
  {
    id: "biome-map",
    name: "Biome Map (WFC)",
    description: "Wave Function Collapse over the terrain-ramp tileset",
    build: () => {
      const g = new GraphBuilder();
      const w = g.add("gen:waveFunctionCollapse", {
        gridWidth: 40, gridHeight: 40, seed: 7,
      });
      const o = g.add("output");
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
        { amplitude: 3 },
        { config: { expr: "= sin(sqrt(x*x + z*z) * 0.6) * 3 + cos(x * 0.2) * 1.5" } },
      );
      const lv = g.add("levels", { gamma: 1 });
      g.link(x, "field", lv, "in");
      g.bakeAndFinish(lv, "out", { heightScale: 3 }, { colorMap: 4 });
      return g.build();
    },
  },
];
