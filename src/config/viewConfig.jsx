// frontend/src/config/viewConfig.js
import React from 'react';
import { Printer } from 'lucide-react';

// Importuj komponenty
import RunManager from '../components/management/RunManager.jsx';
import PlanItPage from '../pages/PlanItPage.jsx';
import FinancePage from '../pages/FinancePage.jsx';
import PricingPage from '../pages/PricingPage.jsx';
import SurchargeTypesManager from '../components/SurchargeTypesManager.jsx';
import DriverList from '../components/list/DriverList.jsx';
import AddDriverForm from '../components/forms/AddDriverForm.jsx';
import TruckList from '../components/list/TruckList.jsx';
import AddTruckForm from '../components/forms/AddTruckForm.jsx';
import CustomerList from '../components/list/CustomerList.jsx';
import AddCustomerForm from '../components/forms/AddCustomerForm.jsx';
import TrailerList from '../components/list/TrailerList.jsx';
import AddTrailerForm from '../components/forms/AddTrailerForm.jsx';
import UserList from '../components/list/UserList.jsx';
import AddUserForm from '../components/forms/AddUserForm.jsx';
import OrderList from '../components/list/OrderList.jsx';
import AddOrderForm from '../components/AddOrderForm.jsx';

// Funkcja generująca konfigurację widoków
export const generateViewConfig = ({
  user,
  data,
  actions,
  refreshAll,
  handleDeleteRequest,
  handleEditOrderFromAnywhere,
  handlePrintLabels,
}) => {
  const isAdmin = user?.role === 'admin';
  const isDispatcher = user?.role === 'dispatcher';
  const { orders, drivers, trucks, trailers, users, assignments, runs, customers, zones, surcharges, invoices } = data || {};

  const baseConfig = {
    runs: { 
      Component: RunManager, 
      props: { runs, trucks, trailers, drivers, onDataRefresh: refreshAll, onDeleteRequest: handleDeleteRequest, runActions: actions.runs } 
    },
    planit: { 
      Component: PlanItPage, 
      props: { orders, runs, assignments, drivers, trucks, trailers, zones, pallets: data?.pallets || [], onAssignmentCreated: refreshAll, onEdit: handleEditOrderFromAnywhere, surcharges, runActions: actions.runs, onDeleteRequest: handleDeleteRequest, bulkAssignOrders: actions.assignments.bulkCreate } 
    },
    finance: { 
      Component: FinancePage, 
      props: { orders, customers, surcharges, invoices, onEdit: handleEditOrderFromAnywhere, onRefresh: refreshAll, invoiceActions: actions.invoices } 
    },
    pricing: { 
      Component: PricingPage, 
      props: { customers, zones, onRefresh: refreshAll } 
    },
    surcharges: { 
      Component: SurchargeTypesManager, 
      props: { surcharges } 
    },
  };

  const adminConfig = {
    drivers: { ListComponent: DriverList, FormComponent: AddDriverForm, data: drivers },
    trucks: { ListComponent: TruckList, FormComponent: AddTruckForm, data: trucks },
    customers: { ListComponent: CustomerList, FormComponent: AddCustomerForm, data: customers },
    trailers: { ListComponent: TrailerList, FormComponent: AddTrailerForm, data: trailers },
    users: { ListComponent: UserList, FormComponent: AddUserForm, data: users },
  };

  const dispatcherConfig = {
    orders: { 
      ListComponent: OrderList, 
      FormComponent: AddOrderForm, 
      formProps: { clients: customers, surcharges },
      data: orders,
      customActions: [
        { icon: <Printer size={16} />, onClick: handlePrintLabels, title: 'Print Pallet Labels' }
      ]
    },
  };

  let finalConfig = { ...baseConfig };
  if (isAdmin) {
    finalConfig = { ...finalConfig, ...adminConfig, ...dispatcherConfig };
  } else if (isDispatcher) {
    finalConfig = { ...finalConfig, ...dispatcherConfig };
  }

  return finalConfig;
};
