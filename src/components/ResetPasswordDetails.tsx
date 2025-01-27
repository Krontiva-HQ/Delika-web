import { FunctionComponent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import useChangePassword from '../hooks/useChangePassword';
import { useEmail } from '../context/EmailContext';

const ResetPasswordDetails: FunctionComponent = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState("weak");
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const { changePassword, isLoading } = useChangePassword();
  const { email } = useEmail() ?? {};

  const checkPasswordStrength = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    
    if (password.length === 0) return "weak";
    if (hasUpperCase && hasLowerCase && hasNumbers) return "strong";
    if ((hasUpperCase && hasLowerCase) || (hasUpperCase && hasNumbers) || (hasLowerCase && hasNumbers)) return "medium";
    return "weak";
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
    setValidationError(null);
  };

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    if (!email) {
      setValidationError("Email is required");
      return;
    }

    if (passwordStrength === "weak") {
      setValidationError("Password is too weak. Please include uppercase, lowercase, and numbers.");
      return;
    }

    try {
      const response = await changePassword(email, password);

      if (response.success) {
        navigate("/login");
      } else {
        setValidationError(response.error || "Failed to change password");
      }
    } catch (error) {
      console.error('Password reset failed:', error);
      setValidationError("Failed to reset password. Please try again.");
    }
  };

  return (
    <div className="font-sans min-h-screen w-full relative bg-white overflow-hidden text-right text-[12px] text-[#fe5b18]">
      {/* Background Image - Hidden on mobile and tablet */}
      <div className="hidden lg:block absolute inset-0 lg:w-1/2 2xl:w-[45%]">
        <img
          className="h-screen w-full object-cover object-center"
          alt="Reset password background"
          src="/loginimg@2x.png"
        />
      </div>

      {/* Content Container - Responsive */}
      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left side - Image space */}
        <div className="hidden lg:block lg:w-1/2 2xl:w-[45%]" />

        {/* Right side - Reset Password Form */}
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
              {/* Back Button */}
              <Link
                className="font-sans cursor-pointer [text-decoration:none] flex flex-row items-center justify-start gap-[5px] text-left text-[14px] text-[#201a18]"
                to="/enter-otp"
              >
                <img
                  className="w-[20px] h-[20px]"
                  alt=""
                  src="/vuesaxlineararrowleft.svg"
                />
                <div className="relative font-sans">Back</div>
              </Link>

              {/* Header */}
              <div className="text-left mb-4">
                <div className="font-sans font-semibold text-[24px] text-[#201a18] mb-1">
                  New Password
                </div>
                <div className="font-sans text-[14px] text-[#a7a19e]">
                  Create a new password that is safe and easy to remember
                </div>
              </div>

              {/* New Password Input */}
              <div className="w-[290px] border-[#dee1e6] border-[1px] border-solid rounded-[35px] h-[38px] 
                            flex items-center px-[12px] text-left">
                <input
                  className="font-sans flex-1 [border:none] [outline:none] text-[14px] 
                            bg-transparent text-[#939090]"
                  placeholder="New Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                />
                {showPassword ? (
                  <FaEyeSlash
                    className="w-4 h-4 cursor-pointer text-black"
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <FaEye
                    className="w-4 h-4 cursor-pointer text-black"
                    onClick={() => setShowPassword(true)}
                  />
                )}
              </div>

              {/* Password Strength Indicator */}
              <div className="flex items-center justify-between px-1">
                <div className="flex gap-1 flex-1 max-w-[75%]">
                  <div className={`h-1 flex-1 rounded transition-colors duration-300 ${
                    passwordStrength === "weak" ? "bg-red-500" :
                    passwordStrength === "medium" ? "bg-yellow-500" :
                    passwordStrength === "strong" ? "bg-[#50cd89]" :
                    "bg-gray-200"
                  }`} />
                  <div className={`h-1 flex-1 rounded transition-colors duration-300 ${
                    ["medium", "strong"].includes(passwordStrength) ? 
                    (passwordStrength === "medium" ? "bg-yellow-500" : "bg-[#50cd89]") :
                    "bg-gray-200"
                  }`} />
                  <div className={`h-1 flex-1 rounded transition-colors duration-300 ${
                    passwordStrength === "strong" ? "bg-[#50cd89]" : "bg-gray-200"
                  }`} />
                </div>
                <span className="text-[14px] text-[#94a3b8] ml-2 capitalize">
                  {passwordStrength}
                </span>
              </div>

              {/* Confirm Password Input */}
              <div className="w-[290px] border-[#dee1e6] border-[1px] border-solid rounded-[35px] h-[38px] 
                            flex items-center px-[12px] text-left">
                <input
                  className="font-sans flex-1 [border:none] [outline:none] text-[14px] 
                            bg-transparent text-[#939090]"
                  placeholder="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {showConfirmPassword ? (
                  <FaEyeSlash
                    className="w-4 h-4 cursor-pointer text-black"
                    onClick={() => setShowConfirmPassword(false)}
                  />
                ) : (
                  <FaEye
                    className="w-4 h-4 cursor-pointer text-black"
                    onClick={() => setShowConfirmPassword(true)}
                  />
                )}
              </div>

              {/* Error Message */}
              {validationError && (
                <div className="font-sans text-[#fe5b18] text-xs text-left">
                  {validationError}
                </div>
              )}

              {/* Reset Password Button */}
              <button
                className="font-sans w-full h-[38px] bg-[#fe5b18] text-white rounded-[28px] 
                          text-[14px] hover:bg-[#e54d0e] 
                          transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="font-sans flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Resetting...
                  </div>
                ) : (
                  'Reset Password'
                )}
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
};

export default ResetPasswordDetails;
