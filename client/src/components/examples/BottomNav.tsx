import { BottomNav } from '../BottomNav';

export default function BottomNavExample() {
  return (
    <div className="h-screen w-full bg-background relative">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Bottom Navigation Example</h2>
        <p className="text-muted-foreground">The bottom navigation bar appears at the bottom on mobile devices.</p>
      </div>
      <BottomNav />
    </div>
  );
}
