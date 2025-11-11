import { Se } from '@/utils/importerUtils.js';

export const importerConfigs = {
  drivers: {
    title: 'Import Drivers',
    apiEndpoint: '/api/drivers/import',
    postDataKey: 'drivers',
    dataMappingFn: (row) => ({
      first_name: row.first_name || null,
      last_name: row.last_name || null,
      phone_number: row.phone_number || null,
      license_number: row.license_number || null,
    }),
    previewColumns: [
      Se('first_name', 'First Name'),
      Se('last_name', 'Last Name'),
      Se('phone_number', 'Phone'),
    ],
  },
  trucks: {
    title: 'Import Vehicles',
    apiEndpoint: '/api/trucks/import',
    postDataKey: 'trucks',
    dataMappingFn: (row) => ({
      registration_plate: row.registration_plate || '',
      brand: row.brand || '',
      model: row.model || '',
      vin: row.vin || '',
      production_year: row.production_year ? parseInt(row.production_year, 10) : null,
      type_of_truck: row.type_of_truck || 'tractor',
      total_weight: row.total_weight ? parseInt(row.total_weight, 10) : null,
      pallet_capacity: row.pallet_capacity ? parseInt(row.pallet_capacity, 10) : null,
      max_payload_kg: row.max_payload_kg ? parseInt(row.max_payload_kg, 10) : null,
      is_active: !['false', '0', 'no'].includes(String(row.is_active).toLowerCase()),
    }),
    previewColumns: [
      Se('registration_plate', 'Reg. Plate'),
      Se('brand', 'Brand'),
      Se('type_of_truck', 'Type'),
    ],
  },
  trailers: {
    title: 'Import Trailers',
    apiEndpoint: '/api/trailers/import',
    postDataKey: 'trailers',
    dataMappingFn: (row) => ({
      registration_plate: row.registration_plate || '',
      description: row.description || '',
      category: row.category || 'Own',
      brand: row.brand || 'Unknown',
      max_payload_kg: row.max_payload_kg ? parseInt(row.max_payload_kg, 10) : null,
      max_spaces: row.max_spaces ? parseInt(row.max_spaces, 10) : null,
      status: row.status ? row.status.toLowerCase() : 'inactive',
    }),
    previewColumns: [
      Se('registration_plate', 'Reg. Plate'),
      Se('description', 'Description'),
      Se('max_payload_kg', 'Payload (kg)'),
      Se('status', 'Status'),
    ],
  },
  users: {
    title: 'Import Users',
    apiEndpoint: '/api/users/import',
    postDataKey: 'users',
    dataMappingFn: (row) => ({
      email: row.email,
      first_name: row.first_name,
      last_name: row.last_name,
      role: row.role || 'dispatcher',
      password: row.password, // Backend should handle hashing
    }),
    previewColumns: [
      Se('email', 'Email'),
      Se('first_name', 'First Name'),
      Se('role', 'Role'),
    ],
  },
  customers: {
    title: 'Import Customers',
    apiEndpoint: '/api/customers/import',
    postDataKey: 'customers',
    dataMappingFn: (row) => row, // Assuming direct mapping
    previewColumns: [
      Se('customer_code', 'Code'),
      Se('name', 'Name'),
      Se('postcode', 'Postcode'),
    ],
  },
  orders: {
    title: 'Import Orders',
    apiEndpoint: '/api/orders/import',
    postDataKey: 'orders',
    dataMappingFn: (row) => ({
      order_number: row.ConsignmentNumber,
      customer_reference: row.CustomerReference,
      customer_code: row.AccountCode,
      status: 'nowe',
      sender_details: {
        name: row.CollectionName,
        address1: row.CollectionAddress1,
        townCity: row.CollectionTownCity,
        postCode: row.CollectionPostCode,
      },
      recipient_details: {
        name: row.DeliveryName,
        address1: row.DeliveryAddress1,
        townCity: row.DeliveryTownCity,
        postCode: row.DeliveryPostCode,
      },
      // ... (pozostałe mapowanie dla zamówień)
    }),
    previewColumns: [
      Se('order_number', 'Consignment #'),
      Se('customer_code', 'Customer Code'),
      Se('sender_details.name', 'Sender'),
      Se('recipient_details.name', 'Recipient'),
    ],
  },
};
