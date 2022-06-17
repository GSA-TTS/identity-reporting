import { VNode } from "preact";

import SpriteURL from "../../node_modules/identity-style-guide/dist/assets/img/sprite.svg";

interface IconProps {
  icon: string;
}
export default function Icon({ icon }: IconProps): VNode {
  return (
    <svg className="usa-icon" aria-hidden="true" focusable="false" role="img">
      <use href={`${SpriteURL}#${icon}`} />
    </svg>
  );
}
