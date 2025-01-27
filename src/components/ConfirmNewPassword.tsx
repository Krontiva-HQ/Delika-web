import { FunctionComponent } from "react";

export type ConfirmNewPasswordType = {
  className?: string;

  /** Variant props */
  type?: "Label & Icon";
  variant?: "Primary";
};

const ConfirmNewPassword: FunctionComponent<ConfirmNewPasswordType> = ({
  className = "",
  type = "Icon Only",
  variant = "Outline",
}) => {
  return (
    <button
      className={`cursor-pointer [border:none] p-[16px] bg-[#fe5b18] w-[327px] rounded-[30px] flex flex-row items-center justify-center box-border gap-[8px] ${className}`}
      data-type={type}
      data-variant={variant}
    >
      <img
        className="w-[20px] relative h-[20px] overflow-hidden shrink-0 hidden"
        alt=""
        src="/icon1.svg"
      />
      <div className="relative text-[14px] leading-[20px] font-semibold font-sans text-[#fff] text-center">
        Confirm New Password
      </div>
      <img
        className="w-[20px] relative h-[20px] overflow-hidden shrink-0 hidden"
        alt=""
        src="/icon1.svg"
      />
    </button>
  );
};

export default ConfirmNewPassword;
