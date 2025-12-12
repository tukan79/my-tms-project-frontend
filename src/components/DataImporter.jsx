// src/components/DataImporter.jsx
import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Papa from 'papaparse';

import {
  X,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

import api from '@/services/api';
import { useToast } from '@/contexts/ToastContext.jsx';

/* -------------------------------------------------------
   UTILS
------------------------------------------------------- */
const getNestedValue = (obj, path) =>
  path?.split('.')?.reduce((acc, key) => acc?.[key], obj);

/* -------------------------------------------------------
   COMPONENT
------------------------------------------------------- */
const DataImporter = ({
  title,
  apiEndpoint,
  postDataKey,
  dataMappingFn,
  previewColumns,
  onSuccess,
  onCancel,
  refreshFn,
  initialAutoRefresh = true,
}) => {
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [parsingErrors, setParsingErrors] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(initialAutoRefresh);

  /* -------------------------------------------------------
     FILE PARSING
  ------------------------------------------------------- */
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    setFile(selected);
    setParsingErrors([]);
    setError(null);

    Papa.parse(selected, {
      header: true,
      skipEmptyLines: true,
      bom: true,
      complete: ({ data, errors }) => {
        if (errors?.length) {
          setParsingErrors(errors);
          setError('Error parsing CSV file. Please check the file structure.');
          setParsedData([]);
          return;
        }

        const mapped = data.map(dataMappingFn).filter(Boolean);
        setParsedData(mapped);
      },
      error: () => {
        setError('Unable to read CSV file.');
        setParsedData([]);
      },
    });
  };

  /* -------------------------------------------------------
     IMPORT HANDLER
  ------------------------------------------------------- */
  const handleImport = async () => {
    if (parsedData.length === 0) {
      showToast('No valid rows to import.', 'warning');
      return;
    }

    setIsLoading(true);
    setError(null);

    const payload = postDataKey
      ? { [postDataKey]: parsedData }
      : parsedData;

    try {
      const response = await api.post(apiEndpoint, payload);
      const result = response.data;

      showToast(result.message || 'Import completed successfully.', 'success');

      // If backend reports partial errors
      if (result.errors?.length) {
        const msg = result.errors
          .map(e => `Line ${e.line}: ${e.message}`)
          .join('\n');
        setError(`Import completed with issues:\n${msg}`);
      }

      onSuccess?.();

      // Trigger auto-refresh in parent
      if (autoRefresh && typeof refreshFn === 'function') {
        refreshFn();
        showToast('Data refreshed after import.', 'info');
      }

    } catch (err) {
      const msg = err.response?.data?.error || 'Server error during import.';
      showToast(msg, 'error');
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  /* -------------------------------------------------------
     DRAG & DROP
  ------------------------------------------------------- */
  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileChange({ target: { files: e.dataTransfer.files } });
  };

  /* -------------------------------------------------------
     AUTO REFRESH TOGGLE
  ------------------------------------------------------- */
  const toggleAutoRefresh = () => {
    setAutoRefresh(prev => {
      const next = !prev;
      showToast(`Auto-refresh ${next ? 'enabled' : 'disabled'}`, 'info');
      return next;
    });
  };

  /* -------------------------------------------------------
     RENDER
  ------------------------------------------------------- */
  return (
    <div className="card">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="flex items-center gap-2">
          <UploadCloud size={22} /> {title}
        </h2>

        <div className="flex items-center gap-3">

          {/* Auto-refresh toggle */}
          <button
            type="button"
            onClick={toggleAutoRefresh}
            className={`btn-small ${autoRefresh ? 'btn-active' : 'btn-secondary'}`}
          >
            <RefreshCw
              size={16}
              className={autoRefresh ? 'animate-spin-slow' : ''}
            />
            <span className="ml-1">
              {autoRefresh ? 'Auto ON' : 'Auto OFF'}
            </span>
          </button>

          {/* Close */}
          <button onClick={onCancel} className="btn-icon">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* ERROR BOX */}
      {error && (
        <div className="error-message mb-3" style={{ whiteSpace: 'pre-wrap' }}>
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* CONTENT AREA */}
      {file ? (
        <>
          {/* File info */}
          <div className="file-info flex items-center gap-2 mb-3">
            <FileText size={24} />
            <span>{file.name}</span>
            <button
              className="btn-icon"
              onClick={() => {
                setFile(null);
                setParsedData([]);
                setParsingErrors([]);
                setError(null);
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* CSV parsing errors */}
          {parsingErrors.length > 0 && (
            <div className="error-message p-3 rounded mb-3 max-h-40 overflow-auto">
              <strong>CSV Parsing Errors:</strong>
              <ul className="mt-1">
                {parsingErrors.slice(0, 5).map(err => (
                  <li key={`err-${err.row}-${err.message}`}>
                    Row {err.row}: {err.message}
                  </li>
                ))}
              </ul>
              {parsingErrors.length > 5 && (
                <p>...and {parsingErrors.length - 5} more.</p>
              )}
            </div>
          )}

          {/* Preview table */}
          {parsedData.length > 0 && (
            <>
              <p className="text-sm">
                <CheckCircle size={16} color="green" /> Parsed{' '}
                <strong>{parsedData.length}</strong> rows.
              </p>

              <div className="table-container-scrollable mt-2 max-h-72">
                <table className="data-table">
                  <thead>
                    <tr>
                      {previewColumns.map(col => (
                        <th key={col.key}>{col.header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 5).map((row, i) => (
                      <tr key={`preview-${i}`}>
                        {previewColumns.map(col => (
                          <td key={col.key}>
                            {col.render
                              ? col.render(row)
                              : getNestedValue(row, col.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedData.length > 5 && (
                <p className="text-center mt-1">
                  ...and {parsedData.length - 5} more rows.
                </p>
              )}
            </>
          )}

          {/* ACTIONS */}
          <div className="form-actions mt-4">
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleImport}
              disabled={isLoading || parsedData.length === 0}
            >
              {isLoading
                ? 'Importing...'
                : `Import ${parsedData.length} Records`}
            </button>
          </div>
        </>
      ) : (
        /* DROPZONE */
        <button
          type="button"
          className="dropzone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <UploadCloud size={48} />
          <p className="mt-2">Drag & drop CSV file here, or click to browse.</p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            hidden
          />
        </button>
      )}
    </div>
  );
};

export default DataImporter;

/* -------------------------------------------------------
   PROP TYPES
------------------------------------------------------- */
DataImporter.propTypes = {
  title: PropTypes.string.isRequired,
  apiEndpoint: PropTypes.string.isRequired,
  postDataKey: PropTypes.string,
  dataMappingFn: PropTypes.func.isRequired,
  previewColumns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.string.isRequired,
      render: PropTypes.func,
    })
  ).isRequired,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
  refreshFn: PropTypes.func,
  initialAutoRefresh: PropTypes.bool,
};
