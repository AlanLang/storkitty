import { useEffect, useState } from "react";

export function ExcalidrawEditDialog() {
  const [Excalidraw, setExcalidraw] = useState<any>(null);

  useEffect(() => {
    import(
      "https://esm.sh/@excalidraw/excalidraw@0.18.0?external=react,react-dom&deps=react@18.3.1"
    ).then((mod) => {
      setExcalidraw(() => mod.Excalidraw);
    });
  }, []);

  if (!Excalidraw) return <div>Loading…</div>;

  return <div style={{ height: "100vh" }}></div>;
}
