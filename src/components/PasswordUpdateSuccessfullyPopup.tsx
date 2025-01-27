import { FunctionComponent } from "react";
import { useNavigate } from "react-router-dom";

export type PasswordUpdateSuccessfullyPopupType = {
  className?: string;
};

const PasswordUpdateSuccessfullyPopup: FunctionComponent<
  PasswordUpdateSuccessfullyPopupType
> = ({ className = "" }) => {
  const navigate = useNavigate();

  const handleBackToLogin = () => {
    navigate('/login'); // or whatever your login route is
  };

  return (
    <div
      className={`w-[387px] rounded-[30px] bg-[#fff] max-w-full h-[415px] relative text-center text-[30px] text-[#201a18] font-sans ${className}`}
    >
      <div className="mt-[180px] mx-auto w-[279px] flex flex-col items-center justify-start gap-[5px]">
        <b className="self-stretch font-sans">Password Updated</b>
        <div className="self-stretch font-sans text-[16px] text-[#a7a19e]">
          Your password has been updated successfully
        </div>
      </div>
      <button
        onClick={handleBackToLogin}
        className="cursor-pointer font-sans text-[16px] bg-[#201a18] absolute bottom-[34px] left-[30px] rounded-[52px] w-[327px] h-[52px] flex flex-row items-center justify-center p-[20px] box-border text-[#fff] hover:bg-[#363130] transition-colors duration-200"
      >
        Back to Login
      </button>
      <b className="absolute top-[30px] left-[calc(50%_-_49.5px)] text-[100px] font-sans">{`🎉`}</b>
    </div>
  );
};

export default PasswordUpdateSuccessfullyPopup;
