import React from 'react';
import { Bug } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext.jsx';
import api from '@/services/api.js';

const BugReportButton = () => {
  const { showToast } = useToast();

  const handleReport = async () => {
    const description = prompt('Opisz błąd, który wystąpił:');
    if (!description) {
      return;
    }

    try {
      await api.post('/api/feedback/report-bug', {
        description,
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          reportingUser: JSON.parse(localStorage.getItem('user')) || {
            email: 'anonymous@mytms.app',
            userId: null,
            role: 'guest',
          },
        },
      });

      showToast('Bug report sent successfully. Thank you!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to send bug report.', 'error');
    }
  };

  return (
    <button onClick={handleReport} className="btn btn-secondary bug-report-btn" title="Report a Bug">
      <Bug size={18} style={{ marginRight: '8px' }} /> Report a Bug
    </button>
  );
};

export default BugReportButton;