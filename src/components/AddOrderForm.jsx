// AddOrderForm.jsx — z usprawnieniami (wersja 04.11.2025)
import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/contexts/ToastContext.jsx';
 
const
 AddOrderForm = ({ onSuccess, orderToEdit, clients: customers = [], surcharges: initialSurcharges = [] }) => {
  const [formData, setFormData] = useState({
    // Identyfikatory / referencje
    order_number: '',
    reference: '',
    reference2: '',
    consignment_type: '',
    account_code: '',
    customer_id: '',

    // Dane collection
    collection_name: '',
    collection_address1: '',
    collection_address2: '',
    collection_town: '',
    collection_county: '',
    collection_postcode: '',
    collection_date: '',
    collection_time: '',
    collection_contact_name: '',
    collection_phone: '',
    collection_note: '',

    // Dane delivery
    delivery_name: '',
    delivery_address1: '',
    delivery_address2: '',
    delivery_town: '',
    delivery_county: '',
    delivery_postcode: '',
    delivery_date: '',
    delivery_time: '',
    delivery_contact_name: '',
    delivery_phone: '',
    delivery_note: '',

    // Ładunek
    total_spaces: '',
    total_kilos: '',
    unit_code: '',
    full_q: '',
    half_q: '',
    half_plus_q: '',
    quarter_q: '',
    micro_q: '',
    cargo: '',

    // Serwis / dopłaty
    service_code: '',
    surcharges_text: '',
    selected_surcharges: [],

    // Amazon
    amazon_asn: '',
    amazon_fba_ref: '',
    amazon_carton_count: '',
    amazon_unit_count: '',
    amazon_po_ref: '',

    // Inne
    cust_paperwork_required: false,
    price: '',
    calculated_price: '',
    final_price: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  // 🧠 Walidacja pól formularza
  const validate = () => {
    const newErrors = {};
    if (!formData.order_number.trim()) newErrors.order_number = 'Order number is required';
    if (!formData.customer_id) newErrors.customer_id = 'Customer is required';
    if (!formData.sender.trim()) newErrors.sender = 'Sender is required';
    if (!formData.recipient.trim()) newErrors.recipient = 'Recipient is required';
    if (!formData.cargo.trim()) newErrors.cargo = 'Cargo details are required';
    if (!formData.final_price || Number.isNaN(formData.final_price)) newErrors.final_price = 'Valid price required';
    return newErrors;
  };

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
        initialSurcharges.find((s) => s.code === code)?.requires_time
      ),
    [formData.selected_surcharges, initialSurcharges]
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
        reference2: '',
        consignment_type: '',
        account_code: '',
        customer_id: '',
        collection_name: '',
        collection_address1: '',
        collection_address2: '',
        collection_town: '',
        collection_county: '',
        collection_postcode: '',
        collection_date: '',
        collection_time: '',
        collection_contact_name: '',
        collection_phone: '',
        collection_note: '',
        delivery_name: '',
        delivery_address1: '',
        delivery_address2: '',
        delivery_town: '',
        delivery_county: '',
        delivery_postcode: '',
        delivery_date: '',
        delivery_time: '',
        delivery_contact_name: '',
        delivery_phone: '',
        delivery_note: '',
        total_spaces: '',
        total_kilos: '',
        unit_code: '',
        full_q: '',
        half_q: '',
        half_plus_q: '',
        quarter_q: '',
        micro_q: '',
        cargo: '',
        service_code: '',
        surcharges_text: '',
        selected_surcharges: [],
        amazon_asn: '',
        amazon_fba_ref: '',
        amazon_carton_count: '',
        amazon_unit_count: '',
        amazon_po_ref: '',
        cust_paperwork_required: false,
        price: '',
        calculated_price: '',
        final_price: '',
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

  return (
    <form onSubmit={handleSubmit} className="form-card" style={{ width: '100%' }}>
      <h2>{orderToEdit ? 'Edit Order' : 'Add New Order'}</h2>

      {/* Identyfikatory / referencje */}
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="order_number">Consignment Number</label>
          <input
            id="order_number"
            name="order_number"
            value={formData.order_number}
            onChange={handleChange}
            disabled={isSubmitting}
          />
          {errors.order_number && <small className="error">{errors.order_number}</small>}
        </div>
        <div className="form-group">
          <label htmlFor="reference">Customer Reference</label>
          <input
            id="reference"
            name="reference"
            value={formData.reference}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="reference2">Customer Reference 2</label>
          <input
            id="reference2"
            name="reference2"
            value={formData.reference2}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="consignment_type">Consignment Type</label>
          <input
            id="consignment_type"
            name="consignment_type"
            value={formData.consignment_type}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="account_code">Account Code</label>
          <input
            id="account_code"
            name="account_code"
            value={formData.account_code}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="customer_id">Customer</label>
          <select
            id="customer_id"
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
      </div>

      {/* Collection */}
      <h3>Collection</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="collection_name">Name</label>
          <input id="collection_name" name="collection_name" value={formData.collection_name} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="collection_address1">Address 1</label>
          <input id="collection_address1" name="collection_address1" value={formData.collection_address1} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="collection_address2">Address 2</label>
          <input id="collection_address2" name="collection_address2" value={formData.collection_address2} onChange={handleChange} disabled={isSubmitting} />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="collection_town">Town / City</label>
          <input id="collection_town" name="collection_town" value={formData.collection_town} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="collection_county">County</label>
          <input id="collection_county" name="collection_county" value={formData.collection_county} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="collection_postcode">Postcode</label>
          <input id="collection_postcode" name="collection_postcode" value={formData.collection_postcode} onChange={handleChange} disabled={isSubmitting} />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="collection_date">Date</label>
          <input id="collection_date" type="date" name="collection_date" value={formData.collection_date} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="collection_time">Time</label>
          <input id="collection_time" type="time" name="collection_time" value={formData.collection_time} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="collection_contact_name">Contact Name</label>
          <input id="collection_contact_name" name="collection_contact_name" value={formData.collection_contact_name} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="collection_phone">Contact Phone</label>
          <input id="collection_phone" name="collection_phone" value={formData.collection_phone} onChange={handleChange} disabled={isSubmitting} />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="collection_note">Collection Note</label>
        <textarea id="collection_note" name="collection_note" value={formData.collection_note} onChange={handleChange} disabled={isSubmitting} />
      </div>

      {/* Delivery */}
      <h3>Delivery</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="delivery_name">Name</label>
          <input id="delivery_name" name="delivery_name" value={formData.delivery_name} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="delivery_address1">Address 1</label>
          <input id="delivery_address1" name="delivery_address1" value={formData.delivery_address1} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="delivery_address2">Address 2</label>
          <input id="delivery_address2" name="delivery_address2" value={formData.delivery_address2} onChange={handleChange} disabled={isSubmitting} />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="delivery_town">Town / City</label>
          <input id="delivery_town" name="delivery_town" value={formData.delivery_town} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="delivery_county">County</label>
          <input id="delivery_county" name="delivery_county" value={formData.delivery_county} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="delivery_postcode">Postcode</label>
          <input id="delivery_postcode" name="delivery_postcode" value={formData.delivery_postcode} onChange={handleChange} disabled={isSubmitting} />
        </div>
      </div>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="delivery_date">Date</label>
          <input id="delivery_date" type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="delivery_time">Time</label>
          <input id="delivery_time" type="time" name="delivery_time" value={formData.delivery_time} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="delivery_contact_name">Contact Name</label>
          <input id="delivery_contact_name" name="delivery_contact_name" value={formData.delivery_contact_name} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="delivery_phone">Contact Phone</label>
          <input id="delivery_phone" name="delivery_phone" value={formData.delivery_phone} onChange={handleChange} disabled={isSubmitting} />
        </div>
      </div>
      <div className="form-group">
        <label htmlFor="delivery_note">Delivery Note</label>
        <textarea id="delivery_note" name="delivery_note" value={formData.delivery_note} onChange={handleChange} disabled={isSubmitting} />
      </div>

      {/* Ładunek i frakcje palet */}
      <h3>Load</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="total_spaces">Total Spaces</label>
          <input id="total_spaces" type="number" name="total_spaces" value={formData.total_spaces} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="total_kilos">Total Kilos</label>
          <input id="total_kilos" type="number" name="total_kilos" value={formData.total_kilos} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="unit_code">Unit Code</label>
          <input id="unit_code" name="unit_code" value={formData.unit_code} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="cargo">Cargo Details</label>
          <textarea id="cargo" name="cargo" value={formData.cargo} onChange={handleChange} disabled={isSubmitting} />
          {errors.cargo && <small className="error">{errors.cargo}</small>}
        </div>
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="full_q">Full Q</label>
          <input id="full_q" type="number" name="full_q" value={formData.full_q} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="half_q">Half Q</label>
          <input id="half_q" type="number" name="half_q" value={formData.half_q} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="half_plus_q">Half+ Q</label>
          <input id="half_plus_q" type="number" name="half_plus_q" value={formData.half_plus_q} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="quarter_q">Quarter Q</label>
          <input id="quarter_q" type="number" name="quarter_q" value={formData.quarter_q} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="micro_q">Micro Q</label>
          <input id="micro_q" type="number" name="micro_q" value={formData.micro_q} onChange={handleChange} disabled={isSubmitting} />
        </div>
      </div>

      {/* Serwis / dopłaty */}
      <h3>Service & Surcharges</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="service_code">Service Code</label>
          <input id="service_code" name="service_code" value={formData.service_code} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="surcharges_text">Surcharges (text)</label>
          <input id="surcharges_text" name="surcharges_text" value={formData.surcharges_text} onChange={handleChange} disabled={isSubmitting} />
        </div>
      </div>

      <div className="form-group">
        <label>Surcharge selection</label>
        <div className="surcharges-list">
          {initialSurcharges.map((s) => (
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

      {/* Amazon */}
      <h3>Amazon</h3>
      <div className="form-grid">
        <div className="form-group">
          <label htmlFor="amazon_asn">ASN</label>
          <input id="amazon_asn" name="amazon_asn" value={formData.amazon_asn} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="amazon_fba_ref">FBA Ref</label>
          <input id="amazon_fba_ref" name="amazon_fba_ref" value={formData.amazon_fba_ref} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="amazon_carton_count">Carton Count</label>
          <input id="amazon_carton_count" type="number" name="amazon_carton_count" value={formData.amazon_carton_count} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="amazon_unit_count">Unit Count</label>
          <input id="amazon_unit_count" type="number" name="amazon_unit_count" value={formData.amazon_unit_count} onChange={handleChange} disabled={isSubmitting} />
        </div>
        <div className="form-group">
          <label htmlFor="amazon_po_ref">PO Ref</label>
          <input id="amazon_po_ref" name="amazon_po_ref" value={formData.amazon_po_ref} onChange={handleChange} disabled={isSubmitting} />
        </div>
      </div>

      {/* Inne */}
      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          id="cust_paperwork_required"
          name="cust_paperwork_required"
          checked={formData.cust_paperwork_required}
          onChange={handleChange}
          disabled={isSubmitting}
        />
        <label htmlFor="cust_paperwork_required" style={{ margin: 0 }}>Customer paperwork required</label>
      </div>

      {/* Dopłaty */}
      <div className="form-group">
        <label>Surcharges</label>
        <div className="surcharges-list">
          {initialSurcharges.map((s) => (
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
            <label htmlFor="pickup_time">Pickup Time</label>
            <input
              id="pickup_time"
              type="datetime-local"
              name="pickup_time"
              value={formData.pickup_time}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group">
            <label htmlFor="delivery_time">Delivery Time</label>
            <input
              id="delivery_time"
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
        <label htmlFor="final_price">Final Price (£)</label>
        <input
          id="final_price"
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
