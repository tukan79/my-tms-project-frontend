// src/components/forms/AddOrderForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";

import { useToast } from "@/contexts/ToastContext.jsx";
import { lookupPostcode } from "@/services/postcodeLookup.js";
import api from "@/services/api.js";

import TextField from "./fields/TextField.jsx";
import SelectField from "./fields/SelectField.jsx";
import FormHeader from "./shared/FormHeader.jsx";
import FormActions from "./shared/FormActions.jsx";

/* ---------------------------------------------
   Debounce Hook
--------------------------------------------- */
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
  onCancel = () => {},
  orderToEdit,
  clients: customers = [],
  surcharges: initialSurcharges = [],
  rateCards = [],
}) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableRateCards, setAvailableRateCards] = useState(
    Array.isArray(rateCards) ? rateCards : []
  );
  const [availableCustomers, setAvailableCustomers] = useState(
    Array.isArray(customers) ? customers : []
  );
  const [rateEntries, setRateEntries] = useState([]);

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
    full_q: "",
    half_plus_q: "",
    half_q: "",
    micro_q: "",
    total_spaces: "",
    total_kilos: "",
    unit_code: "",

    // Service
    service_code: "",
    surcharges_text: "",
    selected_surcharges: [],
    collection_instruction: "",
    delivery_instruction: "",

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

  /* Load existing order */
  useEffect(() => {
    if (orderToEdit) {
      setFormData((prev) => ({ ...prev, ...orderToEdit }));
    }
  }, [orderToEdit]);

  /* Fetch rate cards if not provided */
  useEffect(() => {
    if (availableRateCards.length > 0) return;
    let isMounted = true;
    (async () => {
      try {
        const res = await api.get("/api/rate-cards");
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.rateCards)
            ? res.data.rateCards
            : Array.isArray(res.data?.data)
              ? res.data.data
              : [];
        if (isMounted) setAvailableRateCards(data);
      } catch (err) {
        console.error("Failed to fetch rate cards", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [availableRateCards.length]);

  /* Fetch customers if not provided */
  useEffect(() => {
    if (availableCustomers.length > 0) return;
    let isMounted = true;
    (async () => {
      try {
        const res = await api.get("/api/customers");
        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.customers)
            ? res.data.customers
            : Array.isArray(res.data?.data)
              ? res.data.data
              : [];
        if (isMounted) setAvailableCustomers(data);
      } catch (err) {
        console.error("Failed to fetch customers", err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [availableCustomers.length]);

  /* Fetch rate entries when a rate card is selected */
  useEffect(() => {
    const selectedCard = availableRateCards.find(
      (r) =>
        String(r.id) === String(formData.consignment_type) ||
        r.name === formData.consignment_type
    );

    if (!selectedCard?.id) {
      setRateEntries([]);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        const res = await api.get(`/api/rate-cards/${selectedCard.id}/entries`);
        const entries =
          Array.isArray(res.data?.entries) ? res.data.entries
            : Array.isArray(res.data?.data) ? res.data.data
              : Array.isArray(res.data) ? res.data
                : [];
        if (isMounted) {
          setRateEntries(entries);
        }
      } catch (err) {
        console.error("Failed to fetch rate entries", err);
        if (isMounted) setRateEntries([]);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [formData.consignment_type, availableRateCards]);

  /* Auto-fill final price */
  useEffect(() => {
    if (formData.calculated_price && !orderToEdit) {
      setFormData((prev) => ({
        ...prev,
        final_price: prev.calculated_price,
      }));
    }
  }, [formData.calculated_price, orderToEdit]);

  /* Change handler */
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "collection_postcode") {
      debouncedLookup("collection", value);
    }
    if (name === "delivery_postcode") {
      debouncedLookup("delivery", value);
    }

    if (name === "consignment_type") {
      // reset dependent fields when rate card changes
      setFormData((prev) => ({
        ...prev,
        unit_code: "",
        service_code: "",
      }));
    }
  };

  const handleAccountCodeChange = (e) => {
    const { value } = e.target;
    setFormData((prev) => ({
      ...prev,
      account_code: value,
    }));

    const matchedCustomer = availableCustomers.find(
      (c) =>
        c.customer_code === value ||
        c.customerCode === value
    );
    if (matchedCustomer?.id) {
      setFormData((prev) => ({
        ...prev,
        customer_id: matchedCustomer.id,
      }));
    }
  };

  /* Debounced Postcode Lookup */
  const debouncedLookup = useDebouncedCallback(async (prefix, postcode) => {
    if (!postcode || postcode.length < 3) return;
    const info = await lookupPostcode(postcode);
    if (!info) return;

    setFormData((prev) => ({
      ...prev,
      [`${prefix}_town`]: info.town ?? prev[`${prefix}_town`],
      [`${prefix}_county`]: info.county ?? prev[`${prefix}_county`],
    }));
  }, 600);

  /* Submit handler */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      showToast(orderToEdit ? "Order updated!" : "Order created!", "success");
      onSuccess?.();
    } catch (err) {
      showToast(err?.response?.data?.error || "Failed to save order.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ----- UI START ----- */

  return (
    <div className="flex justify-center w-full py-8 px-4">
      <div className="form-card w-full">
        <FormHeader
          title={orderToEdit ? "Edit Order" : "Add New Order"}
          subtitle="Enter order details, collection, delivery and pricing"
          onCancel={onCancel}
        />

        <form onSubmit={handleSubmit} noValidate>
          <div className="basic-row">
            <h3 className="form-section-title basic-row-title">Basic Details</h3>
            <TextField
              label="Consignment Number"
              name="order_number"
              value={formData.order_number}
              onChange={handleChange}
            />
            <TextField
              label="Customer Reference"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
            />
            <TextField
              label="Customer Reference 2"
              name="reference2"
              value={formData.reference2}
              onChange={handleChange}
            />
          </div>

          <div className="create-order-grid">
            {/* COL 1: CUSTOMER */}
            <div className="order-section order-panel">
              <h3 className="form-section-title">Customer</h3>
              <SelectField
                label="Consignment Type"
                name="consignment_type"
                value={formData.consignment_type}
                onChange={handleChange}
                options={availableRateCards.map((r) => ({
                  value: r.name || r.id,
                  label: r.name || `Rate Card ${r.id}`,
                }))}
                placeholder="Select rate card"
              />
              <TextField
                label="Account Code"
                name="account_code"
                value={formData.account_code}
                onChange={handleAccountCodeChange}
                list="account-codes"
                placeholder="Start typing e.g. TES001"
              />
              <datalist id="account-codes">
                {availableCustomers.map((c) => {
                  const code = c.customer_code || c.customerCode;
                  return (
                    <option key={c.id ?? code} value={code}>
                      {code}
                    </option>
                  );
                })}
              </datalist>
              <SelectField
                label="Customer"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                options={availableCustomers.map((c) => ({
                  value: c.id,
                  label: c.name || c.customerCode || c.customer_code,
                }))}
              />
            </div>

            {/* COL 2: COLLECTION */}
            <div className="order-section order-panel">
              <h3 className="form-section-title">Collection</h3>
              <TextField label="Name" name="collection_name" value={formData.collection_name} onChange={handleChange} />
              <TextField label="Address 1" name="collection_address1" value={formData.collection_address1} onChange={handleChange} />
              <TextField label="Address 2" name="collection_address2" value={formData.collection_address2} onChange={handleChange} />
              <TextField label="Postcode" name="collection_postcode" value={formData.collection_postcode} onChange={handleChange} />
              <TextField label="Town" name="collection_town" value={formData.collection_town} onChange={handleChange} />
              <TextField label="County" name="collection_county" value={formData.collection_county} onChange={handleChange} />
              <TextField label="Collection Date" type="date" name="collection_date" value={formData.collection_date} onChange={handleChange} />
              <TextField label="Collection Time" type="time" name="collection_time" value={formData.collection_time} onChange={handleChange} />
            </div>

            {/* COL 3: DELIVERY */}
            <div className="order-section order-panel">
              <h3 className="form-section-title">Delivery</h3>
              <TextField label="Name" name="delivery_name" value={formData.delivery_name} onChange={handleChange} />
              <TextField label="Address 1" name="delivery_address1" value={formData.delivery_address1} onChange={handleChange} />
              <TextField label="Address 2" name="delivery_address2" value={formData.delivery_address2} onChange={handleChange} />
              <TextField label="Postcode" name="delivery_postcode" value={formData.delivery_postcode} onChange={handleChange} />
              <TextField label="Town" name="delivery_town" value={formData.delivery_town} onChange={handleChange} />
              <TextField label="County" name="delivery_county" value={formData.delivery_county} onChange={handleChange} />
              <TextField label="Delivery Date" type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} />
              <TextField label="Delivery Time" type="time" name="delivery_time" value={formData.delivery_time} onChange={handleChange} />
            </div>

            {/* COL 4: LOAD */}
            <div className="order-section order-panel">
              <h3 className="form-section-title">Load</h3>
              <TextField label="Full Quantity" type="number" name="full_q" value={formData.full_q} onChange={handleChange} />
              <TextField label="Half+ Quantity" type="number" name="half_plus_q" value={formData.half_plus_q} onChange={handleChange} />
            <TextField label="Half Quantity" type="number" name="half_q" value={formData.half_q} onChange={handleChange} />
            <TextField label="Micro Quantity" type="number" name="micro_q" value={formData.micro_q} onChange={handleChange} />
            <TextField label="Total Spaces" type="number" name="total_spaces" value={formData.total_spaces} onChange={handleChange} />
            <SelectField
              label="Unit Code"
              name="unit_code"
              value={formData.unit_code}
              onChange={handleChange}
              options={
                (rateEntries
                  .map((entry) => entry.serviceLevel || entry.service || entry.unit_code || entry.unitCode)
                  .filter(Boolean)
                  .filter((v, idx, arr) => arr.indexOf(v) === idx) // unique
                ).map((code) => ({
                  value: code,
                  label: code,
                })) || []
              }
              placeholder="Select service code"
            />
          </div>

            {/* COL 5: SURCHARGES / INSTRUCTION / PRICING */}
            <div className="order-section order-panel">
              <h3 className="form-section-title">Surcharges</h3>
              <TextField label="Surcharges" name="surcharges_text" value={formData.surcharges_text} onChange={handleChange} />

              <h3 className="form-section-title">Instructions</h3>
              <label className="modern-label" htmlFor="collection_instruction">Collection Instruction</label>
              <textarea
                id="collection_instruction"
                name="collection_instruction"
                value={formData.collection_instruction}
                onChange={handleChange}
                className="modern-input"
                rows="2"
              />
              <label className="modern-label" htmlFor="delivery_instruction">Delivery Instruction</label>
              <textarea
                id="delivery_instruction"
                name="delivery_instruction"
                value={formData.delivery_instruction}
                onChange={handleChange}
                className="modern-input"
                rows="2"
              />

              <h3 className="form-section-title">Pricing</h3>
              <TextField label="Service Code" name="service_code" value={formData.service_code} onChange={handleChange} />
              <TextField
                label="Final Price (£)"
                type="number"
                name="final_price"
                value={formData.final_price}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <FormActions
              onCancel={onCancel}
              loading={isSubmitting}
              submitLabel={orderToEdit ? "Save Changes" : "Create Order"}
            />
          </div>
        </form>
      </div>
    </div>
  );
}

AddOrderForm.propTypes = {
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
  orderToEdit: PropTypes.object,
  clients: PropTypes.array,
  surcharges: PropTypes.array,
  rateCards: PropTypes.array,
};
