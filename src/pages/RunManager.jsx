import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import RunManagerView from '@/components/management/RunManager.jsx';
import { useApiResource } from '@/hooks/useApiResource.js';

const normalizeTruck = (truck = {}) => ({
  ...truck,
  registration_plate:
    truck.registration_plate ||
    truck.registrationPlate ||
    truck.plate ||
    truck.name ||
    '',
});

const normalizeTrailer = (trailer = {}) => ({
  ...trailer,
  registration_plate:
    trailer.registration_plate ||
    trailer.registrationPlate ||
    trailer.plate ||
    trailer.name ||
    '',
});

/**
 * Strona Run Manager – używa pełnego komponentu z folderu management.
 * Prop'y pochodzą z viewConfig (runs, trucks, trailers, drivers, runActions, onDeleteRequest).
 */
const RunManager = (props) => {
  const {
    runs,
    trucks,
    trailers,
    drivers,
    ...rest
  } = props;

  // Fallback: jeśli z dashboardu przyszły puste listy, dociągnij zasoby bezpośrednio.
  const needTrucks = !trucks || trucks.length === 0;
  const needTrailers = !trailers || trailers.length === 0;

  const { data: fetchedTrucks } = useApiResource(
    '/api/trucks',
    { initialFetch: needTrucks, enabled: needTrucks },
    'trucks'
  );
  const { data: fetchedTrailers } = useApiResource(
    '/api/trailers',
    { initialFetch: needTrailers, enabled: needTrailers },
    'trailers'
  );

  const effectiveTrucks = useMemo(
    () =>
      ((needTrucks ? fetchedTrucks : trucks) || []).map((t) =>
        normalizeTruck(t)
      ),
    [needTrucks, fetchedTrucks, trucks]
  );
  const effectiveTrailers = useMemo(
    () =>
      ((needTrailers ? fetchedTrailers : trailers) || []).map((t) =>
        normalizeTrailer(t)
      ),
    [needTrailers, fetchedTrailers, trailers]
  );

  return (
    <RunManagerView
      runs={runs}
      trucks={effectiveTrucks}
      trailers={effectiveTrailers}
      drivers={drivers}
      {...rest}
    />
  );
};

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
