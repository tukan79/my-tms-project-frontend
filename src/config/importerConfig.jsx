import { Se } from '@/utils/importerUtils.js';

export const importerConfigs = {
  drivers: {
    title: 'Import Drivers',
    apiEndpoint: '/api/drivers/import',
    postDataKey: 'drivers',
    dataMappingFn: (row) => {
      // Pomiń wiersz, jeśli brakuje kluczowych danych
      if (!row.first_name && !row.login_code) {
        console.warn('Skipping driver row due to missing first_name and login_code:', row);
        return null;
      }
      return {
        // Bezpieczne czyszczenie danych z niechcianych znaków
        first_name: row.first_name?.replace(/"/g, '').trim() || null,
        last_name: row.last_name?.replace(/"/g, '').trim() || null,
        phone_number: row.phone_number || null,
        license_number: row.license_number || null,
        cpc_number: row.cpc_number || null,
        login_code: row.login_code || null,
        is_active: !['false', '0', 'no'].includes(String(row.is_active).toLowerCase()),
      };
    },
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
    dataMappingFn: (row) => {
      // Pomiń wiersz, jeśli brakuje numeru rejestracyjnego
      if (!row.registration_plate) {
        console.warn('Skipping truck row due to missing registration_plate:', row);
        return null;
      }
      return {
        registration_plate: row.registration_plate?.trim() || '',
        // Bezpieczne czyszczenie danych z niechcianych znaków
        brand: row.brand?.replace(/"/g, '').trim() || '',
        model: row.model?.replace(/"/g, '').trim() || '',
        vin: row.vin || '',
        production_year: row.production_year ? parseInt(row.production_year, 10) : null,
        type_of_truck: row.type_of_truck || 'tractor',
        total_weight: row.total_weight ? parseInt(row.total_weight, 10) : null,
        pallet_capacity: row.pallet_capacity ? parseInt(row.pallet_capacity, 10) : null,
        max_payload_kg: row.max_payload_kg ? parseInt(row.max_payload_kg, 10) : null,
        is_active: !['false', '0', 'no'].includes(String(row.is_active).toLowerCase()),
      };
    },
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
    dataMappingFn: (row) => {
      if (!row.registration_plate) {
        console.warn('Skipping trailer row due to missing registration_plate:', row);
        return null;
      }
      return {
        registration_plate: row.registration_plate || '',
        description: row.description?.replace(/"/g, '').trim() || '',
        category: row.category || 'Own',
        brand: row.brand?.replace(/"/g, '').trim() || 'Unknown',
        max_payload_kg: row.max_payload_kg ? parseInt(row.max_payload_kg, 10) : null,
        max_spaces: row.max_spaces ? parseInt(row.max_spaces, 10) : null,
        status: row.status ? row.status.toLowerCase() : 'inactive',
        is_active: !['false', '0', 'no', 'in-active'].includes(String(row.is_active || row.status).toLowerCase()),
      };
    },
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
    // 🎯 FIX: Explicitly map CSV columns to backend fields for safety.
    // This prevents errors if CSV headers don't match the database schema.
    dataMappingFn: (row) => {
      // Pomiń wiersz, jeśli brakuje kluczowych danych (kod lub nazwa klienta).
      if (!row.customer_code || !row.name) {
        console.warn('Skipping customer row due to missing code or name:', row);
        return null;
      }
      return {
        customer_code: row.customer_code.trim(),
        name: row.name.trim(),
        // Używamy || '' aby zapewnić, że puste lub brakujące pola będą pustymi stringami.
        address_line1: row.address_line1 || '',
        address_line2: row.address_line2 || '',
        postcode: row.postcode || '',
        phone_number: row.phone_number || '',
        vat_number: row.vat_number || '',
      };
    },
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
    dataMappingFn: (row) => {
      // Walidacja: Pomiń wiersz, jeśli brakuje kluczowych pól
      if (!row.ConsignmentNumber || !row.AccountCode) {
        console.warn('Skipping row due to missing ConsignmentNumber or AccountCode:', row);
        return null;
      }

      // Mapowanie ilości palet z różnych kolumn
      const pallets = [];
      if (parseInt(row.FullQ, 10) > 0) pallets.push({ type: 'Full', quantity: parseInt(row.FullQ, 10) || 0 });
      if (parseInt(row.HalfQ, 10) > 0) pallets.push({ type: 'Half', quantity: parseInt(row.HalfQ, 10) || 0 });
      if (parseInt(row.HalfPlusQ, 10) > 0) pallets.push({ type: 'HalfPlus', quantity: parseInt(row.HalfPlusQ, 10) || 0 });
      if (parseInt(row.QuarterQ, 10) > 0) pallets.push({ type: 'Quarter', quantity: parseInt(row.QuarterQ, 10) || 0 });
      if (parseInt(row.MicroQ, 10) > 0) pallets.push({ type: 'Micro', quantity: parseInt(row.MicroQ, 10) || 0 });

      // Funkcja do bezpiecznego parsowania daty
      const parseDate = (dateStr, timeStr = '00:00') => {
        if (!dateStr) return new Date().toISOString();
        try {
          // Łączymy datę i czas, jeśli czas jest dostępny
          const dateTimeString = `${dateStr}T${timeStr || '00:00'}`;
          const date = new Date(dateTimeString);
          // Sprawdzamy, czy data jest prawidłowa
          return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
        } catch (e) {
          return new Date().toISOString();
        }
      };

      return {
        order_number: row.ConsignmentNumber,
        customer_reference: row.CustomerReference || null,
        customer_code: row.AccountCode,
        status: 'nowe', // Domyślny status
        sender_details: {
          name: row.CollectionName || 'N/A',
          address1: row.CollectionAddress1 || 'N/A',
          address2: row.CollectionAddress2 || '',
          townCity: row.CollectionTownCity || 'N/A',
          postCode: row.CollectionPostCode || 'N/A',
        },
        recipient_details: {
          name: row.DeliveryName || 'N/A',
          address1: row.DeliveryAddress1 || 'N/A',
          address2: row.DeliveryAddress2 || '',
          townCity: row.DeliveryTownCity || 'N/A',
          postCode: row.DeliveryPostCode || 'N/A',
        },
        loading_date_time: parseDate(row.CollectionDate, row.CollectionTime),
        unloading_date_time: parseDate(row.DeliveryDate, row.DeliveryTime),
        cargo_details: {
          description: row.DeliveryNoteLine1 || 'No description',
          pallets: pallets,
          total_weight_kg: parseFloat(row.TotalKilos || 0),
        },
      };
    },
    previewColumns: [
      Se('order_number', 'Consignment #'),
      Se('customer_code', 'Customer Code'),
      Se('sender_details.name', 'Sender'),
      Se('recipient_details.name', 'Recipient'),
    ],
  },
  rateCards: {
    title: 'Import Rate Cards',
    apiEndpoint: '/api/rate-cards/import',
    postDataKey: 'rateCards',
    dataMappingFn: (row) => {
      // Walidacja - pomiń wiersz, jeśli brakuje kluczowych danych
      if (!row['Rate Type'] || !row['Zone Name']) {
        console.warn('Skipping rate card row due to missing Rate Type or Zone Name:', row);
        return null;
      }

      // Mapowanie cen z kolumn CSV do obiektu 'prices'
      const prices = {
        micro: parseFloat(row['Price Micro'] || 0),
        quarter: parseFloat(row['Price Quarter'] || 0),
        half: parseFloat(row['Price Half'] || 0),
        half_plus: parseFloat(row['Price Half Plus'] || 0),
        full_1: parseFloat(row['Price Full 1'] || 0),
        full_2: parseFloat(row['Price Full 2'] || 0),
        full_3: parseFloat(row['Price Full 3'] || 0),
        full_4: parseFloat(row['Price Full 4'] || 0),
        full_5: parseFloat(row['Price Full 5'] || 0),
        full_6: parseFloat(row['Price Full 6'] || 0),
        full_7: parseFloat(row['Price Full 7'] || 0),
        full_8: parseFloat(row['Price Full 8'] || 0),
        full_9: parseFloat(row['Price Full 9'] || 0),
        full_10: parseFloat(row['Price Full 10'] || 0),
      };

      return {
        rate_type: row['Rate Type'],
        zone_name: row['Zone Name'],
        service_level: row['Service Level'],
        prices: prices,
      };
    },
    previewColumns: [
      Se('rate_type', 'Type'), Se('zone_name', 'Zone'), Se('service_level', 'Service')
    ],
  },
};
