// AddOrderForm.jsx — FIXED FOR LAYOUT A (max-width 1200px)
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useToast } from '@/contexts/ToastContext.jsx';

const AddOrderForm = ({ onSuccess, orderToEdit, clients: customers = [], surcharges: initialSurcharges = [] }) => {
  const gridStyle = { gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' };

  const [formData, setFormData] = useState({
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (orderToEdit) setFormData(orderToEdit);
  }, [orderToEdit]);

  useEffect(() => {
    if (formData.calculated_price && !formData.final_price) {
      setFormData(prev => ({ ...prev, final_price: formData.calculated_price }));
    }
  }, [formData.calculated_price]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      showToast(orderToEdit ? 'Order updated!' : 'Order added!', 'success');
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast(err?.response?.data?.error || 'Failed to save order.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="page-card">
      <h2>{orderToEdit ? 'Edit Order' : 'Add New Order'}</h2>

      {/* ID & refs */}
      <div className="form-grid" style={gridStyle}>
        <div className="form-group">
          <label htmlFor="order_number">Consignment Number</label>
          <input id="order_number" name="order_number" value={formData.order_number} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="reference">Customer Reference</label>
          <input id="reference" name="reference" value={formData.reference} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="reference2">Customer Reference 2</label>
          <input id="reference2" name="reference2" value={formData.reference2} onChange={handleChange} />
        </div>
      </div>

      {/* Customer */}
      <div className="form-grid" style={gridStyle}>
        <div className="form-group">
          <label htmlFor="consignment_type">Consignment Type</label>
          <input id="consignment_type" name="consignment_type" value={formData.consignment_type} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="account_code">Account Code</label>
          <input id="account_code" name="account_code" value={formData.account_code} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label htmlFor="customer_id">Customer</label>
          <select id="customer_id" name="customer_id" value={formData.customer_id} onChange={handleChange}>
            <option value="">Select customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Collection */}
      <h3>Collection</h3>
      <div className="form-grid" style={gridStyle}>
        <div className="form-group"><label htmlFor="collection_name">Name</label><input id="collection_name" name="collection_name" value={formData.collection_name} onChange={handleChange} /></div>
        <div className="form-group"><label htmlFor="collection_address1">Address 1</label><input id="collection_address1" name="collection_address1" value={formData.collection_address1} onChange={handleChange} /></div>
        <div className="form-group"><label htmlFor="collection_address2">Address 2</label><input id="collection_address2" name="collection_address2" value={formData.collection_address2} onChange={handleChange} /></div>
      </div>

      {/* Delivery */}
      <h3>Delivery</h3>
      <div className="form-grid" style={gridStyle}>
        <div className="form-group"><label htmlFor="delivery_name">Name</label><input id="delivery_name" name="delivery_name" value={formData.delivery_name} onChange={handleChange} /></div>
        <div className="form-group"><label htmlFor="delivery_address1">Address 1</label><input id="delivery_address1" name="delivery_address1" value={formData.delivery_address1} onChange={handleChange} /></div>
        <div className="form-group"><label htmlFor="delivery_address2">Address 2</label><input id="delivery_address2" name="delivery_address2" value={formData.delivery_address2} onChange={handleChange} /></div>
      </div>

      {/* Load */}
      <h3>Load</h3>
      <div className="form-grid" style={gridStyle}>
        <div className="form-group"><label htmlFor="total_spaces">Total Spaces</label><input id="total_spaces" type="number" name="total_spaces" value={formData.total_spaces} onChange={handleChange} /></div>
        <div className="form-group"><label htmlFor="total_kilos">Total Kilos</label><input id="total_kilos" type="number" name="total_kilos" value={formData.total_kilos} onChange={handleChange} /></div>
        <div className="form-group"><label htmlFor="unit_code">Unit Code</label><input id="unit_code" name="unit_code" value={formData.unit_code} onChange={handleChange} /></div>
      </div>

      {/* Surcharges */}
      <h3>Service & Surcharges</h3>

      <div className="form-grid" style={gridStyle}>
        <div className="form-group"><label htmlFor="service_code">Service Code</label><input id="service_code" name="service_code" value={formData.service_code} onChange={handleChange} /></div>
        <div className="form-group"><label htmlFor="surcharges_text">Surcharges text</label><input id="surcharges_text" name="surcharges_text" value={formData.surcharges_text} onChange={handleChange} /></div>
      </div>

      {/* Price */}
      <div className="form-group">
        <label htmlFor="final_price">Final Price (£)</label>
        <input id="final_price" type="number" name="final_price" value={formData.final_price} onChange={handleChange} />
      </div>

      {isSubmitting ? (
        <button type="submit" className="btn-primary" disabled>
          Saving...
        </button>
      ) : (
        <button type="submit" className="btn-primary">
          {orderToEdit ? 'Update Order' : 'Add Order'}
        </button>
      )}
    </form>
  );
};

AddOrderForm.propTypes = {
  onSuccess: PropTypes.func,
  orderToEdit: PropTypes.object,
  clients: PropTypes.array,
  surcharges: PropTypes.array,
};

AddOrderForm.defaultProps = {
  onSuccess: undefined,
  orderToEdit: null,
  clients: [],
  surcharges: [],
};

export default AddOrderForm;
