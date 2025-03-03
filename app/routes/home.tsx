import Superformula3D from "~/components/MainPage";
import type { Route } from "./+types/home";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Ultraformula" },
    { name: "description", content: "An interactive formula visualizer" },
  ];
}

export default function Home() {
  return <Superformula3D />;
}
