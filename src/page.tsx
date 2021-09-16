import { ComponentChildren, VNode } from "preact";
import Header from "./header";

interface PageProps {
  path: string;
  children?: ComponentChildren;
  title: string;
}

function Page({ path, children, title }: PageProps): VNode {
  return (
    <>
      <Header path={path} />
      <h1>{title}</h1>
      <main>{children}</main>
    </>
  );
}

export default Page;
