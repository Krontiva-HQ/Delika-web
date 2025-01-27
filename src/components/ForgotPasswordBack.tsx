import { FunctionComponent } from "react";
import { Link } from "react-router-dom";

export type ForgotPasswordBackType = {
  className?: string;
};

const ForgotPasswordBack: FunctionComponent<ForgotPasswordBackType> = ({
  className = "",
}) => {
  return (
    <Link
      className={`font-sans cursor-pointer [text-decoration:none] flex flex-row items-center justify-start gap-[5px] text-left text-[16px] text-[#201a18] ${className}`}
      to="/login"
    >
      <img
        className="w-[24px] relative h-[24px]"
        alt=""
        src="/vuesaxlineararrowleft.svg"
      />
      <div className="relative font-sans">Back</div>
    </Link>
  );
};

export default ForgotPasswordBack;
