import { JobCard } from '../JobCard';

export default function JobCardExample() {
  const sampleJob = {
    id: '1',
    title: 'Software Developer',
    company: 'Tech Corp',
    location: 'Mumbai, India',
    type: 'Full-time',
    deadline: '2025-12-31',
    description: 'Join our dynamic team to build innovative solutions. We are looking for passionate developers.',
    salary: '₹6-8 LPA',
    applied: false,
  };

  return (
    <div className="p-6 max-w-md">
      <JobCard job={sampleJob} onApply={(id) => console.log('Apply to job:', id)} />
    </div>
  );
}
