export const safeParseData = (rawData, expectedKeys = []) => {
  const result = {};
  
  // 🎯 FIX: Add a guard clause to handle cases where rawData is null or undefined.
  // This prevents the function from trying to access properties on an invalid object.
  if (!rawData || typeof rawData !== 'object') {
    expectedKeys.forEach(key => {
      result[key] = [];
    });
    return result;
  }

  expectedKeys.forEach(key => {
    if (rawData[key] !== undefined && rawData[key] !== null) {
      // Jeśli dane są bezpośrednio tablicą
      if (Array.isArray(rawData[key])) {
        result[key] = rawData[key];
      } 
      // Jeśli dane są w formacie { users: [...] }
      else if (rawData[key] && rawData[key][key] && Array.isArray(rawData[key][key])) {
        result[key] = rawData[key][key];
      }
      // Jeśli dane są w formacie { data: [...] }
      else if (rawData[key] && rawData[key].data && Array.isArray(rawData[key].data)) {
        result[key] = rawData[key].data;
      }
      // W innym przypadku pusta tablica
      else {
        result[key] = [];
      }
    } else {
      result[key] = [];
    }
  });
  
  return result;
};

export const logDataState = (data, context = '') => {
  // Zabezpieczenie: Upewnij się, że `data` jest obiektem przed próbą pobrania kluczy.
  if (!data || typeof data !== 'object') {
    console.log(`📊 ${context} Data State: Invalid data object received`, data);
    return;
  }
  console.log(`📊 ${context} Data State:`, 
    Object.keys(data).map(key => ({
      key,
      length: Array.isArray(data[key]) ? data[key].length : 'N/A (not an array)', // Bezpieczny dostęp do length
      type: Array.isArray(data[key]) ? 'array' : typeof data[key]
    }))
  );
};