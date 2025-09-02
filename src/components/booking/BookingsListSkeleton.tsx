export default function BookingsListSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 animate-pulse">
          <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
          <div className="h-4 w-1/2 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="mt-4 border-t pt-4 flex justify-between items-center">
            <div>
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
            <div className="text-right">
              <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}