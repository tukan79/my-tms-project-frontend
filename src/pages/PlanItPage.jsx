// PlanItPage.jsx
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { DragDropContext } from '@hello-pangea/dnd';
import PlanItOrders, { useHomeZone } from '@/components/shared/PlanItOrders.jsx';
import PlanItRuns from '@/components/plan-it/PlanItRuns.jsx';
import { usePopOut } from '@/contexts/PopOutContext.jsx'; // Ścieżka względna, więc bez zmian
import AddRunForm from '@/components/forms/AddRunForm.jsx';
import { PlanItProvider, usePlanIt } from '@/contexts/PlanItContext.jsx';
import ActiveRunView from '@/components/plan-it/ActiveRunView.jsx';

const PlanItPage = (props) => {
  const popOutData = usePopOut();
  
  // POPRAWIONE: Poprawna logika destrukturyzacji
  const isInPopOut = Boolean(popOutData);
  const sourceData = isInPopOut ? popOutData : props;
  
  const {
    isPopOut = isInPopOut,
    ...restProps
  } = sourceData;

  const handlePopOut = useCallback((view) => {
    // 1. Bezpieczniejsza serializacja: Jawnie wybieramy, co zapisać.
    const serializableKeys = ['orders', 'runs', 'assignments', 'drivers', 'trucks', 'trailers', 'zones', 'pallets'];
    const dataToStore = {};
    serializableKeys.forEach(key => {
      if (restProps[key]) {
        dataToStore[key] = restProps[key];
      }
    });
    
    sessionStorage.setItem('popOutData', JSON.stringify(dataToStore));
    window.open(`/planit/popout`, `PlanIt View`, 'width=1200,height=800,resizable=yes,scrollbars=yes');
  }, [restProps]);

  return (
    <PlanItProvider initialData={restProps} {...restProps}>
      <PlanItContent isPopOut={isPopOut} handlePopOut={handlePopOut} />
    </PlanItProvider>
  );
};

const PlanItContent = ({ isPopOut, handlePopOut }) => {
  const {
    selectedDate, activeRunId, editingRun, isFormVisible, selectedOrderIds, contextMenu, handleAddNewRun,
    setSelectedDate, setActiveRunId, setIsFormVisible, handleSaveRun, handleBulkAssign, handleBulkDelete, setContextMenu, triggerRefresh, handleEditRun, 
    enrichedRuns, availableOrders, activeRun, ordersForActiveRun, handleDragEnd, handleDeleteAssignment, handleDeleteRun, isLoadingRuns,
    initialData: { drivers, trucks, trailers, zones }
  } = usePlanIt();

  const homeZone = useHomeZone(zones || []);

  React.useEffect(() => {
    const handleClick = () => setContextMenu({ visible: false, x: 0, y: 0 });
    globalThis.addEventListener('click', handleClick);
    return () => globalThis.removeEventListener('click', handleClick);
  }, [setContextMenu]);

  const handleRunSelect = useCallback((runId) => {
    setActiveRunId(currentId => (currentId === runId ? null : runId));
  }, [setActiveRunId]);

  const handleDeselectRun = useCallback(() => setActiveRunId(null), [setActiveRunId]);

  // Zabezpieczenie: Jeśli kluczowe dane nie są jeszcze załadowane, wyświetl komunikat.
  if (!drivers || !trucks || !trailers || !zones) {
    return <div className="loading">Loading planning data...</div>;
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {/* 3. Optymalizacja: Renderuj formularz tylko wtedy, gdy jest widoczny. */}
      {isFormVisible && (
        <>
          <button
            type="button"
            className="modal-backdrop"
            onClick={() => setIsFormVisible(false)}
            aria-label="Close form"
          />
          <AddRunForm
            itemToEdit={editingRun ?? null}
            onSuccess={handleSaveRun}
            onCancel={() => setIsFormVisible(false)}
            // Zabezpieczenie przed przekazaniem `undefined`
            drivers={drivers || []}
            trucks={trucks || []}
            trailers={trailers || []}
          />
        </>
      )}
      <div className="planit-container-resizable">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem', height: '100%' }}>
          <PlanItOrders 
            orders={availableOrders} 
            zones={zones || []}
            homeZone={homeZone}
            selectedDate={selectedDate}
            onRefresh={triggerRefresh} // Przekazujemy funkcję odświeżającą
            onPopOut={handlePopOut}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: 0 }}>
            {contextMenu.visible && (
              <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
                <button type="button" onClick={handleBulkAssign} disabled={!activeRunId} aria-label="Assign selected to active run">
                  Assign to Active Run
                </button>
                {selectedOrderIds.length > 1 && (
                  <button type="button" onClick={handleBulkDelete} className="btn-danger" aria-label={`Delete ${selectedOrderIds.length} orders`}>
                    Delete {selectedOrderIds.length} Orders
                  </button>
                )}
              </div>
            )}
            <PlanItRuns 
              runs={enrichedRuns} 
              onPopOut={handlePopOut} 
              onDelete={handleDeleteRun}
              handleAddNewRun={handleAddNewRun}
              onEdit={handleEditRun}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              activeRunId={activeRunId}
              isLoading={isLoadingRuns}
              onRunSelect={handleRunSelect}
            />
            <ActiveRunView
              run={activeRun}
              assignedOrders={ordersForActiveRun || []}
              onDeselect={handleDeselectRun}
              onDeleteAssignment={handleDeleteAssignment}
              homeZone={homeZone}
              triggerRefresh={triggerRefresh}
            />
          </div>
        </div>
      </div>
    </DragDropContext>
  );
};

PlanItContent.propTypes = {
  isPopOut: PropTypes.bool,
  handlePopOut: PropTypes.func,
};

export default PlanItPage;

PlanItPage.propTypes = {
  isPopOut: PropTypes.bool,
  handlePopOut: PropTypes.func,
};

PlanItPage.propTypes = {
  isPopOut: PropTypes.bool,
  handlePopOut: PropTypes.func,
  orders: PropTypes.array,
  runs: PropTypes.array,
  assignments: PropTypes.array,
  drivers: PropTypes.array,
  trucks: PropTypes.array,
  trailers: PropTypes.array,
  zones: PropTypes.array,
};
// ostatnia zmiana (30.05.2024, 13:14:12)
