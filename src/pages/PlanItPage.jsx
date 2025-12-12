import React from "react";
import PropTypes from "prop-types";
import { DragDropContext } from "@hello-pangea/dnd";
import { PlanItProvider, usePlanIt } from "@/contexts/PlanItContext.jsx";

import PlanItRuns from "@/components/plan-it/PlanItRuns.jsx";
import PlanItOrders, { useHomeZone } from "@/components/plan-it/PlanItOrders.jsx";
import PlanItActiveRun from "@/components/plan-it/PlanItActiveRun.jsx";

const PlanItContent = () => {
  const {
    selectedDate,
    setSelectedDate,
    enrichedRuns,
    activeRun,
    activeRunId,
    setActiveRunId,
    availableOrders,
    ordersForActiveRun,
    initialData,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    isRefreshing,
    triggerRefresh,
    handleDragEnd,
  } = usePlanIt();

  const homeZone = useHomeZone(initialData?.zones ?? []);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-6 p-4 lg:p-6 max-w-screen-2xl mx-auto">

        {/* HEADER PANEL */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">PlanIt Dashboard</h1>
            <p className="text-gray-500 text-sm">
              Manage daily runs, assignments, and orders.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* DATE SELECTOR */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-lg border px-3 py-1.5 text-sm shadow-sm"
            />

            {/* REFRESH BUTTON */}
            <button
              onClick={triggerRefresh}
              className="px-4 py-1.5 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </button>

            {/* AUTO REFRESH TOGGLE */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefreshEnabled}
                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
              />
              Auto Refresh
            </label>
          </div>
        </header>

        {/* MAIN LAYOUT */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT COLUMN — RUNS LIST */}
          <section className="xl:col-span-1">
            <PlanItRuns
              runs={enrichedRuns}
              activeRunId={activeRunId}
              setActiveRunId={setActiveRunId}
            />
          </section>

          {/* MIDDLE COLUMN — ACTIVE RUN DETAILS */}
          <section className="xl:col-span-1">
            <PlanItActiveRun
              run={activeRun}
              orders={ordersForActiveRun}
            />
          </section>

          {/* RIGHT COLUMN — UNASSIGNED ORDERS */}
          <section className="xl:col-span-1">
            <PlanItOrders
              orders={availableOrders}
              homeZone={homeZone}
              selectedDate={selectedDate}
              onRefresh={triggerRefresh}
            />
          </section>

        </div>
      </div>
    </DragDropContext>
  );
};

export default function PlanItPage(props) {
  const {
    orders = [],
    runs = [],
    assignments = [],
    drivers = [],
    trucks = [],
    trailers = [],
    zones = [],
    pallets = [],
    surcharges = [],
    runActions,
    bulkAssignOrders,
    onDeleteRequest,
    onAssignmentCreated,
    isPopOut = false,
  } = props;

  const initialData = {
    orders,
    runs,
    assignments,
    drivers,
    trucks,
    trailers,
    zones,
    pallets,
    surcharges,
  };

  return (
    <PlanItProvider
      initialData={initialData}
      runActions={runActions}
      onAssignmentCreated={onAssignmentCreated}
      onDeleteRequest={onDeleteRequest}
      bulkAssignOrders={bulkAssignOrders}
    >
      <PlanItContent isPopOut={isPopOut} />
    </PlanItProvider>
  );
}

PlanItPage.propTypes = {
  orders: PropTypes.array,
  runs: PropTypes.array,
  assignments: PropTypes.array,
  drivers: PropTypes.array,
  trucks: PropTypes.array,
  trailers: PropTypes.array,
  zones: PropTypes.array,
  pallets: PropTypes.array,
  surcharges: PropTypes.array,
  runActions: PropTypes.object,
  bulkAssignOrders: PropTypes.func,
  onDeleteRequest: PropTypes.func,
  onAssignmentCreated: PropTypes.func,
  isPopOut: PropTypes.bool,
};
