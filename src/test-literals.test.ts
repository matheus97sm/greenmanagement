import { describe, expect, it } from "vitest";
import { findTextLiterals } from "./test-literals";

const texts = (code: string, path = "/src/pages/x/index.tsx") =>
  findTextLiterals(path, code).map((item) => item.text);

describe("findTextLiterals", () => {
  it("finds text written between tags", () => {
    expect(texts("const view = <p>Meus chamados</p>;")).toEqual([
      "Meus chamados",
    ]);
  });

  it("finds text in the attributes that people read", () => {
    expect(
      texts(
        'const view = <Input label="Nome" placeholder="Digite" aria-label="Buscar" />;',
      ),
    ).toEqual(["Nome", "Digite", "Buscar"]);
  });

  it("ignores attributes that are not text", () => {
    expect(
      texts(
        'const view = <Box className="ticket-row" color="green" variant="light" />;',
      ),
    ).toEqual([]);
  });

  it("finds text inside expressions and ternaries", () => {
    expect(
      texts('const view = <p>{ready ? "Tudo certo por aqui" : null}</p>;'),
    ).toEqual(["Tudo certo por aqui"]);
  });

  it("finds a single word kept in a label or a title", () => {
    expect(
      texts(
        'const options = [{ value: "all", label: "Todos" }]; notify({ title: "Pronto" });',
        "/src/a.ts",
      ),
    ).toEqual(["Todos", "Pronto"]);
  });

  it("finds a sentence or an accented word anywhere", () => {
    expect(
      texts(
        'const a = "Não foi possível"; const b = "uma frase solta";',
        "/src/a.ts",
      ),
    ).toEqual(["Não foi possível", "uma frase solta"]);
  });

  it("finds a text built with a template", () => {
    expect(texts("const a = `Olá, ${name}, tudo bem`;", "/src/a.ts")).toEqual([
      "Olá,  , tudo bem",
    ]);
  });

  it("lets through identifiers, paths, styles and enum values", () => {
    expect(
      texts(
        'import x from "./some path"; const a = "snake_case_value"; const b = "America/Sao_Paulo"; const c = "calc(100dvh - 60px)"; const d = "1px solid red"; enum E { A = "dois palavras" }',
        "/src/a.ts",
      ),
    ).toEqual([]);
  });

  it("reports the line of each finding", () => {
    expect(
      findTextLiterals("/src/a.ts", 'const a = 1;\nconst b = "Não sei";\n'),
    ).toEqual([{ line: 2, text: "Não sei" }]);
  });

  it("lets a developer error through, since nobody reads it on screen", () => {
    expect(
      texts(
        'throw new Error("The database has not been loaded yet.");',
        "/src/a.ts",
      ),
    ).toEqual([]);
  });

  it("looks inside exported components", () => {
    expect(
      texts("export function Page() { return <p>Meus chamados</p>; }"),
    ).toEqual(["Meus chamados"]);
  });

  it("reads plain TypeScript and TSX alike", () => {
    expect(texts("export const nothing = 1;", "/src/a.ts")).toEqual([]);
    expect(texts("export const Nothing = () => <div />;")).toEqual([]);
  });
});
