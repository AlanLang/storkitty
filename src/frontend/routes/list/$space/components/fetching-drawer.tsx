import { Loader } from "lucide-react";
import { useEffect, useState } from "react";

export function FetchingDrawer() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) {
    return null;
  }

  return (
    <div className="flex items-center justify-center p-4 absolute inset-0 z-40 animate-fade-in-delayed">
      <Loader className="size-8 animate-spin text-primary" />
    </div>
  );
}
