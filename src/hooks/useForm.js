import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Proste i wydajne porównanie płytkie (shallow compare) dwóch obiektów.
 */
const shallowEqual = (a, b) => {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
};

/**
 * ✅ Uniwersalny hook do obsługi formularzy z walidacją, stanem ładowania i obsługą edycji.
 * @param {object} options
 * @param {object} options.initialState - Domyślny stan formularza
 * @param {Function} [options.validate] - Funkcja walidująca, zwraca obiekt błędów
 * @param {Function} options.onSubmit - Funkcja wywoływana po walidacji
 * @param {object|null} [options.itemToEdit] - Obiekt edytowany, używany do prefill
 * @returns {{
 *  formData: object,
 *  setFormData: Function,
 *  errors: object,
 *  loading: boolean,
 *  handleChange: Function,
 *  handleNestedChange: Function,
 *  handleSubmit: Function
 * }}
 */
export const useForm = ({
  initialState,
  validate,
  onSubmit,
  itemToEdit = null,
}) => {
  // Ref trzymający stabilny `initialState`, bez wymuszania re-renderów
  const initialStateRef = useRef(initialState);

  const [formData, setFormData] = useState(initialStateRef.current);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  /**
   * 🧠 Automatyczne wypełnianie formularza przy edycji lub reset do initialState.
   */
  useEffect(() => {
    const base = initialState ?? initialStateRef.current;

    if (itemToEdit) {
      const merged = { ...base, ...itemToEdit };

      // Normalizacja cargo_details.pallets
      if (merged.cargo_details) {
        const pallets = merged.cargo_details.pallets;

        if (pallets && typeof pallets === 'object' && !Array.isArray(pallets)) {
          merged.cargo_details.pallets = Object.entries(pallets)
            .map(([type, details]) => ({
              type,
              quantity: Number(details?.quantity ?? details?.count ?? 0) || 0,
              spaces: Number(details?.spaces ?? 0) || 0,
              weight: Number(details?.weight ?? 0) || 0,
            }))
            .filter(p => p.quantity > 0);
        } else if (!Array.isArray(pallets)) {
          merged.cargo_details.pallets = [];
        }
      }

      setFormData(prev => (shallowEqual(prev, merged) ? prev : merged));
    } else {
      setFormData(prev => (shallowEqual(prev, base) ? prev : base));
    }

    setErrors({});
  }, [itemToEdit, initialState]);

  /**
   * 📝 Obsługa zmiany wartości w polach prostych.
   */
  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      const val = type === 'checkbox' ? checked : value;

      setFormData(prev => {
        const next = { ...prev, [name]: val };
        return shallowEqual(prev, next) ? prev : next;
      });

      // Reset błędu po zmianie pola
      if (errors[name]) {
        setErrors(prev => ({ ...prev, [name]: null }));
      }
    },
    [errors]
  );

  /**
   * 🧩 Obsługa zmian w zagnieżdżonych strukturach (np. address.city)
   */
  const handleNestedChange = useCallback((group, e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const next = {
        ...prev,
        [group]: {
          ...(prev[group] ?? {}),
          [name]: value,
        },
      };
      return shallowEqual(prev, next) ? prev : next;
    });
  }, []);

  /**
   * 🚀 Obsługa wysyłania formularza z walidacją.
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    const validationErrors = validate ? validate(formData) : {};
    setErrors(validationErrors);

    const hasErrors = Object.values(validationErrors).some(error => {
      if (typeof error === 'object' && error !== null) {
        return Object.keys(error).length > 0;
      }
      return Boolean(error);
    });

    if (hasErrors) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error("❌ Form submission error:", err);
    } finally {
      setLoading(false);
    }
  }, [formData, onSubmit, validate]);

  return {
    formData,
    setFormData,
    errors,
    loading,
    handleChange,
    handleNestedChange,
    handleSubmit,
  };
};