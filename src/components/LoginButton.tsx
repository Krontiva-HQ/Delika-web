import { FunctionComponent, useMemo, type CSSProperties } from "react";

export type LoginButtonType = {
  className?: string;
  button?: string;

  /** Variant props */
  size?: "Giant";
  state?: "Button Auto Width";
  type?: "Fill";

  /** Style props */
  buttonWidth?: CSSProperties["width"];
  buttonBorderRadius?: CSSProperties["borderRadius"];
  buttonHeight?: CSSProperties["height"];
};

const LoginButton: FunctionComponent<LoginButtonType> = ({
  className = "",
  size = "Giant",
  state = "Icon",
  type = "Fill",
  button,
  buttonWidth,
  buttonBorderRadius,
  buttonHeight,
}) => {
  const buttonStyle: CSSProperties = useMemo(() => {
    return {
      width: buttonWidth,
      borderRadius: buttonBorderRadius,
      height: buttonHeight,
    };
  }, [buttonWidth, buttonBorderRadius, buttonHeight]);

  return (
    <button
      className={`cursor-pointer [border:none] p-[20px] bg-[#fe5b18] w-[327px] rounded-[28px] h-[52px] flex flex-row items-center justify-center box-border ${className}`}
      data-size={size}
      data-state={state}
      data-type={type}
      style={buttonStyle}
    >
      <div className="relative text-[16px] font-sans text-[#fff] text-left">
        {button}
      </div>
    </button>
  );
};

export default LoginButton;
