import type { ReactNode } from "react";
import { CaTopbar } from "./CaTopbar.js";
import { CaSidebar } from "./CaSidebar.js";

type CaShellProps = {
  children: ReactNode;
};

export function CaShell({ children }: CaShellProps) {
  return (
    <div className="ca-shell">
      <CaTopbar />
      <div className="ca-shell__body">
        <aside className="ca-shell__sidebar">
          <CaSidebar />
        </aside>
        <main className="ca-shell__main">
          {children}
        </main>
      </div>
    </div>
  );
}
