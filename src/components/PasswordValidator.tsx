import { FunctionComponent } from "react";

export type PasswordValidatorType = {
  className?: string;

  /** Variant props */
  property1?: "strong";
};

const PasswordValidator: FunctionComponent<PasswordValidatorType> = ({
  className = "",
  property1 = "weak",
}) => {
  return (
    <div
      className={`w-[327px] relative h-[20px] text-left text-[14px] text-[#94a3b8] font-sans ${className}`}
      data-property1={property1}
    >
      <div className="absolute top-[0%] left-[87.46%] leading-[20px] font-medium font-sans">
        Strong
      </div>
      <div className="absolute h-1/5 w-[78.29%] top-[40%] right-[21.71%] bottom-[40%] left-[0%] rounded-[26px] bg-[#50cd89]" />
      <div className="absolute h-1/5 w-[17.74%] top-[40%] right-[62.08%] bottom-[40%] left-[20.18%] rounded-[26px] bg-[#50cd89]" />
      <input
        className="[border:none] [outline:none] bg-[#50cd89] absolute h-1/5 w-[17.74%] top-[40%] right-[41.9%] bottom-[40%] left-[40.37%] rounded-[26px]"
        type="text"
      />
      <div className="absolute h-1/5 w-[17.74%] top-[40%] right-[21.71%] bottom-[40%] left-[60.55%] rounded-[26px] bg-[#50cd89]" />
    </div>
  );
};

export default PasswordValidator;
