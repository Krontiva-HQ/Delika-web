import { FunctionComponent, useRef, KeyboardEvent, ChangeEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import LoginButton from "./LoginButton";
import { useEmail } from '../context/EmailContext';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

export type TWOFALoginDetailsType = {
  className?: string;
};

const TWOFALoginDetails: FunctionComponent<TWOFALoginDetailsType> = ({
  className = "",
}) => {
  const navigate = useNavigate();
  const { email } = useEmail();
  const { verify2FA } = useAuth();
  const [validationError, setValidationError] = useState<string | null>(null);

  // Create refs for each input
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Handle input change
  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    // Auto move to next input if value is entered
    if (value && index < inputRefs.length - 1) {
      inputRefs[index + 1].current?.focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4).split('');
    
    pastedData.forEach((value, index) => {
      if (index < inputRefs.length && /^\d$/.test(value)) {
        const input = inputRefs[index].current;
        if (input) {
          input.value = value;
          if (index < inputRefs.length - 1) {
            inputRefs[index + 1].current?.focus();
          }
        }
      }
    });
  };

  // Handle OTP verification
  const handleVerify = async () => {
    const otp = inputRefs.map(ref => ref.current?.value).join('');
    
    if (otp.length !== 4) {
      setValidationError('Please enter a valid OTP code');
      return;
    }

    const success = await verify2FA(otp);
    if (!success) {
      setValidationError('Incorrect OTP code');
    }
  };

  return (
    <div className="font-sans min-h-screen w-full relative bg-white overflow-hidden text-right text-[12px] text-[#fe5b18]">
    <div className="hidden lg:block absolute inset-0 lg:w-1/2 2xl:w-[45%]">
      <img
        className="h-screen w-full object-cover object-center"
        alt="Forgot password background"
        src="/rectangle-34632721@2x.png"
      />
    </div>

    <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left side - Image space */}
        <div className="hidden lg:block lg:w-1/2 2xl:w-[45%]" />

        {/* Right side - OTP Form */}
        <div className="w-full lg:w-1/2 2xl:w-[55%] flex items-center justify-center p-4">
          <div className="w-full max-w-[320px] mx-auto">
            {/* Logo Section */}
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

            {/* Form Section */}
            <div className="space-y-3">
              {/* Back Button and Error Message on same line */}
              <div className="flex justify-end items-center">
                <Link
                  className="font-sans cursor-pointer [text-decoration:none] flex flex-row items-center justify-start gap-[5px] text-left text-[14px] text-[#201a18] mr-auto"
                  to="/login"
                >
                  <img
                    className="w-[24px] relative h-[24px]"
                    alt=""
                    src="/vuesaxlineararrowleft.svg"
                  />
                  <div className="relative">Back</div>
                </Link>
              
              </div>

              {/* Header Section */}
              <div className="flex flex-col items-start justify-start gap-[5px] w-full mb-4">
                <div className="font-sans relative font-semibold text-[18px] text-[#201a18]">
                  2FA Authentication
                </div>
                <div className="font-sans w-full text-[12px] text-[#a7a19e]">
                  <div className="text-left mb-1">
                    A 2FA code has been sent to your registered email address to complete your login process.
                  </div>
                </div>
              </div>

              {/* OTP Input Section */}
              <div className="flex gap-[20px] w-full">
                {inputRefs.map((ref, index) => (
                  <input
                    key={index}
                    ref={ref}
                    className="font-sans w-[60px] h-[50px] border-[#dee1e6] border-[1px] border-solid rounded-[10px]
                              text-center text-[20px] font-bold bg-transparent [outline:none]
                              focus:border-[#fe5b18] transition-colors duration-200"
                    type="text"
                    maxLength={1}
                    onChange={(e) => handleChange(index, e)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                  />
                ))}
              </div>

              {/* Error Message */}
              {validationError && (
                <div className="font-sans text-[#fe5b18] text-xs text-center mt-2">
                  {validationError}
                </div>
              )}

              {/* Verify Button */}
              <button
                onClick={handleVerify}
                className="font-sans w-full h-[38px] bg-[#fe5b18] text-white rounded-[28px] 
                          text-[14px] hover:bg-[#e54d0e] 
                          transition-colors duration-200"
              >
                Verify
              </button>

              {/* Krontiva Footer Logo */}
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
}
export default TWOFALoginDetails;
