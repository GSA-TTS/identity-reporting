import { useState } from "preact/hooks";
import type { Ref } from "preact/hooks";
import useResizeListener from "./resize-listener";

function useElementWidth(ref: Ref<HTMLElement>) {
  const [width, setWidth] = useState(undefined as number | undefined);
  useResizeListener(() => setWidth(ref.current?.offsetWidth));
  return width;
}

export default useElementWidth;
