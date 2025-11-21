import { SignatureCanvas } from '../SignatureCanvas';

export default function SignatureCanvasExample() {
  return (
    <div className="p-6 max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">Draw Your Signature</h3>
      <SignatureCanvas onSave={(dataUrl) => console.log('Signature saved:', dataUrl.substring(0, 50) + '...')} />
    </div>
  );
}
