import { FunctionComponent } from "react";

export type NewPasswordType = {
  className?: string;
  icon1?: string;

  /** Variant props */
  icon?: "Both";
  state?: "Filled";
  type?: "Default";
};

const NewPassword: FunctionComponent<NewPasswordType> = ({
  className = "",
  icon = false,
  state = "Filled",
  type = "Default",
  icon1,
}) => {
  return (
    <div
      className={`w-[327px] rounded-[8px] overflow-hidden flex flex-col items-start justify-center ${className}`}
      data-icon={icon}
      data-state={state}
      data-type={type}
    >
      <div className="self-stretch rounded-[78px] bg-[#fff] border-[#eaecf0] border-[1px] border-solid flex flex-row items-center justify-start p-[16px] gap-[8px]">
        <img
          className="w-[20px] relative h-[20px] overflow-hidden shrink-0 object-cover"
          alt=""
          src={icon1}
        />
        <input
          className="[border:none] [outline:none] font-medium font-sans text-[14px] bg-[transparent] flex-1 relative leading-[20px] text-[#101828] text-left"
          type="password"
        />
        <img
          className="w-[20px] relative h-[20px] overflow-hidden shrink-0 object-cover"
          alt=""
          src="/icon@2x.png"
        />
      </div>
    </div>
  );
};

export default NewPassword;
