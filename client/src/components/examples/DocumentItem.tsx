import { DocumentItem } from '../DocumentItem';

export default function DocumentItemExample() {
  const sampleDocument = {
    id: '1',
    name: 'Resume.pdf',
    type: 'PDF',
    size: '245 KB',
    uploadedDate: '2025-11-20',
  };

  return (
    <div className="p-6 max-w-md">
      <DocumentItem
        document={sampleDocument}
        onView={(id) => console.log('View:', id)}
        onDownload={(id) => console.log('Download:', id)}
        onDelete={(id) => console.log('Delete:', id)}
      />
    </div>
  );
}
