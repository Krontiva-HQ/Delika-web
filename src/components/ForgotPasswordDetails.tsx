import { FunctionComponent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginButton from "./LoginButton";
import useResetPassword from "../hooks/useResetPassword";
import { useEmail } from '../context/EmailContext';

export type ForgotPasswordDetailsType = {
  className?: string;
};

const ForgotPasswordDetails: FunctionComponent<ForgotPasswordDetailsType> = ({
  className = "",
}) => {
  const navigate = useNavigate();
  const { resetPassword, loading, error: resetError } = useResetPassword();
  const { email = '', setEmail = () => {} } = useEmail() ?? {};
  const [error, setError] = useState<string | null>(null);

  const handleSendOTP = async () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setError('Invalid Email Address');
      return;
    }
    
    await resetPassword(email);
    if (!resetError) {
      navigate('/enter-otp');
    }
  };

  return (
    <div className="font-sans min-h-screen w-full relative bg-white overflow-hidden text-right text-[12px] text-[#fe5b18]">
      <div className="hidden lg:block absolute inset-0 lg:w-1/2 2xl:w-[45%]">
        <img
          className="h-screen w-full object-cover object-center"
          alt="Forgot password background"
          src="/forgotpasswordimg@2x.png"
        />
      </div>

      <div className="relative min-h-screen flex flex-col lg:flex-row">
        <div className="hidden lg:block lg:w-1/2 2xl:w-[45%]" />

        <div className="w-full lg:w-1/2 2xl:w-[55%] flex items-center justify-center p-4">
          <div className="w-full max-w-[320px] mx-auto">
            <div className="mb-6 text-center">
              <div className="flex flex-col items-center justify-center gap-[14px]">
                <img
                  className="w-[28px] h-[34px] object-cover"
                  alt="Delika logo"
                  src="/group-461@2x.png"
                />
                <b className="font-sans text-[28px] tracking-[-0.28px] leading-tight text-[#fe5b18]">
                  Delika
                </b>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                className="font-sans cursor-pointer [text-decoration:none] flex flex-row items-center justify-start gap-[5px] text-left text-[14px] text-[#201a18]"
                to="/login"
              >
                <img
                  className="w-[20px] h-[20px]"
                  alt=""
                  src="/vuesaxlineararrowleft.svg"
                />
                <div className="relative font-sans">Back</div>
              </Link>

              <div className="text-left mb-4">
                <div className="font-sans font-semibold text-[24px] text-[#201a18] mb-1">
                  Forgot Password
                </div>
                <div className="font-sans text-[14px] text-[#a7a19e]">
                  Enter your registered email address. We'll send you a code to reset your password.
                </div>
              </div>

              <input
                className="w-[290px] border-[#dee1e6] border-[1px] border-solid rounded-[35px] h-[38px] 
                          flex items-center px-[12px] text-left"
                placeholder="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {error && (
                <div className="font-sans text-[#fe5b18] text-xs text-left">
                  {error}
                </div>
              )}

              <button
                className="font-sans w-full h-[38px] bg-[#fe5b18] text-white rounded-[28px] 
                          text-[14px] hover:bg-[#e54d0e] 
                          transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={handleSendOTP}
                disabled={loading}
              >
                {loading ? (
                  <div className="font-sans flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Sending...
                  </div>
                ) : (
                  'Send OTP'
                )}
              </button>

              <div className="mt-6 text-center">
                <p className="text-gray-500 text-xs mb-1">Powered By</p>
                <img
                  src="/Krontiva-Black.png"
                  alt="Powered by Krontiva"
                  className="h-6 mx-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordDetails;
