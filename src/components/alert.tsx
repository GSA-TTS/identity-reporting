import { ComponentChildren } from "preact";

interface AlertProps {
  level: "warning" | "error" | "info" | "success";
  className?: string;
  title: string;
  children?: ComponentChildren;
}

export default function Alert({ level, title, children, className }: AlertProps) {
  const resultClassName = ["usa-alert", `usa-alert--${level}`, className].filter(Boolean).join(" ");
  return (
    <div className={resultClassName} role="alert">
      <div className="usa-alert__body">
        <h4 className="usa-alert__heading">{title}</h4>
        <p className="usa-alert__text">{children}</p>
      </div>
    </div>
  );
}
