"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Plus, Trash2, Columns, Table as TableIcon } from "lucide-react";

export interface TableBuilderProps {
  initialData?: string | null;
  onChange: (jsonString: string | null) => void;
}

export function TableBuilder({ initialData, onChange }: TableBuilderProps) {
  const [columns, setColumns] = React.useState<string[]>(["Category", "2023", "2024"]);
  const [rows, setRows] = React.useState<Record<string, string>[]>([
    { Category: "Engineering", "2023": "120", "2024": "150" },
    { Category: "Management", "2023": "80", "2024": "95" },
  ]);

  // Parse initial data if provided
  React.useEffect(() => {
    if (initialData) {
      try {
        const parsed = JSON.parse(initialData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const keys = Object.keys(parsed[0]);
          setColumns(keys);
          setRows(parsed);
        }
      } catch {
        // ignore malformed initial data
      }
    }
  }, [initialData]);

  const notifyChange = (newCols: string[], newRows: Record<string, string>[]) => {
    if (newRows.length === 0 || newCols.length === 0) {
      onChange(null);
      return;
    }
    // Clean rows according to current columns
    const formatted = newRows.map((r) => {
      const obj: Record<string, string> = {};
      newCols.forEach((col) => {
        obj[col] = r[col] || "";
      });
      return obj;
    });
    onChange(JSON.stringify(formatted));
  };

  const addColumn = () => {
    const colName = `Col_${columns.length + 1}`;
    const nextCols = [...columns, colName];
    const nextRows = rows.map((r) => ({ ...r, [colName]: "" }));
    setColumns(nextCols);
    setRows(nextRows);
    notifyChange(nextCols, nextRows);
  };

  const removeColumn = (colIndex: number) => {
    if (columns.length <= 1) return;
    const colToRemove = columns[colIndex];
    const nextCols = columns.filter((_, idx) => idx !== colIndex);
    const nextRows = rows.map((r) => {
      const copy = { ...r };
      delete copy[colToRemove];
      return copy;
    });
    setColumns(nextCols);
    setRows(nextRows);
    notifyChange(nextCols, nextRows);
  };

  const updateColumnName = (colIndex: number, newName: string) => {
    const oldName = columns[colIndex];
    const cleanName = newName.trim() || `Col_${colIndex + 1}`;
    const nextCols = [...columns];
    nextCols[colIndex] = cleanName;

    const nextRows = rows.map((r) => {
      const copy = { ...r };
      copy[cleanName] = copy[oldName] || "";
      if (oldName !== cleanName) delete copy[oldName];
      return copy;
    });

    setColumns(nextCols);
    setRows(nextRows);
    notifyChange(nextCols, nextRows);
  };

  const addRow = () => {
    const newRow: Record<string, string> = {};
    columns.forEach((c) => {
      newRow[c] = "";
    });
    const nextRows = [...rows, newRow];
    setRows(nextRows);
    notifyChange(columns, nextRows);
  };

  const removeRow = (rIndex: number) => {
    if (rows.length <= 1) return;
    const nextRows = rows.filter((_, idx) => idx !== rIndex);
    setRows(nextRows);
    notifyChange(columns, nextRows);
  };

  const updateCell = (rIndex: number, colName: string, val: string) => {
    const nextRows = [...rows];
    nextRows[rIndex] = { ...nextRows[rIndex], [colName]: val };
    setRows(nextRows);
    notifyChange(columns, nextRows);
  };

  return (
    <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-violet-400">
          <TableIcon className="w-4 h-4" />
          <span>Interactive Data Table Builder (Data Interpretation)</span>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addColumn} className="text-xs h-7 gap-1">
            <Columns className="w-3.5 h-3.5" />
            Add Column
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={addRow} className="text-xs h-7 gap-1">
            <Plus className="w-3.5 h-3.5" />
            Add Row
          </Button>
        </div>
      </div>

      {/* Responsive Scrollable Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/90">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-800/80 border-b border-slate-700">
              {columns.map((col, cIdx) => (
                <th key={cIdx} className="p-2 min-w-[130px]">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={col}
                      onChange={(e) => updateColumnName(cIdx, e.target.value)}
                      className="w-full px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white font-bold text-xs focus:ring-1 focus:ring-violet-500"
                    />
                    {columns.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColumn(cIdx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Remove Column"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th className="p-2 w-10 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-800/30">
                {columns.map((col) => (
                  <td key={col} className="p-2">
                    <input
                      type="text"
                      value={row[col] || ""}
                      onChange={(e) => updateCell(rIdx, col, e.target.value)}
                      placeholder="Value"
                      className="w-full px-2 py-1.5 rounded-lg bg-slate-950/60 border border-slate-700/80 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500"
                    />
                  </td>
                ))}
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(rIdx)}
                    disabled={rows.length <= 1}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 disabled:opacity-20"
                    title="Remove Row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-slate-500">
        💡 This table renders natively across mobile phones and desktop displays for Data Interpretation questions.
      </p>
    </div>
  );
}
