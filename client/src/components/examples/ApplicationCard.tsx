import { ApplicationCard } from '../ApplicationCard';

export default function ApplicationCardExample() {
  const sampleApplication = {
    id: '1',
    jobTitle: 'Junior Software Engineer',
    company: 'ABC Technologies',
    appliedDate: '2025-11-15',
    status: 'shortlisted' as const,
    deadline: '2025-12-25',
    admitCardUrl: '#',
  };

  return (
    <div className="p-6 max-w-md">
      <ApplicationCard 
        application={sampleApplication}
        onViewDetails={(id) => console.log('View details:', id)}
      />
    </div>
  );
}
