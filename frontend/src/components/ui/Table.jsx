import React from 'react';

export default function Table({ columns, data, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-white/10">
        <thead className="bg-white/10">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
              >
                {col.label}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-white/10">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-white/5">
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 whitespace-nowrap text-white">
                  {row[col.key]}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  {onEdit && (
                    <button onClick={() => onEdit(row)} className="text-indigo-400 hover:text-indigo-300">
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(row)} className="text-red-400 hover:text-red-300">
                      Delete
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}