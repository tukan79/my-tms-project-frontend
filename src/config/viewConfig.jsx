// frontend/src/config/viewConfig.js
import { Printer } from 'lucide-react';

// Import Pages and major components
import PlanItPage from '@/pages/PlanItPage.jsx';
import FinancePage from '@/pages/FinancePage.jsx';
import PricingPage from '@/pages/PricingPage.jsx';
import RunManager from '@/pages/RunManager.jsx';
import SurchargeTypesManager from '@/components/SurchargeTypesManager.jsx';

// Import List Components
import OrderList from '@/components/list/OrderList.jsx';
import DriverList from '@/components/list/DriverList.jsx';
import TruckList from '@/components/list/TruckList.jsx';
import TrailerList from '@/components/list/TrailerList.jsx';
import CustomerList from '@/components/list/CustomerList.jsx';
import UserList from '@/components/list/UserList.jsx';

// Import Form Components
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
  handleRefresh, // Make sure to receive this
  handleEditOrderFromAnywhere,
  handlePrintLabels,
}) => {
  if (!data) {
    console.warn('⚠️ generateViewConfig called without data');
    return {};
  }

  const isAdmin = user?.role === 'admin';
  const isDispatcher = user?.role === 'dispatcher';

  // Bezpieczne parsowanie danych
  const safeData = {
    orders: Array.isArray(data.orders) ? data.orders : [],
    drivers: Array.isArray(data.drivers) ? data.drivers : [],
    trucks: Array.isArray(data.trucks) ? data.trucks : [],
    trailers: Array.isArray(data.trailers) ? data.trailers : [],
    users: Array.isArray(data.users) ? data.users : [],
    customers: Array.isArray(data.customers) ? data.customers : [],
    assignments: Array.isArray(data.assignments) ? data.assignments : [],
    runs: Array.isArray(data.runs) ? data.runs : [],
    zones: Array.isArray(data.zones) ? data.zones : [],
    surcharges: Array.isArray(data.surcharges) ? data.surcharges : [],
    invoices: Array.isArray(data.invoices) ? data.invoices : [],
  };

  console.log('📊 Safe data for view config:', {
    orders: safeData.orders.length,
    drivers: safeData.drivers.length, 
    trucks: safeData.trucks.length,
    trailers: safeData.trailers.length,
    users: safeData.users.length,
    customers: safeData.customers.length
  });

  const baseConfig = {
    runs: { 
      Component: RunManager,
      props: { 
        runs: safeData.runs, 
        trucks: safeData.trucks, 
        trailers: safeData.trailers, 
        drivers: safeData.drivers, 
        onDataRefresh: refreshAll, 
        onDeleteRequest: handleDeleteRequest, 
        runActions: actions?.runs 
      }
    },
    planit: { 
      Component: PlanItPage,
      props: { 
        orders: safeData.orders, 
        runs: safeData.runs, 
        assignments: safeData.assignments, 
        drivers: safeData.drivers, 
        trucks: safeData.trucks, 
        trailers: safeData.trailers, 
        zones: safeData.zones, 
        pallets: data?.pallets || [], 
        onAssignmentCreated: refreshAll, 
        onEdit: handleEditOrderFromAnywhere, 
        surcharges: safeData.surcharges, 
        runActions: actions?.runs, 
        onDeleteRequest: handleDeleteRequest, 
        bulkAssignOrders: actions?.assignments?.bulkCreate 
      }
    },
    finance: { 
      Component: FinancePage, 
      props: { 
        orders: safeData.orders, 
        customers: safeData.customers, 
        surcharges: safeData.surcharges, 
        invoices: safeData.invoices, 
        onEdit: handleEditOrderFromAnywhere, 
        onRefresh: refreshAll, 
        invoiceActions: actions.invoices 
      } 
    },
    pricing: { 
      Component: PricingPage, 
      props: { 
        customers: safeData.customers, 
        zones: safeData.zones, 
        onRefresh: refreshAll 
      } 
    },
    surcharges: { 
      Component: SurchargeTypesManager, 
      props: { 
        surcharges: safeData.surcharges 
      } 
    },
  };

  // Funkcja helper do tworzenia konfiguracji list
  const createListConfig = (ListComponent, FormComponent, dataKey, formProps = {}, customActions = []) => {
    const config = {
      dataKey,
      ListComponent,
      handleRefresh, // Pass it down to the config object
    };
    
    if (FormComponent) {
      config.FormComponent = FormComponent;
      config.formProps = formProps;
    }

    // 🎯 Kluczowa poprawka: Upewnij się, że niestandardowe akcje są przekazywane.
    if (customActions && customActions.length > 0) {
      config.customActions = customActions;
    }
    
    return config;
  };

  const adminConfig = {
    drivers: createListConfig(DriverList, AddDriverForm, 'drivers'),
    trucks: createListConfig(TruckList, AddTruckForm, 'trucks'),
    customers: createListConfig(CustomerList, AddCustomerForm, 'customers'),
    trailers: createListConfig(TrailerList, AddTrailerForm, 'trailers'),
    users: createListConfig(UserList, AddUserForm, 'users'),
  };

  // Konfiguracja dla admina
  const adminOnlyConfig = {
    ...adminConfig,
    orders: createListConfig(
      OrderList, 
      AddOrderForm, 
      'orders', 
      { 
        clients: safeData.customers, 
        surcharges: safeData.surcharges 
      },
      [{ icon: <Printer size={16} />, onClick: handlePrintLabels, title: 'Print Pallet Labels' }]
    ),
  };

  let finalConfig = { ...baseConfig };
  if (isAdmin) {
    finalConfig = { ...finalConfig, ...adminOnlyConfig };
  } else if (isDispatcher) {
    // Dispatcher ma dostęp tylko do odczytu zamówień
    finalConfig = { 
      ...finalConfig,
      orders: createListConfig(OrderList, null, 'orders')
    };
  }

  console.log('🎯 Final view config keys:', Object.keys(finalConfig));
  return finalConfig;
};