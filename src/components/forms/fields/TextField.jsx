import React from 'react';
import PropTypes from 'prop-types';

const TextField = ({
  label,
  name,
  value,
  onChange,
  error,
  type,
  required,
}) => (
  <div className="form-group">
    <label htmlFor={name}>
      {label}
      {required ? ' *' : ''}
    </label>

    <input
      id={name}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className={error ? 'input-error' : ''}
    />

    {error && (
      <span className="error-text">{error}</span>
    )}
  </div>
);

TextField.propTypes = {
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  type: PropTypes.string,
  required: PropTypes.bool,
};

TextField.defaultProps = {
  error: '',
  type: 'text',
  required: false,
};

export default TextField;
