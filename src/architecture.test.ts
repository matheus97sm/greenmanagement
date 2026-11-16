import { describe, expect, it } from "vitest";

const modules = import.meta.glob<string>("/src/**/*.{ts,tsx}", {
  query: "?raw",
  import: "default",
  eager: true,
});

const NOT_PRODUCTION =
  /\.test\.tsx?$|\/test-(setup|utils|data)\.tsx?$|\/integration\//;

const IMPORT =
  /(?:^|\n)\s*(?:import|export)\s[^;]*?\sfrom\s+["']([^"']+)["']|(?:^|\n)\s*import\s+["']([^"']+)["']/g;

function importsOf(text: string): string[] {
  return [...text.matchAll(IMPORT)].map((m) => m[1] ?? m[2]);
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
  sources.filter((s) => s.path.startsWith(prefix));

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
      "/src/components/",
      "/src/pages/",
    ]) {
      expect(within(layer).length).toBeGreaterThan(1);
    }
    expect(sources.some((s) => s.path.endsWith(".test.ts"))).toBe(false);
  });

  it("spots a forbidden import when there is one", () => {
    const fake: Source = {
      path: "/src/domain/x.ts",
      text: "",
      imports: ["react", "/src/store/y"],
    };
    expect(
      violations([fake], (_, i) => !i.startsWith("/src/domain/")),
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
      .filter((s) => s.path !== "/src/lib/clock.ts")
      .filter((s) => /\bDate\.now\(\)|new Date\(\)/.test(s.text))
      .map((s) => s.path);
    expect(offenders).toEqual([]);
  });
});

describe("code style (ADR 0016)", () => {
  it("has no comments in production code", () => {
    const offenders = sources.flatMap((s) =>
      s.text
        .split("\n")
        .map((line, index) => ({ line: line.trim(), at: index + 1 }))
        .filter(({ line }) => /^(\/\/|\/\*|\*\/|\* )/.test(line))
        .map(({ at }) => `${s.path}:${at}`),
    );
    expect(offenders).toEqual([]);
  });
});
