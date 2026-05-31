// Builds a runnable Vite + React project from an example's source and opens it
// in StackBlitz (WebContainers, no account or template needed). The example code
// is the raw `components/examples/*.tsx` file shown in the "Code" tab.
//
// Live once @snapgridjs/react is published to npm — the sandbox does a real
// `npm install @snapgridjs/react`, so before publish it opens but can't resolve
// the package.

// Version pins for the sandbox's package.json. A package imported by an example
// but missing here falls back to "latest".
const DEP_VERSIONS: Record<string, string> = {
  react: "^18.3.1",
  "react-dom": "^18.3.1",
  "@snapgridjs/react": "latest",
  "@snapgridjs/extras": "latest",
  "@snapgridjs/core": "latest",
  "@dnd-kit/react": "^0.4.0",
  "@dnd-kit/dom": "^0.4.0",
  "@dnd-kit/abstract": "^0.4.0",
  "@dnd-kit/helpers": "^0.4.0",
};

const DEV_DEPENDENCIES = {
  "@types/react": "^18.3.5",
  "@types/react-dom": "^18.3.0",
  "@vitejs/plugin-react": "^4.3.2",
  typescript: "^5.6.2",
  vite: "^5.4.8",
};

// snapgrid ships no CSS, and the example tiles use plain class names the reader
// is expected to style. This is a sensible default look so the sandbox is
// presentable the moment it boots.
const STYLES = `:root {
  --paper: #faf8f4;
  --card: #ffffff;
  --ink: #1f1d1a;
  --muted: #8a8276;
  --line: #e7e2d8;
  --accent: #d97757;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 24px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background: var(--paper);
  color: var(--ink);
}

/* Grid tiles */
.tile {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 2px;
  padding: 8px 12px;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  font-size: 0.9rem;
  user-select: none;
  overflow: hidden;
}
.tile__id { font-weight: 600; }
.tile__dim { font-size: 0.78rem; color: var(--muted); font-variant-numeric: tabular-nums; }

/* Big "digit" cells (404 example) */
.cell {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 600;
  font-size: clamp(2rem, 11vw, 3.75rem);
  line-height: 1;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--card);
  cursor: grab;
  user-select: none;
}
.cell--accent { background: var(--accent); border-color: var(--accent); color: #fff; }
.snapgrid-overlay .cell { border-color: var(--accent); box-shadow: 0 16px 32px rgba(0, 0, 0, 0.22); }
/* Static "button" tiles */
.btn {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: var(--card);
  color: var(--ink);
  font-weight: 600;
  font-size: 0.9rem;
  text-decoration: none;
  cursor: pointer;
}
.btn--primary { background: var(--accent); border-color: var(--accent); color: #fff; }

/* Drag handle */
.drag-handle { cursor: grab; font-weight: 600; user-select: none; }
.drag-handle:active { cursor: grabbing; }

/* Button rows (compactor switcher, etc.) */
.controls { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.controls button {
  font: inherit;
  font-size: 0.82rem;
  padding: 5px 11px;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  cursor: pointer;
  text-transform: capitalize;
}
.controls button[data-active] { background: var(--accent); border-color: var(--accent); color: #fff; }

/* External-drop palette + draggable chips */
.palette {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 1px dashed var(--line);
  border-radius: 10px;
  background: var(--card);
  height: max-content;
}
.chip {
  font-size: 0.82rem;
  padding: 6px 11px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: var(--card);
  color: var(--ink);
  cursor: grab;
  user-select: none;
}

/* Nested panel */
.panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 10px;
  overflow: hidden;
}
.panel-header {
  padding: 6px 10px;
  font-weight: 600;
  font-size: 0.85rem;
  border-bottom: 1px solid var(--line);
  cursor: grab;
}
.subgrid { flex: 1; padding: 8px; }
.subgrid__label { font-size: 0.75rem; color: var(--muted); }

/* snapgrid ships no CSS — give the placeholder + SE resize handle a visible look */
.snapgrid-placeholder,
.placeholder {
  background: rgba(217, 119, 87, 0.14) !important;
  border: 1px dashed rgba(217, 119, 87, 0.5) !important;
  border-radius: 10px !important;
}
.snapgrid-resize-handle--se::after {
  content: "";
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 8px;
  height: 8px;
  border-right: 2px solid #b8b1a4;
  border-bottom: 2px solid #b8b1a4;
}
`;

const VITE_CONFIG = `import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [react()] });
`;

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
`;

const indexHtml = (title: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>snapgrid · ${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

const mainTsx = (component: string) => `import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ${component} } from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <${component} />
  </StrictMode>,
);
`;

/** External (non-relative) packages an example imports, e.g. `@dnd-kit/dom`. */
function importedPackages(raw: string): string[] {
  const pkgs = new Set<string>();
  const re = /from\s+["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop.
  while ((m = re.exec(raw)) !== null) {
    const spec = m[1];
    if (spec.startsWith(".") || spec.startsWith("/")) continue;
    const parts = spec.split("/");
    pkgs.add(spec.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0]);
  }
  return [...pkgs];
}

function packageJson(name: string, raw: string): string {
  const deps: Record<string, string> = {
    "@snapgridjs/react": DEP_VERSIONS["@snapgridjs/react"],
    react: DEP_VERSIONS.react,
    "react-dom": DEP_VERSIONS["react-dom"],
  };
  for (const pkg of importedPackages(raw)) deps[pkg] = DEP_VERSIONS[pkg] ?? "latest";
  return `${JSON.stringify(
    {
      name: `snapgrid-${name}`,
      private: true,
      version: "0.0.0",
      type: "module",
      scripts: { dev: "vite", build: "vite build" },
      dependencies: Object.fromEntries(Object.entries(deps).sort(([a], [b]) => a.localeCompare(b))),
      devDependencies: DEV_DEPENDENCIES,
    },
    null,
    2,
  )}\n`;
}

const componentName = (raw: string) => raw.match(/export\s+function\s+(\w+)/)?.[1] ?? "Example";

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "example";

/**
 * Open the given example (its title and raw source) as a fresh StackBlitz
 * project in a new tab. Uses the dependency-free form-POST to stackblitz.com/run.
 */
export function openInStackBlitz(title: string, raw: string): void {
  const id = slug(title);
  const files: Record<string, string> = {
    "package.json": packageJson(id, raw),
    "vite.config.ts": VITE_CONFIG,
    "tsconfig.json": TSCONFIG,
    ".stackblitzrc": `${JSON.stringify({ installDependencies: true, startCommand: "npm run dev" }, null, 2)}\n`,
    "index.html": indexHtml(title),
    "src/main.tsx": mainTsx(componentName(raw)),
    "src/App.tsx": `${raw}\n`,
    "src/styles.css": STYLES,
  };

  const form = document.createElement("form");
  form.method = "POST";
  form.action = "https://stackblitz.com/run?file=src%2FApp.tsx";
  form.target = "_blank";
  const add = (fieldName: string, value: string) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = fieldName;
    input.value = value;
    form.appendChild(input);
  };
  add("project[title]", `snapgrid · ${title}`);
  add("project[description]", `A snapgrid example: ${title}`);
  add("project[template]", "node");
  for (const [path, contents] of Object.entries(files)) add(`project[files][${path}]`, contents);

  document.body.appendChild(form);
  form.submit();
  form.remove();
}
