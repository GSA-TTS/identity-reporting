import { useEffect } from "preact/hooks";

function useResizeListener(listener: () => void): void {
  useEffect(() => {
    listener();

    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  });
}

export default useResizeListener;
