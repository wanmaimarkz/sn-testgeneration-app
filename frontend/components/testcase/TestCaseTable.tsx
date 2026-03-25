// components/testcase/TestCaseTable.tsx

interface TestCaseTableProps {
  data: any;
  columns: string[];
}

export function TestCaseTable({ data, columns }: TestCaseTableProps) {
  const rows: Record<string, any>[] = Array.isArray(data?.cases) && data.cases.length > 0
    ? data.cases
    : Array.isArray(data) && data.length > 0
      ? data
      : data && typeof data === 'object' ? [data] : [];

  const cols = columns.length > 0 ? columns : rows.length > 0 ? Object.keys(rows[0]) : [];

  const renderCell = (val: any) => {
    if (val === null || val === undefined || val === '') return <span className="text-gray-300">-</span>;
    if (Array.isArray(val)) {
      return (
        <ol className="list-decimal list-inside space-y-1 text-left">
          {val.map((item, i) => (
            <li key={i} className="text-sm leading-snug">{item}</li>
          ))}
        </ol>
      );
    }
    return <span className="text-sm">{String(val)}</span>;
  };

  if (rows.length === 0) return <p className="text-sm text-gray-400 mt-2">No test cases generated.</p>;

  return (
    <div className="overflow-x-auto overflow-y-auto max-h-120 rounded-xl border border-gray-100 mt-2">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100 sticky top-0 z-10">
            {cols.map(col => (
              <th key={col} className="px-4 py-3 text-left text-[11px] font-black text-gray-500 uppercase tracking-wider">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx} className="align-top border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
              {cols.map(col => (
                <td key={col} className="px-4 py-3 text-gray-700 w-[1%] min-w-25 max-w-50 wrap-break-word">
                  {renderCell(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
