// src/components/forms/AddOrderForm.jsx
import React, { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";

import { useToast } from "@/contexts/ToastContext.jsx";
import { lookupPostcode } from "@/services/postcodeLookup.js";

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
}) {
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Service
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

  /* Load existing order */
  useEffect(() => {
    if (orderToEdit) {
      setFormData((prev) => ({ ...prev, ...orderToEdit }));
    }
  }, [orderToEdit]);

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
    <div className="flex justify-center w-full py-10 px-4">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl p-10">
        <FormHeader
          title={orderToEdit ? "Edit Order" : "Add New Order"}
          subtitle="Enter order details, collection, delivery and pricing"
          onCancel={onCancel}
        />

        <form onSubmit={handleSubmit} noValidate className="space-y-10">
          {/* BASIC + CUSTOMER */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="form-section-title">Basic Details</h3>
              <TextField label="Consignment Number" name="order_number" value={formData.order_number} onChange={handleChange} />
              <TextField label="Customer Reference" name="reference" value={formData.reference} onChange={handleChange} />
              <TextField label="Customer Reference 2" name="reference2" value={formData.reference2} onChange={handleChange} />
            </div>

            <div className="space-y-4">
              <h3 className="form-section-title">Customer</h3>
              <TextField label="Consignment Type" name="consignment_type" value={formData.consignment_type} onChange={handleChange} />
              <TextField label="Account Code" name="account_code" value={formData.account_code} onChange={handleChange} />
              <SelectField
                label="Customer"
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                options={customers.map((c) => ({ value: c.id, label: c.name }))}
              />
            </div>
          </div>

          {/* COLLECTION + DELIVERY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="form-section-title">Collection</h3>
              <TextField label="Name" name="collection_name" value={formData.collection_name} onChange={handleChange} />
              <TextField label="Address 1" name="collection_address1" value={formData.collection_address1} onChange={handleChange} />
              <TextField label="Postcode" name="collection_postcode" value={formData.collection_postcode} onChange={handleChange} />
              <TextField label="Town" name="collection_town" value={formData.collection_town} onChange={handleChange} />
              <TextField label="County" name="collection_county" value={formData.collection_county} onChange={handleChange} />
              <TextField label="Collection Date" type="date" name="collection_date" value={formData.collection_date} onChange={handleChange} />
              <TextField label="Collection Time" type="time" name="collection_time" value={formData.collection_time} onChange={handleChange} />
            </div>

            <div className="space-y-4">
              <h3 className="form-section-title">Delivery</h3>
              <TextField label="Name" name="delivery_name" value={formData.delivery_name} onChange={handleChange} />
              <TextField label="Address 1" name="delivery_address1" value={formData.delivery_address1} onChange={handleChange} />
              <TextField label="Postcode" name="delivery_postcode" value={formData.delivery_postcode} onChange={handleChange} />
              <TextField label="Town" name="delivery_town" value={formData.delivery_town} onChange={handleChange} />
              <TextField label="County" name="delivery_county" value={formData.delivery_county} onChange={handleChange} />
              <TextField label="Delivery Date" type="date" name="delivery_date" value={formData.delivery_date} onChange={handleChange} />
              <TextField label="Delivery Time" type="time" name="delivery_time" value={formData.delivery_time} onChange={handleChange} />
            </div>
          </div>

          {/* LOAD + PRICING */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="form-section-title">Load Details</h3>
              <TextField label="Total Spaces" type="number" name="total_spaces" value={formData.total_spaces} onChange={handleChange} />
              <TextField label="Total Kilos" type="number" name="total_kilos" value={formData.total_kilos} onChange={handleChange} />
              <TextField label="Unit Code" name="unit_code" value={formData.unit_code} onChange={handleChange} />
            </div>

            <div className="space-y-4">
              <h3 className="form-section-title">Service & Pricing</h3>
              <TextField label="Service Code" name="service_code" value={formData.service_code} onChange={handleChange} />
              <TextField label="Surcharges" name="surcharges_text" value={formData.surcharges_text} onChange={handleChange} />
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
};
