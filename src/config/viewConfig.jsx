// frontend/src/config/viewConfig.js
import { Printer } from 'lucide-react';

// Pages
import PlanItPage from '@/pages/PlanItPage.jsx';
import FinancePage from '@/pages/FinancePage.jsx';
import PricingPage from '@/pages/PricingPage.jsx';
import RunManager from '@/pages/RunManager.jsx';
import SurchargeTypesManager from '@/components/SurchargeTypesManager.jsx';

// Lists
import OrderList from '@/components/list/OrderList.jsx';
import DriverList from '@/components/list/DriverList.jsx';
import TruckList from '@/components/list/TruckList.jsx';
import TrailerList from '@/components/list/TrailerList.jsx';
import CustomerList from '@/components/list/CustomerList.jsx';
import UserList from '@/components/list/UserList.jsx';

// Forms
import AddOrderForm from '@/components/forms/AddOrderForm.jsx';
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

  // Safety helper
  const safe = (value) => (Array.isArray(value) ? value : []);

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
  // 📌 BASE VIEWS – always available
  // ===========================================
  const baseConfig = {
    runs: {
      Component: RunManager,
      dataKey: 'runs',
      props: {
        runs: safeData.runs,
        trucks: safeData.trucks,
        trailers: safeData.trailers,
        drivers: safeData.drivers,
        runActions: actions?.runs,
        onDeleteRequest: handleDeleteRequest,
        onDataRefresh: refreshAll,
      },
      handleRefresh,
    },

    planit: {
      Component: PlanItPage,
      dataKey: null,
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
      Component: FinancePage,
      dataKey: 'invoices',
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
      Component: PricingPage,
      dataKey: null,
      props: {
        customers: safeData.customers,
        zones: safeData.zones,
        onRefresh: refreshAll,
      },
      handleRefresh,
    },

    surcharges: {
      Component: SurchargeTypesManager,
      dataKey: 'surcharges',
      props: {
        surcharges: safeData.surcharges,
      },
      handleRefresh,
    },
  };

  // ===========================================
  // 🔄 Reusable factory for LIST views
  // ===========================================
  const createListConfig = (
    ListComponent,
    FormComponent,
    key,
    formProps = {},
    customActions = []
  ) => ({
    ListComponent,
    FormComponent: FormComponent || null,
    dataKey: key,
    props: { onRefresh: handleRefresh },
    formProps,
    customActions,
    handleRefresh,
  });

  // ===========================================
  // 👑 ADMIN VIEWS (all lists + forms)
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
        customers: safeData.customers,
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
  // 🎯 FINAL CONFIG — based on role
  // ===========================================
  let finalConfig = { ...baseConfig };

  if (isAdmin) {
    finalConfig = { ...finalConfig, ...adminLists };
  }

  if (isDispatcher) {
    // dispatcher = only orders list
    finalConfig.orders = createListConfig(OrderList, null, 'orders');
  }

  return finalConfig;
};
