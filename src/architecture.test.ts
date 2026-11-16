import { describe, expect, it } from "vitest";
import { findTextLiterals } from "./test-literals";

const modules = import.meta.glob<string>("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
});

const NOT_PRODUCTION =
  /\.test\.tsx?$|\/test-(setup|utils|data|literals)\.tsx?$|\/integration\//;

const IMPORT =
  /(?:^|\n)\s*(?:import|export)\s[^;]*?\sfrom\s+["']([^"']+)["']|(?:^|\n)\s*import\s+["']([^"']+)["']/g;

function importsOf(text: string): string[] {
  return [...text.matchAll(IMPORT)].map((match) => match[1] ?? match[2]);
}

function resolve(from: string, spec: string): string {
  if (spec.startsWith("@/")) return `/src/${spec.slice(2)}`;
  if (!spec.startsWith(".")) return spec;
  const parts = from.split("/").slice(0, -1);
  for (const segment of spec.split("/")) {
    if (segment === ".") continue;
    if (segment === "..") parts.pop();
    else parts.push(segment);
  }
  return parts.join("/");
}

interface Source {
  path: string;
  text: string;
  imports: string[];
}

const sources: Source[] = Object.entries(modules)
  .filter(([path]) => !NOT_PRODUCTION.test(path))
  .map(([path, text]) => ({
    path,
    text,
    imports: importsOf(text).map((spec) => resolve(path, spec)),
  }));

const within = (prefix: string) =>
  sources.filter((source) => source.path.startsWith(prefix));

function violations(
  files: Source[],
  isForbidden: (file: Source, imported: string) => boolean,
): string[] {
  return files.flatMap((file) =>
    file.imports
      .filter((imported) => isForbidden(file, imported))
      .map((imported) => `${file.path} imports ${imported}`),
  );
}

const startsWithAny = (value: string, prefixes: string[]) =>
  prefixes.some((prefix) => value.startsWith(prefix));

function pageRoot(path: string): string {
  const [profile, page] = path.slice("/src/pages/".length).split("/");
  return profile === "login"
    ? `/src/pages/${profile}/`
    : `/src/pages/${profile}/${page}/`;
}

describe("the checker itself", () => {
  it("reads single-line, multi-line, type-only and side-effect imports", () => {
    const text = [
      'import { a } from "./a";',
      "import type {",
      "  B,",
      '} from "@/domain/b";',
      'import "./styles.css";',
      'export { c } from "../c";',
      "const x = 1;",
    ].join("\n");
    expect(importsOf(text)).toEqual([
      "./a",
      "@/domain/b",
      "./styles.css",
      "../c",
    ]);
  });

  it("turns aliases and relative paths into absolute ones", () => {
    expect(resolve("/src/server/db.ts", "@/domain/types")).toBe(
      "/src/domain/types",
    );
    expect(resolve("/src/server/db.ts", "./ops")).toBe("/src/server/ops");
    expect(resolve("/src/pages/a/b/index.tsx", "../../c/d")).toBe(
      "/src/pages/c/d",
    );
    expect(resolve("/src/server/db.ts", "react")).toBe("react");
  });

  it("looks at every layer, so no rule passes by checking nothing", () => {
    for (const layer of [
      "/src/domain/",
      "/src/server/",
      "/src/store/",
      "/src/lib/",
      "/src/i18n/",
      "/src/components/",
      "/src/pages/",
    ]) {
      expect(within(layer).length).toBeGreaterThan(1);
    }
    expect(sources.some((source) => source.path.endsWith(".test.ts"))).toBe(
      false,
    );
  });

  it("spots a forbidden import when there is one", () => {
    const fake: Source = {
      path: "/src/domain/x.ts",
      text: "",
      imports: ["react", "/src/store/y"],
    };
    expect(
      violations([fake], (_, index) => !index.startsWith("/src/domain/")),
    ).toHaveLength(2);
  });
});

describe("layers (ADR 0002)", () => {
  it("keeps the domain free of React, I/O and every other layer", () => {
    expect(
      violations(
        within("/src/domain/"),
        (_, imported) => !imported.startsWith("/src/domain/"),
      ),
    ).toEqual([]);
  });

  it("keeps the simulated server away from the screen and the store", () => {
    const allowed = ["/src/server/", "/src/domain/", "/src/lib/"];
    expect(
      violations(
        within("/src/server/"),
        (_, imported) =>
          !startsWithAny(imported, allowed) &&
          !imported.endsWith("dados.json?url"),
      ),
    ).toEqual([]);
  });

  it("keeps the store away from pages, components, hooks and the router", () => {
    expect(
      violations(within("/src/store/"), (_, imported) =>
        startsWithAny(imported, [
          "/src/pages/",
          "/src/components/",
          "/src/hooks/",
          "react-router",
          "@mantine/core",
        ]),
      ),
    ).toEqual([]);
  });

  it("keeps lib free of the store, the server and the screen", () => {
    expect(
      violations(within("/src/lib/"), (_, imported) =>
        startsWithAny(imported, [
          "/src/store/",
          "/src/server/",
          "/src/pages/",
          "/src/components/",
        ]),
      ),
    ).toEqual([]);
  });

  it("keeps i18n free of the store, the server and the screen", () => {
    expect(
      violations(within("/src/i18n/"), (_, imported) =>
        startsWithAny(imported, [
          "/src/store/",
          "/src/server/",
          "/src/pages/",
          "/src/components/",
        ]),
      ),
    ).toEqual([]);
  });

  it("keeps the domain and the simulated server from writing for the screen", () => {
    expect(
      violations(
        [...within("/src/domain/"), ...within("/src/server/")],
        (_, imported) => imported.startsWith("/src/i18n/"),
      ),
    ).toEqual([]);
  });

  it("makes pages and shared components talk to the store, never to the server", () => {
    expect(
      violations(
        [...within("/src/pages/"), ...within("/src/components/")],
        (_, imported) => imported.startsWith("/src/server/"),
      ),
    ).toEqual([]);
  });
});

describe("pages and shared components (ADRs 0004 and 0006)", () => {
  it("never lets a shared component import a page", () => {
    expect(
      violations(within("/src/components/"), (_, imported) =>
        imported.startsWith("/src/pages/"),
      ),
    ).toEqual([]);
  });

  it("never lets a page import another page", () => {
    expect(
      violations(
        within("/src/pages/"),
        (file, imported) =>
          imported.startsWith("/src/pages/") &&
          !imported.startsWith(pageRoot(file.path)),
      ),
    ).toEqual([]);
  });
});

describe("time (ADR 0012)", () => {
  it("reads the current time only through the simulated clock", () => {
    const offenders = sources
      .filter((source) => source.path !== "/src/lib/clock.ts")
      .filter((source) => /\bDate\.now\(\)|new Date\(\)/.test(source.text))
      .map((source) => source.path);
    expect(offenders).toEqual([]);
  });
});

describe("code style (ADR 0016)", () => {
  it("has no comments in production code", () => {
    const offenders = sources.flatMap((source) =>
      source.text
        .split("\n")
        .map((line, index) => ({ line: line.trim(), at: index + 1 }))
        .filter(({ line }) => /^(\/\/|\/\*|\*\/|\* )/.test(line))
        .map(({ at }) => `${source.path}:${at}`),
    );
    expect(offenders).toEqual([]);
  });
});

const COMPONENT_FOLDER =
  /^(\/src\/components\/[^/]+|\/src\/pages\/[^/]+\/[^/]+\/components\/[^/]+)\//;

function componentFolders(): string[] {
  const folders = new Set<string>();
  for (const path of Object.keys(modules)) {
    const match = COMPONENT_FOLDER.exec(path);
    if (match) folders.add(match[1]);
  }
  return [...folders];
}

describe("components (ADRs 0005 and 0006)", () => {
  const allPaths = Object.keys(modules);

  it("keeps every shared component in a folder of its own", () => {
    expect(
      allPaths.filter((path) => /^\/src\/components\/[^/]+$/.test(path)),
    ).toEqual([]);
  });

  it("finds the component folders, so the next rules check something", () => {
    expect(componentFolders().length).toBeGreaterThan(10);
  });

  it("gives every component folder an index.tsx", () => {
    expect(
      componentFolders().filter(
        (dir) => !allPaths.includes(`${dir}/index.tsx`),
      ),
    ).toEqual([]);
  });

  it("gives every component folder a unit test", () => {
    expect(
      componentFolders().filter(
        (dir) =>
          !allPaths.some(
            (path) =>
              path.startsWith(`${dir}/`) && /\.unit\.test\.tsx?$/.test(path),
          ),
      ),
    ).toEqual([]);
  });

  it("keeps type declarations in types.ts, not in the component files", () => {
    const offenders = sources
      .filter(
        (source) =>
          source.path.endsWith(".tsx") &&
          (source.path.startsWith("/src/components/") ||
            source.path.startsWith("/src/pages/")),
      )
      .filter((source) => /^(export )?(interface|type) \w/m.test(source.text))
      .map((source) => source.path);
    expect(offenders).toEqual([]);
  });
});

describe("the store (ADR 0009)", () => {
  it("is read through hooks and selectors and changed through actions, never touched directly", () => {
    const offenders = [
      ...within("/src/pages/"),
      ...within("/src/components/"),
    ].filter((file) =>
      [
        ...file.text.matchAll(
          /import\s*\{([^}]*)\}\s*from\s*["']@\/store\/ticketsStore["']/g,
        ),
      ].some((match) => /ticketsStore/.test(match[1])),
    );
    expect(offenders.map((file) => file.path)).toEqual([]);
  });
});

describe("enums (ADR 0008)", () => {
  it("never writes the value of an enum as a loose string", () => {
    const loose =
      /["'`](aberto|em_atendimento|aguardando_cliente|resolvido|fechado|baixa|media|alta|critica|gestor|consultor|cliente|chamado\.aberto|chamado\.atribuido|mensagem\.adicionada|status\.alterado|atribuicao)["'`]/;
    const offenders = Object.entries(modules)
      .filter(
        ([path]) =>
          path !== "/src/domain/enums.ts" &&
          path !== "/src/architecture.test.ts",
      )
      .filter(([, text]) => loose.test(text))
      .map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});

describe("interface text (ADR 0021)", () => {
  const NAMES_BRAND_AND_SYSTEM_DATA = new Set([
    "Marina Almeida",
    "Ricardo Monteiro",
    "Helena Fernandes",
    "Green Management",
    "Assumido para atendimento",
    "Cliente respondeu",
  ]);

  it("keeps every text in a locales.ts, never written in the code", () => {
    const found = sources
      .filter((source) => !source.path.endsWith("/locales.ts"))
      .flatMap((source) =>
        findTextLiterals(source.path, source.text)
          .filter((item) => !NAMES_BRAND_AND_SYSTEM_DATA.has(item.text))
          .map((item) => `${source.path}:${item.line} ${item.text}`),
      );
    expect(found, found.join("\n")).toEqual([]);
  });
});
