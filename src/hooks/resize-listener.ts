import { useEffect, Ref } from "preact/hooks";

function useResizeListener(ref: Ref<HTMLElement | null>, listener: () => void): void {
  useEffect(() => {
    listener();

    window.addEventListener("resize", listener);
    return () => window.removeEventListener("resize", listener);
  });
}

export default useResizeListener;
