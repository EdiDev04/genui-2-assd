"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolInvocationBadgeProps {
  toolInvocation: ToolInvocation;
}

function basename(path: string): string {
  return path.split("/").filter(Boolean).pop() ?? path;
}

function getLabel(
  toolInvocation: ToolInvocation,
  done: boolean
): string {
  const { toolName, args } = toolInvocation;

  if (toolName === "str_replace_editor") {
    const command = args?.command as string | undefined;
    const path = args?.path as string | undefined;
    const filename = path ? basename(path) : "";

    switch (command) {
      case "create":
        return done ? `Creado: ${filename}` : "Creando…";
      case "str_replace":
      case "insert":
        return done ? `Editado: ${filename}` : "Editando…";
      case "view":
        return done ? `Leído: ${filename}` : "Leyendo…";
      case "undo_edit":
        return done ? `Revertido: ${filename}` : "Revirtiendo…";
      default:
        return done ? `Editado: ${filename}` : "Procesando…";
    }
  }

  if (toolName === "file_manager") {
    const command = args?.command as string | undefined;
    const path = args?.path as string | undefined;
    const newPath = args?.new_path as string | undefined;
    const filename = path ? basename(path) : "";

    switch (command) {
      case "delete":
        return done ? `Eliminado: ${filename}` : "Eliminando…";
      case "rename":
        return done
          ? `Renombrado: ${filename} → ${newPath ? basename(newPath) : ""}`
          : "Renombrando…";
      default:
        return done ? `${filename}` : "Procesando…";
    }
  }

  return done ? toolName : "Procesando…";
}

export function ToolInvocationBadge({ toolInvocation }: ToolInvocationBadgeProps) {
  const done = toolInvocation.state === "result" && !!toolInvocation.result;
  const label = getLabel(toolInvocation, done);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" data-testid="done-dot" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" data-testid="spinner" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
