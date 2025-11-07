//importerConfig.js
//import React, { useState } from 'react';
import Papa from 'papaparse';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

// 🔒 Helper — logowanie błędów do backendu
const logImportError = async (errorDetails) => {
  try {
    await fetch('/api/bug_reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: `Import Error: ${errorDetails.message}`,
        context: {
          userAgent: navigator.userAgent,
          url: window.location.href,
          fileName: errorDetails.fileName || null,
          apiEndpoint: errorDetails.apiEndpoint || null,
          totalRecords: errorDetails.totalRecords || null,
          errorType: errorDetails.type || 'ImportError',
          stack: errorDetails.stack || null,
          sampleRow: errorDetails.sampleRow || null,
        },
        reportedAt: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn('⚠️ Failed to send bug report:', err);
  }
};

const DataImporter = ({ title, apiEndpoint, postDataKey, dataMappingFn, previewColumns, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [error, setError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);

    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      setError('❌ Please select a valid CSV file.');
      return;
    }

    setFile(selectedFile);
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!Array.isArray(results.data) || results.data.length === 0) {
          const msg = '❌ No valid data found in the CSV file.';
          setError(msg);
          logImportError({
            message: msg,
            fileName: selectedFile.name,
            apiEndpoint,
            totalRecords: 0,
          });
          return;
        }

        try {
          const mapped = results.data.map((row, i) => {
            const mappedRow = dataMappingFn(row);
            if (typeof mappedRow !== 'object' || mappedRow === null) {
              throw new Error(`Invalid row mapping at line ${i + 1}`);
            }
            return mappedRow;
          });

          const hasInvalidData = mapped.some(
            (item) => typeof item !== 'object' || item === null || Array.isArray(item)
          );

          if (hasInvalidData) {
            throw new Error('Some rows contain invalid data structures.');
          }

          setParsedData(mapped);
          setError(null);
        } catch (err) {
          console.error('🚨 Mapping error:', err);
          const message = `❌ Data mapping failed: ${err.message}`;
          setError(message);
          logImportError({
            message,
            fileName: selectedFile.name,
            apiEndpoint,
            totalRecords: results.data?.length || 0,
            stack: err.stack,
            sampleRow: results.data?.[0],
          });
        }
      },
      error: (err) => {
        console.error('🚨 CSV Parse error:', err);
        const message = `❌ Error parsing CSV file: ${err.message}`;
        setError(message);
        logImportError({
          message,
          fileName: selectedFile.name,
          apiEndpoint,
          stack: err.stack,
        });
      },
    });
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      toast({ title: 'No data', description: 'Please import a CSV file first.' });
      return;
    }

    setIsUploading(true);
    try {
      const payload = postDataKey ? { [postDataKey]: parsedData } : parsedData;

      const res = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Server responded with ${res.status}: ${text}`);
      }

      const json = await res.json();
      toast({
        title: '✅ Import successful',
        description: `${json.count || parsedData.length} records imported.`,
      });
      onSuccess?.();
    } catch (err) {
      console.error('🚨 Upload failed:', err);
      const message = `Import failed: ${err.message}`;
      toast({
        title: 'Import failed',
        description: err.message,
        variant: 'destructive',
      });
      logImportError({
        message,
        fileName: file?.name,
        apiEndpoint,
        totalRecords: parsedData?.length || 0,
        stack: err.stack,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const validatePreviewColumns = () => {
    if (!Array.isArray(previewColumns) || previewColumns.length === 0) return false;
    return previewColumns.every((col) => col.key && col.header);
  };

  const renderPreview = () => {
    if (!validatePreviewColumns()) {
      return <div className="text-red-500">❌ Invalid preview configuration.</div>;
    }

    return (
      <table className="min-w-full border border-gray-300 text-sm mt-3">
        <thead>
          <tr className="bg-gray-100">
            {previewColumns.map((col) => (
              <th key={col.key} className="px-3 py-2 border-b font-semibold text-left">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {parsedData.slice(0, 5).map((row, i) => (
            <tr key={i} className="odd:bg-white even:bg-gray-50">
              {previewColumns.map((col) => {
                try {
                  const value = col.render
                    ? col.render(row)
                    : col.key.split('.').reduce((acc, part) => acc?.[part], row);
                  return (
                    <td key={col.key} className="px-3 py-2 border-b">
                      {value ?? '-'}
                    </td>
                  );
                } catch (err) {
                  console.warn(`⚠️ Preview render error for ${col.key}`, err);
                  logImportError({
                    message: `Preview render error for ${col.key}: ${err.message}`,
                    fileName: file?.name,
                    apiEndpoint,
                    stack: err.stack,
                    sampleRow: row,
                  });
                  return (
                    <td key={col.key} className="px-3 py-2 border-b text-red-500">
                      ⚠️ Error
                    </td>
                  );
                }
              })}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <Card className="w-full max-w-3xl mx-auto mt-6 shadow-md">
      <CardHeader>
        <h2 className="text-lg font-semibold">{title || 'Data Importer'}</h2>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-300 text-red-600 p-3 rounded-md mb-3">
            <p>{error}</p>
            <div className="mt-2 flex gap-2">
              <Button variant="outline" onClick={() => setError(null)}>Retry</Button>
              <Button variant="destructive" onClick={onCancel}>Cancel</Button>
            </div>
          </div>
        )}

        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="mb-4 block"
        />

        {parsedData.length > 0 && (
          <>
            <h3 className="font-semibold mt-3 mb-1">Preview ({parsedData.length} rows)</h3>
            {renderPreview()}
            <div className="mt-4 flex gap-2">
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Upload Data'}
              </Button>
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DataImporter;
