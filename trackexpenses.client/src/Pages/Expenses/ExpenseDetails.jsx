import { ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import { useState } from "react";

function ExpenseInstanceDropdown({ instances }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-blue-600 flex items-center space-x-1"
      >
        <span>{open ? "Esconder parcelas" : "Ver parcelas"}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <ul className="mt-2 border rounded p-2 bg-gray-50 space-y-2">
          {instances.map((inst) => (
            <li
              key={inst.id}
              className="flex justify-between items-center border-b pb-1 text-sm"
            >
              <div>📅 {new Date(inst.dueDate).toLocaleDateString()}</div>
              <div className="flex items-center space-x-2">
                💰 -{Number(inst.value || 0).toFixed(2)}€
                {inst.isPaid ? (
                  <CheckCircle className="text-green-500" size={16} />
                ) : (
                  <XCircle className="text-red-500" size={16} />
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
