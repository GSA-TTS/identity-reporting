import { ComponentChildren, VNode } from "preact";

interface PageProps {
  children?: ComponentChildren;
  title: string;
}

function Page({ children, title }: PageProps): VNode {
  return (
    <div className="grid-container">
      <div className="grid-row">
        <div className="grid-col-fill">
          <h1>{title}</h1>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}

export default Page;
