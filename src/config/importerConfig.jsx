import { Se } from '@/utils/importerUtils.js';

/**
 * Helpers – PRO
 * --------------------------------------
 * - cleanText: usuwa cudzysłowy, trimuje, zwraca '' zamiast null
 * - toIntOrNull / toFloatOrZero: bezpieczne parsowanie liczb
 * - toBoolean: spójna logika true/false dla CSV
 */

const cleanText = (value) =>
  typeof value === 'string'
    ? value.replaceAll('"', '').trim()
    : (value ?? '').toString().trim();

const toIntOrNull = (value) => {
  const n = Number.parseInt(value, 10);
  return Number.isNaN(n) ? null : n;
};

const toFloatOrZero = (value) => {
  const n = Number.parseFloat(value);
  return Number.isNaN(n) ? 0 : n;
};

const toBoolean = (value, falsyValues = ['false', '0', 'no', 'inactive', 'in-active']) => {
  const normalized = String(value ?? '').toLowerCase().trim();
  if (!normalized) return true; // domyślnie true jeśli puste
  return !falsyValues.includes(normalized);
};

/**
 * importerConfigs – PRO
 * Każdy importer:
 *  - waliduje wymagane pola
 *  - loguje pominięte wiersze
 *  - bezpiecznie czyści i mapuje dane
 */

export const importerConfigs = {
  /* ---------------------- DRIVERS ---------------------- */
  drivers: {
    title: 'Import Drivers',
    apiEndpoint: '/api/drivers/import',
    postDataKey: 'drivers',
    dataMappingFn: (row) => {
      if (!row.first_name && !row.login_code) {
        console.warn(
          '[IMPORT:DRIVERS] Skipping row – missing first_name and login_code:',
          row
        );
        return null;
      }

      return {
        first_name: cleanText(row.first_name) || null,
        last_name: cleanText(row.last_name) || null,
        phone_number: row.phone_number || null,
        license_number: row.license_number || null,
        cpc_number: row.cpc_number || null,
        login_code: row.login_code || null,
        is_active: toBoolean(row.is_active),
      };
    },
    previewColumns: [
      Se('first_name', 'First Name'),
      Se('last_name', 'Last Name'),
      Se('phone_number', 'Phone'),
    ],
  },

  /* ---------------------- TRUCKS (VEHICLES) ---------------------- */
  trucks: {
    title: 'Import Vehicles',
    apiEndpoint: '/api/trucks/import',
    postDataKey: 'trucks',
    dataMappingFn: (row) => {
      if (!row.registration_plate) {
        console.warn(
          '[IMPORT:TRUCKS] Skipping row – missing registration_plate:',
          row
        );
        return null;
      }

      return {
        registration_plate: cleanText(row.registration_plate),
        brand: cleanText(row.brand),
        model: cleanText(row.model),
        vin: row.vin || '',
        production_year: toIntOrNull(row.production_year),
        type_of_truck: row.type_of_truck || 'tractor',
        total_weight: toIntOrNull(row.total_weight),
        pallet_capacity: toIntOrNull(row.pallet_capacity),
        max_payload_kg: toIntOrNull(row.max_payload_kg),
        is_active: toBoolean(row.is_active),
      };
    },
    previewColumns: [
      Se('registration_plate', 'Reg. Plate'),
      Se('brand', 'Brand'),
      Se('type_of_truck', 'Type'),
    ],
  },

  /* ---------------------- TRAILERS ---------------------- */
  trailers: {
    title: 'Import Trailers',
    apiEndpoint: '/api/trailers/import',
    postDataKey: 'trailers',
    dataMappingFn: (row) => {
      if (!row.registration_plate) {
        console.warn(
          '[IMPORT:TRAILERS] Skipping row – missing registration_plate:',
          row
        );
        return null;
      }

      const status = (row.status || '').toLowerCase();

      return {
        registration_plate: cleanText(row.registration_plate),
        description: cleanText(row.description),
        category: row.category || 'Own',
        brand: cleanText(row.brand) || 'Unknown',
        max_payload_kg: toIntOrNull(row.max_payload_kg),
        max_spaces: toIntOrNull(row.max_spaces),
        status: status || 'inactive',
        is_active: toBoolean(row.is_active ?? row.status),
      };
    },
    previewColumns: [
      Se('registration_plate', 'Reg. Plate'),
      Se('description', 'Description'),
      Se('max_payload_kg', 'Payload (kg)'),
      Se('status', 'Status'),
    ],
  },

  /* ---------------------- USERS ---------------------- */
  users: {
    title: 'Import Users',
    apiEndpoint: '/api/users/import',
    postDataKey: 'users',
    dataMappingFn: (row) => {
      if (!row.email) {
        console.warn('[IMPORT:USERS] Skipping row – missing email:', row);
        return null;
      }

      return {
        email: cleanText(row.email).toLowerCase(),
        first_name: cleanText(row.first_name) || null,
        last_name: cleanText(row.last_name) || null,
        role: row.role || 'dispatcher',
        password: row.password, // backend hashuje
      };
    },
    previewColumns: [
      Se('email', 'Email'),
      Se('first_name', 'First Name'),
      Se('role', 'Role'),
    ],
  },

  /* ---------------------- CUSTOMERS ---------------------- */
  customers: {
    title: 'Import Customers',
    apiEndpoint: '/api/customers/import',
    postDataKey: 'customers',
    dataMappingFn: (row) => {
      if (!row.customer_code || !row.name) {
        console.warn(
          '[IMPORT:CUSTOMERS] Skipping row – missing customer_code or name:',
          row
        );
        return null;
      }

      return {
        customer_code: cleanText(row.customer_code),
        name: cleanText(row.name),
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

  /* ---------------------- ORDERS ---------------------- */
  orders: {
    title: 'Import Orders',
    apiEndpoint: '/api/orders/import',
    postDataKey: 'orders',
    dataMappingFn: (row) => {
      if (!row.ConsignmentNumber || !row.AccountCode) {
        console.warn(
          '[IMPORT:ORDERS] Skipping row – missing ConsignmentNumber or AccountCode:',
          row
        );
        return null;
      }

      const pallets = [];
      const pushIf = (val, type) => {
        const n = Number.parseInt(val, 10);
        if (n > 0) pallets.push({ type, quantity: n });
      };

      pushIf(row.FullQ, 'Full');
      pushIf(row.HalfQ, 'Half');
      pushIf(row.HalfPlusQ, 'HalfPlus');
      pushIf(row.QuarterQ, 'Quarter');
      pushIf(row.MicroQ, 'Micro');

      const parseDate = (dateStr, timeStr = '00:00') => {
        if (!dateStr) return new Date().toISOString();
        try {
          const dt = new Date(`${dateStr}T${timeStr || '00:00'}`);
          return Number.isNaN(dt.getTime())
            ? new Date().toISOString()
            : dt.toISOString();
        } catch (err) {
          console.warn('[IMPORT:ORDERS] parseDate failed, fallback to now()', {
            dateStr,
            timeStr,
            err,
          });
          return new Date().toISOString();
        }
      };

      return {
        order_number: row.ConsignmentNumber,
        customer_reference: row.CustomerReference || null,
        customer_code: row.AccountCode,
        status: 'nowe',
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
          pallets,
          total_weight_kg: toFloatOrZero(row.TotalKilos),
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

  /* ---------------------- RATE CARDS ---------------------- */
  rateCards: {
    title: 'Import Rate Cards',
    apiEndpoint: '/api/rate-cards/import',
    postDataKey: 'rateCards',
    dataMappingFn: (row) => {
      if (!row['Rate Type'] || !row['Zone Name']) {
        console.warn(
          '[IMPORT:RATECARDS] Skipping row – missing Rate Type or Zone Name:',
          row
        );
        return null;
      }

      const prices = {
        micro: toFloatOrZero(row['Price Micro']),
        quarter: toFloatOrZero(row['Price Quarter']),
        half: toFloatOrZero(row['Price Half']),
        half_plus: toFloatOrZero(row['Price Half Plus']),
        full_1: toFloatOrZero(row['Price Full 1']),
        full_2: toFloatOrZero(row['Price Full 2']),
        full_3: toFloatOrZero(row['Price Full 3']),
        full_4: toFloatOrZero(row['Price Full 4']),
        full_5: toFloatOrZero(row['Price Full 5']),
        full_6: toFloatOrZero(row['Price Full 6']),
        full_7: toFloatOrZero(row['Price Full 7']),
        full_8: toFloatOrZero(row['Price Full 8']),
        full_9: toFloatOrZero(row['Price Full 9']),
        full_10: toFloatOrZero(row['Price Full 10']),
      };

      return {
        rate_type: row['Rate Type'],
        zone_name: row['Zone Name'],
        service_level: row['Service Level'],
        prices,
      };
    },
    previewColumns: [
      Se('rate_type', 'Type'),
      Se('zone_name', 'Zone'),
      Se('service_level', 'Service'),
    ],
  },
};
