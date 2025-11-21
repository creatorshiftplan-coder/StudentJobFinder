import { EmptyState } from '../EmptyState';
import { FileText } from 'lucide-react';

export default function EmptyStateExample() {
  return (
    <div className="p-6">
      <EmptyState
        title="No documents yet"
        description="Upload your first document to get started with your job applications"
        icon={FileText}
        action={{
          label: 'Upload Document',
          onClick: () => console.log('Upload clicked')
        }}
      />
    </div>
  );
}
