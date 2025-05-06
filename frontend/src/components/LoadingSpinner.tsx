export const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <span className="loading loading-spinner text-primary w-16 h-16"></span>
        <span className="mt-4 text-gray-700">Processing</span>
      </div>
    </div>
  );
}; 