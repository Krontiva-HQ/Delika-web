import { FunctionComponent, useState, ChangeEvent } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import { useEmail } from '../context/EmailContext';
import { useTwoFAEmail } from '../hooks/useTwoFAEmail';

interface LoginDetailsProps {
  onSubmit?: (data: { email: string; password: string }) => void;
}

const LoginDetails: FunctionComponent<LoginDetailsProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();
  const { setEmail } = useEmail();
  const { sendTwoFAEmail } = useTwoFAEmail();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setValidationError('Invalid Email Address or Password');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
  
    try {
      const response = await login(formData.email, formData.password);
  
      if (response.success && response.authToken) {
        const twoFAResponse = await sendTwoFAEmail(formData.email);
        
        if (twoFAResponse.success) {
          setEmail(formData.email);
          onSubmit?.(formData);
          navigate('/2fa-login');
        } else {
          setValidationError('Failed to send 2FA email. Please try again.');
        }
      } else {
        setValidationError('Invalid Credentials');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setValidationError('Incorrect email or password');
    }
  };
  

  const handleForgotPasswordClick = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="font-sans min-h-screen w-full relative bg-white overflow-hidden text-right text-[12px] text-[#fe5b18]">
      {/* Background Image - Hidden on mobile and tablet */}
      <div className="hidden lg:block absolute inset-0 lg:w-1/2 2xl:w-[45%]">
        <img
          className="h-screen w-full object-cover object-center"
          alt="Login background"
          src="/loginimg@2x.png"
        />
      </div>

      {/* Content Container - Responsive */}
      <div className="relative min-h-screen flex flex-col lg:flex-row">
        {/* Left side - Image space */}
        <div className="hidden lg:block lg:w-1/2 2xl:w-[45%]" />

        {/* Right side - Login Form */}
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
              {/* Email Input */}
              <input
                className="w-[290px] border-[#dee1e6] border-[1px] border-solid rounded-[35px] h-[38px] 
                            flex items-center px-[12px] text-left"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email Address"
                type="email"
                name="email"
              />

              {/* Password Input */}
              <div className="w-[290px] border-[#dee1e6] border-[1px] border-solid rounded-[35px] h-[38px] 
                            flex items-center px-[12px] text-left">
                <input
                  className="font-sans flex-1 [border:none] [outline:none] text-[14px] 
                            bg-transparent text-[#939090]"
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
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

              {/* Error Message and Forgot Password on same line */}
              <div className="flex justify-end items-center">
                {validationError && (
                  <div className="font-sans text-[#fe5b18] text-xs mr-auto">
                    {validationError}
                  </div>
                )}
                <button 
                  onClick={handleForgotPasswordClick}
                  className="font-sans text-[12px] text-[#fe5b18] hover:text-[#e54d0e] 
                            transition-colors duration-200 bg-transparent shadow-none"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Login Button */}
              <button
                className="font-sans w-full h-[38px] bg-[#fe5b18] text-white rounded-[28px] 
                          text-[14px] hover:bg-[#e54d0e] 
                          transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="font-sans flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Logging in...
                  </div>
                ) : (
                  'Login'
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

export default LoginDetails;