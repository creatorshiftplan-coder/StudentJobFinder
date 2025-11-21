import { StatsCard } from '../StatsCard';
import { Briefcase } from 'lucide-react';

export default function StatsCardExample() {
  return (
    <div className="p-6 max-w-sm">
      <StatsCard
        title="Applications"
        value={12}
        icon={Briefcase}
        description="Total applications submitted"
        trend={{ value: 20, isPositive: true }}
      />
    </div>
  );
}
