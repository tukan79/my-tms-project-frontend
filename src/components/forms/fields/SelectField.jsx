import React from 'react';
import PropTypes from 'prop-types';

const SelectField = ({
  label,
  name,
  value,
  onChange,
  error,
  options,
  required,
}) => (
  <div className="form-group">
    <label htmlFor={name}>
      {label}
      {required ? ' *' : ''}
    </label>

    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={error ? 'input-error' : ''}
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>

    {error && (
      <span className="error-text">{error}</span>
    )}
  </div>
);

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
      ]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  required: PropTypes.bool,
};

SelectField.defaultProps = {
  error: '',
  required: false,
};

export default SelectField;
