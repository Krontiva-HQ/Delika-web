import { FunctionComponent } from "react";

export type PasswordInputType = {
  className?: string;
};

const PasswordInput: FunctionComponent<PasswordInputType> = ({
  className = "",
}) => {
  return (
    <div
      className={`w-[327px] rounded-[40px] border-[#dee1e6] border-[1px] border-solid box-border h-[52px] flex flex-col items-start justify-center py-[7px] px-[16px] text-left text-[11px] text-[#fe5b18] font-[Inter] ${className}`}
    >
      <div className="self-stretch flex flex-row items-center justify-start gap-[10px]">
        <div className="flex-1 flex flex-col items-start justify-start gap-[1px]">
          <div className="w-[254px] relative hidden">Password</div>
          <input
            className="[border:none] [outline:none] font-[Inter] text-[16px] bg-[transparent] self-stretch relative text-[#939090] text-left"
            placeholder="Password"
            type="password"
          />
        </div>
        <img
          className="w-[24px] relative h-[24px] object-cover"
          alt=""
          src="/-icon@2x.png"
        />
      </div>
    </div>
  );
};

export default PasswordInput;
