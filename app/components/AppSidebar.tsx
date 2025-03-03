import {
  Sidebar,
  SidebarRail
} from "~/components/ui/sidebar";
import { MainSidebar } from "./MainSidebar";

export function AppSidebar() {
  return (
    <Sidebar variant="floating">
      
      <MainSidebar />
      <SidebarRail />
    </Sidebar>
  );
}
