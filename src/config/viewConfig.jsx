// frontend/src/config/viewConfig.js
import { Printer } from 'lucide-react';

// Import Pages
import PlanItPage from '@/pages/PlanItPage.jsx';
import FinancePage from '@/pages/FinancePage.jsx';
import PricingPage from '@/pages/PricingPage.jsx';
import RunManager from '@/pages/RunManager.jsx';
import SurchargeTypesManager from '@/components/SurchargeTypesManager.jsx';

// Import Lists
import OrderList from '@/components/list/OrderList.jsx';
import DriverList from '@/components/list/DriverList.jsx';
import TruckList from '@/components/list/TruckList.jsx';
import TrailerList from '@/components/list/TrailerList.jsx';
import CustomerList from '@/components/list/CustomerList.jsx';
import UserList from '@/components/list/UserList.jsx';

// Import Forms
import AddOrderForm from '@/components/AddOrderForm.jsx';
import AddDriverForm from '@/components/forms/AddDriverForm.jsx';
import AddTruckForm from '@/components/forms/AddTruckForm.jsx';
import AddTrailerForm from '@/components/forms/AddTrailerForm.jsx';
import AddCustomerForm from '@/components/forms/AddCustomerForm.jsx';
import AddUserForm from '@/components/forms/AddUserForm.jsx';

export const generateViewConfig = ({
  user,
  data,
  actions,
  refreshAll,
  handleDeleteRequest,
  handleRefresh,
  handleEditOrderFromAnywhere,
  handlePrintLabels,
}) => {
  if (!data) return {};

  const isAdmin = user?.role === 'admin';
  const isDispatcher = user?.role === 'dispatcher';

  // 🛡 Safe arrays
  const safe = (arr) => (Array.isArray(arr) ? arr : []);

  const safeData = {
    orders: safe(data.orders),
    drivers: safe(data.drivers),
    trucks: safe(data.trucks),
    trailers: safe(data.trailers),
    users: safe(data.users),
    customers: safe(data.customers),
    assignments: safe(data.assignments),
    runs: safe(data.runs),
    zones: safe(data.zones),
    surcharges: safe(data.surcharges),
    invoices: safe(data.invoices),
    pallets: safe(data.pallets),
  };

  // ===========================================
  // 🌐 BASE VIEWS — SINGLE COMPONENT VIEWS
  // ===========================================
  const baseConfig = {
    runs: {
      dataKey: 'runs',
      Component: RunManager,
      props: {
        runs: safeData.runs,
        trucks: safeData.trucks,
        trailers: safeData.trailers,
        drivers: safeData.drivers,
        onDataRefresh: refreshAll,
        onDeleteRequest: handleDeleteRequest,
        runActions: actions?.runs,
      },
      handleRefresh,
    },

    planit: {
      dataKey: null, // explicit — not using lists
      Component: PlanItPage,
      props: {
        orders: safeData.orders,
        runs: safeData.runs,
        assignments: safeData.assignments,
        drivers: safeData.drivers,
        trucks: safeData.trucks,
        trailers: safeData.trailers,
        zones: safeData.zones,
        pallets: safeData.pallets,
        surcharges: safeData.surcharges,
        runActions: actions?.runs,
        bulkAssignOrders: actions?.assignments?.bulkCreate,
        onDeleteRequest: handleDeleteRequest,
        onEdit: handleEditOrderFromAnywhere,
        onAssignmentCreated: refreshAll,
      },
      handleRefresh,
    },

    finance: {
      dataKey: 'invoices',
      Component: FinancePage,
      props: {
        orders: safeData.orders,
        customers: safeData.customers,
        surcharges: safeData.surcharges,
        invoices: safeData.invoices,
        onEdit: handleEditOrderFromAnywhere,
        onRefresh: refreshAll,
        invoiceActions: actions?.invoices,
      },
      handleRefresh,
    },

    pricing: {
      dataKey: null,
      Component: PricingPage,
      props: {
        customers: safeData.customers,
        zones: safeData.zones,
        onRefresh: refreshAll,
      },
      handleRefresh,
    },

    surcharges: {
      dataKey: 'surcharges',
      Component: SurchargeTypesManager,
      props: {
        surcharges: safeData.surcharges,
      },
      handleRefresh,
    },
  };

  // ===========================================
  // 📋 REUSABLE LIST CREATOR
  // ===========================================
  const createListConfig = (ListComponent, FormComponent, key, formProps = {}, customActions = []) => ({
    dataKey: key,
    ListComponent,
    FormComponent: FormComponent || null,
    props: { handleRefresh },
    formProps,
    customActions,
    handleRefresh,
  });

  // ===========================================
  // 👑 ADMIN LIST VIEWS
  // ===========================================
  const adminLists = {
    drivers: createListConfig(DriverList, AddDriverForm, 'drivers'),
    trucks: createListConfig(TruckList, AddTruckForm, 'trucks'),
    customers: createListConfig(CustomerList, AddCustomerForm, 'customers'),
    trailers: createListConfig(TrailerList, AddTrailerForm, 'trailers'),
    users: createListConfig(UserList, AddUserForm, 'users'),

    orders: createListConfig(
      OrderList,
      AddOrderForm,
      'orders',
      {
        clients: safeData.customers,
        surcharges: safeData.surcharges,
      },
      [
        {
          icon: <Printer size={16} />,
          title: 'Print Pallet Labels',
          onClick: handlePrintLabels,
        },
      ]
    ),
  };

  // ===========================================
  // 📦 FINAL CONFIG BASED ON ROLE
  // ===========================================
  let finalConfig = { ...baseConfig };

  if (isAdmin) {
    finalConfig = { ...finalConfig, ...adminLists };
  }

  if (isDispatcher) {
    // dispatcher sees orders list only (readonly mode)
    finalConfig.orders = createListConfig(OrderList, null, 'orders');
  }

  return finalConfig;
};
