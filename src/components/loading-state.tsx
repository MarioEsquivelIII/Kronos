export default function LoadingState({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative w-10 h-10 mb-4">
        <div className="absolute inset-0 border-2 border-gray-200 rounded-full" />
        <div className="absolute inset-0 border-2 border-fortress-500 rounded-full border-t-transparent animate-spin" />
      </div>
      <p className="text-sm text-gray-500 animate-pulse-soft">{message}</p>
    </div>
  );
}
