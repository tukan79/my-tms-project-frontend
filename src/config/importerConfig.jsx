export const importerConfig = {
  drivers: {
    title: 'Import Drivers',
    apiEndpoint: '/api/drivers/import',
    postDataKey: 'drivers',
    dataMappingFn: (row) => ({
      first_name: row.first_name,
      last_name: row.last_name,
      phone_number: row.phone_number,
      license_number: row.license_number,
    }),
    previewColumns: [
      { key: 'first_name', header: 'First Name' },
      { key: 'last_name', header: 'Last Name' },
      { key: 'phone_number', header: 'Phone' },
    ],
  },
  // Można dodać więcej konfiguracji dla innych widoków
  // customers: { ... }
};
