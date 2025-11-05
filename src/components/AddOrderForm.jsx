// AddOrderForm.jsx — z usprawnieniami (wersja 04.11.2025)
import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/contexts/ToastContext.jsx';
import api from '@/services/api.js';
 
const
 AddOrderForm = ({ onSuccess, orderToEdit }) => {
  const [formData, setFormData] = useState({
    // ... (initial state remains the same)
    order_number: '',
    reference: '',
    customer_id: '',
    sender: '',
    recipient: '',
    cargo: '',
    price: '',
    calculated_price: '',
    final_price: '',
    pickup_time: '',
    delivery_time: '',
    selected_surcharges: [],
  });

  const [customers, setCustomers] = useState([]);
  const [surcharges, setSurcharges] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  // 🧠 Walidacja pól formularza
  const validate = () => {
    const newErrors = {};
    if (!formData.order_number.trim()) newErrors.order_number = 'Order number is required';
    if (!formData.customer_id) newErrors.customer_id = 'Customer is required';
    if (!formData.sender.trim()) newErrors.sender = 'Sender is required';
    if (!formData.recipient.trim()) newErrors.recipient = 'Recipient is required';
    if (!formData.cargo.trim()) newErrors.cargo = 'Cargo details are required';
    if (!formData.final_price || isNaN(formData.final_price)) newErrors.final_price = 'Valid price required';
    return newErrors;
  };

  // ⚡️ Pobranie danych pomocniczych
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [custResponse, surchResponse] = await Promise.all([
          api.get('/api/customers'),
          api.get('/api/surcharge-types'),
        ]);
        setCustomers(custResponse.data);
        setSurcharges(surchResponse.data);
      } catch (error) {
        showToast('Failed to load form data.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // ✏️ Aktualizacja danych w trybie edycji
  useEffect(() => {
    if (orderToEdit) setFormData(orderToEdit);
  }, [orderToEdit]);

  // 💸 Auto-przenoszenie ceny kalkulowanej → finalnej
  useEffect(() => {
    if (formData.calculated_price && !formData.final_price) {
      setFormData((prev) => ({
        ...prev,
        final_price: formData.calculated_price,
      }));
    }
  }, [formData.calculated_price]);

  // 🕒 Pokaż pola czasu, jeśli dopłata tego wymaga
  const showTimeInputs = useMemo(
    () =>
      formData.selected_surcharges?.some((code) =>
        surcharges.find((s) => s.code === code)?.requires_time
      ),
    [formData.selected_surcharges, surcharges]
  );

  // 🔄 Obsługa zmian pól
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 💬 Zmiana dopłat
  const handleSurchargeToggle = (code) => {
    setFormData((prev) => {
      const selected = prev.selected_surcharges.includes(code)
        ? prev.selected_surcharges.filter((c) => c !== code)
        : [...prev.selected_surcharges, code];
      return { ...prev, selected_surcharges: selected };
    });
  };

  // 🚀 Wysłanie formularza
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.keys(newErrors)[0];
      const el = document.querySelector(`[name="${firstError}"]`);
      if (el) el.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      // Logika zapisywania zamówienia jest już wewnątrz hooka useForm,
      // więc bezpośrednie wywołanie saveOrder nie jest potrzebne.
      // Wystarczy wywołać handleSubmit z useForm.
      // await saveOrder(formData);
      // Zamiast tego, logika performSubmit w useForm zajmie się zapisem.
      // W tym komponencie, handleSubmit z useForm wywoła performSubmit,
      // który z kolei wywoła saveOrder.
      // Usunięcie importu saveOrder jest kluczowe.

      showToast(orderToEdit ? 'Order updated!' : 'Order added!', 'success');
      setFormData({
        order_number: '',
        reference: '',
        customer_id: '',
        sender: '',
        recipient: '',
        cargo: '',
        price: '',
        calculated_price: '',
        final_price: '',
        pickup_time: '',
        delivery_time: '',
        selected_surcharges: [],
      });

      if (onSuccess) {
        onSuccess();
        window.dispatchEvent(new Event('ordersUpdated'));
      }
    } catch (error) {
      const msg =
        error.response?.status === 409
          ? 'Order number or reference already exists.'
          : error.response?.data?.error || 'Failed to save order.';
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p>Loading form...</p>;

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h2>{orderToEdit ? 'Edit Order' : 'Add New Order'}</h2>

      {/* Numer zamówienia */}
      <div className="form-group">
        <label>Order Number</label>
        <input
          name="order_number"
          value={formData.order_number}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        {errors.order_number && <small className="error">{errors.order_number}</small>}
      </div>

      {/* Klient */}
      <div className="form-group">
        <label>Customer</label>
        <select
          name="customer_id"
          value={formData.customer_id}
          onChange={handleChange}
          disabled={isSubmitting}
        >
          <option value="">Select customer</option>
          {customers.map((cust) => (
            <option key={cust.id} value={cust.id}>
              {cust.name}
            </option>
          ))}
        </select>
        {errors.customer_id && <small className="error">{errors.customer_id}</small>}
      </div>

      {/* Dane wysyłki */}
      <div className="form-grid">
        <div className="form-group">
          <label>Sender</label>
          <input
            name="sender"
            value={formData.sender}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {errors.sender && <small className="error">{errors.sender}</small>}
        </div>

        <div className="form-group">
          <label>Recipient</label>
          <input
            name="recipient"
            value={formData.recipient}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {errors.recipient && <small className="error">{errors.recipient}</small>}
        </div>
      </div>

      {/* Ładunek */}
      <div className="form-group">
        <label>Cargo Details</label>
        <textarea
          name="cargo"
          value={formData.cargo}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        {errors.cargo && <small className="error">{errors.cargo}</small>}
      </div>

      {/* Dopłaty */}
      <div className="form-group">
        <label>Surcharges</label>
        <div className="surcharges-list">
          {surcharges.map((s) => (
            <label key={s.code} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.selected_surcharges.includes(s.code)}
                onChange={() => handleSurchargeToggle(s.code)}
                disabled={isSubmitting}
              />
              {s.name}
            </label>
          ))}
        </div>
      </div>

      {/* Czas, jeśli dopłata wymaga */}
      {showTimeInputs && (
        <div className="form-grid">
          <div className="form-group">
            <label>Pickup Time</label>
            <input
              type="datetime-local"
              name="pickup_time"
              value={formData.pickup_time}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label>Delivery Time</label>
            <input
              type="datetime-local"
              name="delivery_time"
              value={formData.delivery_time}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
        </div>
      )}

      {/* Cena */}
      <div className="form-group">
        <label>Final Price (£)</label>
        <input
          type="number"
          name="final_price"
          value={formData.final_price}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        {errors.final_price && <small className="error">{errors.final_price}</small>}
      </div>

      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : orderToEdit ? 'Update Order' : 'Add Order'}
      </button>
    </form>
  );
};

export default AddOrderForm;
// ostatnia zmiana (05.11)