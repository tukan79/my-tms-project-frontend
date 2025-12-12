import React from "react";
import PropTypes from "prop-types";
import { Truck, User, Package, Weight, CheckCircle, AlertTriangle } from "lucide-react";

export default function PlanItRuns({ runs, activeRunId, setActiveRunId }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Runs for Selected Date</h2>

      {/* No runs */}
      {runs.length === 0 && (
        <div className="p-4 rounded-lg bg-gray-50 text-gray-500 text-sm text-center">
          No runs found for this date.
        </div>
      )}

      <div className="flex flex-col gap-4">
        {runs.map((run) => {
          const isActive = run.id === activeRunId;

          const overload =
            (run.maxPayload && run.totalKilos > run.maxPayload) ||
            (run.maxPallets && run.totalSpaces > run.maxPallets);

          return (
            <button
              key={run.id}
              onClick={() => setActiveRunId(run.id)}
              className={[
                "w-full text-left rounded-xl border p-4 transition-all shadow-sm",
                isActive
                  ? "border-blue-600 bg-blue-50 shadow-md"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
              ].join(" ")}
            >
              {/* Run title */}
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium text-gray-800 text-base">{run.displayText}</h3>

                {isActive && (
                  <span className="text-xs rounded-full bg-blue-600 text-white px-2 py-0.5">
                    Active
                  </span>
                )}
              </div>

              {/* META GRID */}
              <div className="grid grid-cols-1 gap-2 text-sm mt-2">
                {/* Driver */}
                <div className="flex items-center gap-2 text-gray-700">
                  <User size={16} className="text-gray-500" />
                  <span>{run.displayDriver}</span>
                </div>

                {/* Vehicle */}
                <div className="flex items-center gap-2 text-gray-700">
                  <Truck size={16} className="text-gray-500" />
                  <span>
                    {run.displayTruck}
                    {run.displayTrailer && <span className="text-gray-500"> {run.displayTrailer}</span>}
                  </span>
                </div>

                {/* Capacity */}
                {run.hasCapacity && (
                  <div className="flex items-center gap-4 mt-2">
                    {/* Payload */}
                    {run.maxPayload && (
                      <div className="flex items-center gap-1 text-gray-700">
                        <Weight size={16} className="text-gray-500" />
                        <span>
                          {run.totalKilos} / {run.maxPayload} kg
                        </span>
                      </div>
                    )}

                    {/* Pallets */}
                    {run.maxPallets && (
                      <div className="flex items-center gap-1 text-gray-700">
                        <Package size={16} className="text-gray-500" />
                        <span>
                          {run.totalSpaces} / {run.maxPallets} spaces
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Overload Warning */}
                {overload ? (
                  <div className="flex items-center gap-2 mt-2 text-red-600 font-medium">
                    <AlertTriangle size={16} />
                    Over capacity — review assignments
                  </div>
                ) : (
                  run.hasCapacity && (
                    <div className="flex items-center gap-2 mt-2 text-green-600 text-sm">
                      <CheckCircle size={16} />
                      Capacity OK
                    </div>
                  )
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

PlanItRuns.propTypes = {
  runs: PropTypes.array.isRequired,
  activeRunId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  setActiveRunId: PropTypes.func.isRequired,
};
