import { VNode } from "preact";
import Page from "../page";

export interface HomeRouteProps {
  path: string;
}

function HomeRoute(props: HomeRouteProps): VNode {
  const { path } = props;

  return <Page path={path} title="Home" />;
}

export default HomeRoute;
