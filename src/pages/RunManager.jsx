import React from 'react';
import PropTypes from 'prop-types';
import RunManagerView from '@/components/management/RunManager.jsx';

/**
 * Strona Run Manager – używa pełnego komponentu z folderu management.
 * Prop'y pochodzą z viewConfig (runs, trucks, trailers, drivers, runActions, onDeleteRequest).
 */
const RunManager = (props) => <RunManagerView {...props} />;

export default RunManager;

RunManager.propTypes = {
  runs: PropTypes.array,
  trucks: PropTypes.array,
  trailers: PropTypes.array,
  drivers: PropTypes.array,
  runActions: PropTypes.shape({
    create: PropTypes.func,
    update: PropTypes.func,
    delete: PropTypes.func,
  }),
  onDeleteRequest: PropTypes.func,
};
