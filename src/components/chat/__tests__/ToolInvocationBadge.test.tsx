import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import type { ToolInvocation } from "ai";

afterEach(() => {
  cleanup();
});

function makeInvocation(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "result" = "result"
): ToolInvocation {
  return {
    toolCallId: "test-id",
    toolName,
    args,
    state,
    ...(state === "result" ? { result: "ok" } : {}),
  } as ToolInvocation;
}

// str_replace_editor — create

test("str_replace_editor create (loading) shows Creando…", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation(
        "str_replace_editor",
        { command: "create", path: "/App.jsx" },
        "call"
      )}
    />
  );
  expect(screen.getByText("Creando…")).toBeDefined();
  expect(screen.getByTestId("spinner")).toBeDefined();
});

test("str_replace_editor create (done) shows Creado: App.jsx", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "create",
        path: "/App.jsx",
      })}
    />
  );
  expect(screen.getByText("Creado: App.jsx")).toBeDefined();
  expect(screen.getByTestId("done-dot")).toBeDefined();
});

// str_replace_editor — str_replace

test("str_replace_editor str_replace (done) shows Editado: styles.css", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "str_replace",
        path: "/src/styles.css",
        old_str: "a",
        new_str: "b",
      })}
    />
  );
  expect(screen.getByText("Editado: styles.css")).toBeDefined();
});

// str_replace_editor — insert

test("str_replace_editor insert (done) shows Editado: utils.ts", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "insert",
        path: "/src/utils.ts",
        insert_line: 5,
        new_str: "const x = 1;",
      })}
    />
  );
  expect(screen.getByText("Editado: utils.ts")).toBeDefined();
});

// str_replace_editor — view

test("str_replace_editor view (done) shows Leído: index.tsx", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "view",
        path: "/src/index.tsx",
      })}
    />
  );
  expect(screen.getByText("Leído: index.tsx")).toBeDefined();
});

// str_replace_editor — undo_edit

test("str_replace_editor undo_edit (done) shows Revertido: App.jsx", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "undo_edit",
        path: "/App.jsx",
      })}
    />
  );
  expect(screen.getByText("Revertido: App.jsx")).toBeDefined();
});

// file_manager — delete

test("file_manager delete (done) shows Eliminado: old.jsx", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("file_manager", {
        command: "delete",
        path: "/src/old.jsx",
      })}
    />
  );
  expect(screen.getByText("Eliminado: old.jsx")).toBeDefined();
});

// file_manager — rename

test("file_manager rename (done) shows Renombrado: old.jsx → new.jsx", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("file_manager", {
        command: "rename",
        path: "/src/old.jsx",
        new_path: "/src/new.jsx",
      })}
    />
  );
  expect(screen.getByText("Renombrado: old.jsx → new.jsx")).toBeDefined();
});

// Unknown tool

test("unknown tool (done) shows raw toolName", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("some_unknown_tool", {})}
    />
  );
  expect(screen.getByText("some_unknown_tool")).toBeDefined();
});

// Loading state shows spinner; done shows green dot

test("loading state renders spinner, not done-dot", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation(
        "str_replace_editor",
        { command: "create", path: "/App.jsx" },
        "call"
      )}
    />
  );
  expect(screen.getByTestId("spinner")).toBeDefined();
  expect(screen.queryByTestId("done-dot")).toBeNull();
});

test("done state renders green dot, not spinner", () => {
  render(
    <ToolInvocationBadge
      toolInvocation={makeInvocation("str_replace_editor", {
        command: "create",
        path: "/App.jsx",
      })}
    />
  );
  expect(screen.getByTestId("done-dot")).toBeDefined();
  expect(screen.queryByTestId("spinner")).toBeNull();
});
