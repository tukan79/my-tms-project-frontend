import React from "react";
import PropTypes from "prop-types";
import {
  Truck,
  User,
  Package,
  Weight,
  X,
  ExternalLink,
  Clock,
} from "lucide-react";

export default function PlanItActiveRun({
  run,
  orders,
  onUnassign,
  onOpenOrder,
}) {
  if (!run) {
    return (
      <div className="p-6 rounded-xl bg-gray-50 text-gray-500 text-center text-sm">
        Select a run on the left to view assignments.
      </div>
    );
  }

  const overload =
    (run.maxPayload && run.totalKilos > run.maxPayload) ||
    (run.maxPallets && run.totalSpaces > run.maxPallets);

  return (
    <div className="space-y-5">
      {/* HEADER CARD */}
      <div className="rounded-xl border bg-white shadow-sm p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {run.displayText}
          </h2>

          <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-xs">
            Active Run
          </span>
        </div>

        {/* META */}
        <div className="grid grid-cols-2 gap-4 mt-4 text-sm text-gray-700">
          {/* Driver */}
          <div className="flex items-center gap-2">
            <User size={16} className="text-gray-500" />
            <span>{run.displayDriver}</span>
          </div>

          {/* Vehicle */}
          <div className="flex items-center gap-2">
            <Truck size={16} className="text-gray-500" />
            <span>{run.displayTruck}</span>
            {run.displayTrailer && (
              <span className="text-gray-500">{run.displayTrailer}</span>
            )}
          </div>
        </div>

        {/* CAPACITY */}
        {run.hasCapacity && (
          <div className="mt-4 flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Weight size={16} className="text-gray-500" />
              <span>
                {run.totalKilos} / {run.maxPayload} kg
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Package size={16} className="text-gray-500" />
              <span>
                {run.totalSpaces} / {run.maxPallets} spaces
              </span>
            </div>

            {overload && (
              <span className="text-red-600 font-medium">
                Over capacity – review!
              </span>
            )}
          </div>
        )}
      </div>

      {/* ORDERS LIST */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-medium text-gray-800">Assigned Orders</h3>
          <span className="text-sm text-gray-500">{orders.length} items</span>
        </div>

        {orders.length === 0 ? (
          <div className="p-6 text-center text-gray-500 text-sm">
            No orders assigned to this run.
          </div>
        ) : (
          <ul className="divide-y">
            {orders.map((order) => (
              <li
                key={order.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                {/* LEFT */}
                <div className="flex flex-col">
                  <span className="font-medium text-gray-800">
                    #{order.order_number}
                  </span>

                  <div className="text-sm text-gray-600 flex gap-4 mt-1">
                    <span>{order.customer_reference}</span>
                    <span className="text-gray-400">•</span>
                    <span>{order.sender_details?.postCode}</span>
                    →
                    <span>{order.recipient_details?.postCode}</span>
                  </div>

                  {/* BADGES */}
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      {order.cargo_details?.total_spaces} spaces
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">
                      {order.cargo_details?.total_kilos} kg
                    </span>
                  </div>
                </div>

                {/* RIGHT ACTIONS */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onOpenOrder(order)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Open order"
                  >
                    <ExternalLink size={18} />
                  </button>

                  <button
                    onClick={() => onUnassign(order.assignmentId)}
                    className="text-red-500 hover:text-red-700"
                    title="Remove from run"
                  >
                    <X size={18} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* SIMPLE TIMELINE */}
      <div className="rounded-xl border bg-white shadow-sm p-5">
        <h3 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
          <Clock size={16} /> Timeline Preview
        </h3>

        <div className="h-2 w-full bg-gray-200 rounded relative">
          {/* Fake time markers (optional improvement later) */}
          <div className="absolute left-1/4 top-0 h-2 w-0.5 bg-gray-500 opacity-40" />
          <div className="absolute left-2/4 top-0 h-2 w-0.5 bg-gray-500 opacity-40" />
          <div className="absolute left-3/4 top-0 h-2 w-0.5 bg-gray-500 opacity-40" />
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Advanced timeline module coming soon — this is a placeholder.
        </p>
      </div>
    </div>
  );
}

PlanItActiveRun.propTypes = {
  run: PropTypes.object,
  orders: PropTypes.array.isRequired,
  onUnassign: PropTypes.func.isRequired,
  onOpenOrder: PropTypes.func.isRequired,
};
