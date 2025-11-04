import { useToast } from '@/contexts/ToastContext.jsx';

function DemoToastButtons() {
  const { showToast } = useToast();

  return (
    <div className="flex gap-2">
      <button onClick={() => showToast('Success! Everything went well.', 'success')}>✅ Success</button>
      <button onClick={() => showToast('Something went wrong!', 'error')}>❌ Error</button>
      <button onClick={() => showToast('Here’s some info for you.', 'info')}>ℹ️ Info</button>
      <button onClick={() => showToast('Be careful!', 'warning')}>⚠️ Warning</button>
    </div>
  );
}
