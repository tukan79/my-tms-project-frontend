import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { useToast } from "@/contexts/ToastContext.jsx";
import { lookupPostcode } from "@/services/postcodeLookup.js";

/** Debounce helper (stable) */
function useDebouncedCallback(callback, delay = 500) {
  return useCallback(
    (() => {
      let timer;
      return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => callback(...args), delay);
      };
    })(),
    [callback, delay]
  );
}

export default function AddOrderForm({
  onSuccess,
  orderToEdit,
  clients: customers = [],
  surcharges: initialSurcharges = [],
}) {
  const { showToast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);

  /** Initial clean structure */
  const emptyForm = {
    order_number: "",
    reference: "",
    reference2: "",
    consignment_type: "",
    account_code: "",
    customer_id: "",

    // Collection
    collection_name: "",
    collection_address1: "",
    collection_address2: "",
    collection_town: "",
    collection_county: "",
    collection_postcode: "",
    collection_date: "",
    collection_time: "",
    collection_contact_name: "",
    collection_phone: "",
    collection_note: "",

    // Delivery
    delivery_name: "",
    delivery_address1: "",
    delivery_address2: "",
    delivery_town: "",
    delivery_county: "",
    delivery_postcode: "",
    delivery_date: "",
    delivery_time: "",
    delivery_contact_name: "",
    delivery_phone: "",
    delivery_note: "",

    // Load
    total_spaces: "",
    total_kilos: "",
    unit_code: "",

    // Service & Surcharges
    service_code: "",
    surcharges_text: "",
    selected_surcharges: [],

    // Pricing
    price: "",
    calculated_price: "",
    final_price: "",

    // Amazon
    amazon_asn: "",
    amazon_fba_ref: "",
    amazon_carton_count: "",
    amazon_unit_count: "",
    amazon_po_ref: "",
    cust_paperwork_required: false,
  };

  const [formData, setFormData] = useState(emptyForm);

  /** Load order when editing */
  useEffect(() => {
    if (orderToEdit) {
      setFormData((prev) => ({ ...prev, ...orderToEdit }));
    }
  }, [orderToEdit]);

  /** Auto-copy calculated price */
  useEffect(() => {
    if (formData.calculated_price && !orderToEdit) {
      setFormData((prev) => ({
        ...prev,
        final_price: prev.calculated_price,
      }));
    }
  }, [formData.calculated_price, orderToEdit]);

  /** CHANGE HANDLER */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    /** Trigger postcode lookup for these specific fields */
    if (name === "collection_postcode") {
      debouncedLookup("collection", value);
    }
    if (name === "delivery_postcode") {
      debouncedLookup("delivery", value);
    }
  };

  /** LOOKUP — debounced version */
  const debouncedLookup = useDebouncedCallback(async (prefix, postcode) => {
    if (!postcode || postcode.length < 3) return;

    const info = await lookupPostcode(postcode);
    if (!info) return;

    setFormData((prev) => ({
      ...prev,
      [`${prefix}_town`]: info.town || prev[`${prefix}_town`],
      [`${prefix}_county`]: info.county || prev[`${prefix}_county`],
    }));
  }, 600);

  /** SUBMIT HANDLER */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      showToast(orderToEdit ? "Order updated!" : "Order added!", "success");
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast(err?.response?.data?.error || "Failed to save order.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-card">
      <h2>{orderToEdit ? "Edit Order" : "Add New Order"}</h2>

      {/* ======================
          BASIC DETAILS
      ======================= */}
      <div className="form-grid">
        <div className="form-group">
          <label>Consignment Number</label>
          <input name="order_number" value={formData.order_number} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Customer Reference</label>
          <input name="reference" value={formData.reference} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Customer Reference 2</label>
          <input name="reference2" value={formData.reference2} onChange={handleChange} />
        </div>
      </div>

      {/* ======================
          CUSTOMER
      ======================= */}
      <h3>Customer</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Consignment Type</label>
          <input name="consignment_type" value={formData.consignment_type} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Account Code</label>
          <input name="account_code" value={formData.account_code} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Customer</label>
          <select name="customer_id" value={formData.customer_id} onChange={handleChange}>
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ======================
          COLLECTION
      ======================= */}
      <h3>Collection</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Name</label>
          <input name="collection_name" value={formData.collection_name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Address 1</label>
          <input name="collection_address1" value={formData.collection_address1} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Postcode</label>
          <input
            name="collection_postcode"
            value={formData.collection_postcode}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Town</label>
          <input name="collection_town" value={formData.collection_town} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>County</label>
          <input name="collection_county" value={formData.collection_county} onChange={handleChange} />
        </div>
      </div>

      {/* ======================
          DELIVERY
      ======================= */}
      <h3>Delivery</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Name</label>
          <input name="delivery_name" value={formData.delivery_name} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Address 1</label>
          <input name="delivery_address1" value={formData.delivery_address1} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Postcode</label>
          <input
            name="delivery_postcode"
            value={formData.delivery_postcode}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Town</label>
          <input name="delivery_town" value={formData.delivery_town} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>County</label>
          <input name="delivery_county" value={formData.delivery_county} onChange={handleChange} />
        </div>
      </div>

      {/* ======================
          LOAD
      ======================= */}
      <h3>Load Details</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Total Spaces</label>
          <input type="number" name="total_spaces" value={formData.total_spaces} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Total Kilos</label>
          <input type="number" name="total_kilos" value={formData.total_kilos} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Unit Code</label>
          <input name="unit_code" value={formData.unit_code} onChange={handleChange} />
        </div>
      </div>

      {/* ======================
          SERVICE / SURCHARGES
      ======================= */}
      <h3>Service & Surcharges</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Service Code</label>
          <input name="service_code" value={formData.service_code} onChange={handleChange} />
        </div>

        <div className="form-group">
          <label>Surcharges</label>
          <input name="surcharges_text" value={formData.surcharges_text} onChange={handleChange} />
        </div>
      </div>

      {/* ======================
          PRICE
      ======================= */}
      <h3>Pricing</h3>
      <div className="form-group">
        <label>Final Price (£)</label>
        <input type="number" name="final_price" value={formData.final_price} onChange={handleChange} />
      </div>

      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : orderToEdit ? "Update Order" : "Add Order"}
      </button>
    </form>
  );
}

AddOrderForm.propTypes = {
  onSuccess: PropTypes.func,
  orderToEdit: PropTypes.object,
  clients: PropTypes.array,
  surcharges: PropTypes.array,
};
