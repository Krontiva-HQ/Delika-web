import { FunctionComponent, useState, ChangeEvent, useEffect, useRef } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useAuth } from '../hooks/useAuth';
import { useEmail } from '../context/EmailContext';
import { useTwoFAEmail } from '../hooks/useTwoFAEmail';
import { RateLimiter } from '../utils/rateLimiter';

interface LoginDetailsProps {
  onSubmit?: (data: { email: string; password: string }) => void;
}

const LoginDetails: FunctionComponent<LoginDetailsProps> = ({ onSubmit }) => {
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    phoneNumber: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const navigate = useNavigate();
  const { login, loginWithPhoneNumber, isLoading, error } = useAuth();
  const { setEmail } = useEmail();
  const { sendTwoFAEmail } = useTwoFAEmail();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (loginMethod === 'email') {
      if (!formData.email || !formData.password) {
        setValidationError('Invalid Email Address or Password');
        return false;
      }
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        setValidationError('Please enter a valid email address');
        return false;
      }
    } else {
      if (!formData.phoneNumber) {
        setValidationError('Please enter a phone number');
        return false;
      }
      // Add phone number validation if needed
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (loginMethod === 'email') {
      // Check rate limit before attempting login
      const { limited, waitTime } = RateLimiter.isRateLimited(formData.email);
      if (limited) {
        setIsRateLimited(true);
        setWaitTime(waitTime);
        setValidationError(`Too many failed attempts. Try again in ${waitTime} minutes.`);
        return;
      }
    
      try {
        const response = await login(formData.email, formData.password);
    
        if (response.success && response.authToken) {
          RateLimiter.resetAttempts(formData.email);
          
          const twoFAResponse = await sendTwoFAEmail(formData.email);
          
          if (twoFAResponse) {
            setEmail(formData.email);
            onSubmit?.(formData);
            navigate('/2fa-login');
          } else {
            setValidationError('Failed to send 2FA email. Please try again.');
          }
        } else {
          const attempts = RateLimiter.recordFailedAttempt(formData.email);
          const remainingAttempts = 5 - attempts;
          
          if (remainingAttempts > 0) {
            setValidationError(`Invalid credentials.`);
          } else {
            const { waitTime } = RateLimiter.isRateLimited(formData.email);
            setIsRateLimited(true);
            setWaitTime(waitTime);
            setValidationError(`Too many failed attempts. Try again in ${waitTime} minutes.`);
          }
        }
      } catch (err: any) {
        RateLimiter.recordFailedAttempt(formData.email);
        setValidationError('Incorrect email or password');
      }
    } else {
      // Phone number login
      try {
        const response = await loginWithPhoneNumber(formData.phoneNumber);
        if (!response.success) {
          setValidationError(response.error || 'Login failed');
        } else {
          // Store phone number for verification
          localStorage.setItem('loginPhoneNumber', formData.phoneNumber);
          // Navigate to 2FA page
          navigate('/2fa-login');
        }
      } catch (err: any) {
        if (err.status === 500 || err.message === 'Invalid phone number. Please try again.') {
          setValidationError('Invalid phone number. Please try again.');
        } else {
          setValidationError(err.message || 'Login failed');
        }
      }
    }
  };

  // Check rate limit on mount and when email changes
  useEffect(() => {
    if (loginMethod === 'email' && formData.email) {
      const { limited, waitTime } = RateLimiter.isRateLimited(formData.email);
      setIsRateLimited(limited);
      setWaitTime(waitTime);
      if (limited) {
        setValidationError(`Too many failed attempts. Try again in ${waitTime} minutes.`);
      }
    }
    // Cleanup any previous interval
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.email, loginMethod]);

  // Live countdown for lockout
  useEffect(() => {
    if (isRateLimited && formData.email) {
      intervalRef.current = setInterval(() => {
        const { limited, waitTime } = RateLimiter.isRateLimited(formData.email);
        setIsRateLimited(limited);
        setWaitTime(waitTime);
        if (limited) {
          setValidationError(`Too many failed attempts. Try again in ${waitTime} minutes.`);
        } else {
          setValidationError(null);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }, 60000); // update every minute
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [isRateLimited, formData.email]);

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

            {/* Login Method Toggle */}
            <div className="flex rounded-[35px] bg-gray-100 mb-4">
              <button
                className={`flex-1 py-2 px-4 rounded-[35px] text-sm font-medium transition-colors duration-200 
                  ${loginMethod === 'email' ? 'bg-[#fe5b18] text-white' : 'text-gray-600'}`}
                onClick={() => setLoginMethod('email')}
              >
                Email
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-[35px] text-sm font-medium transition-colors duration-200 
                  ${loginMethod === 'phone' ? 'bg-[#fe5b18] text-white' : 'text-gray-600'}`}
                onClick={() => setLoginMethod('phone')}
              >
                Phone
              </button>
            </div>

            {/* Form Section */}
            <div className="space-y-3">
              {loginMethod === 'email' ? (
                <>
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

                  {/* Forgot Password Link */}
                  <div className="w-full text-right">
                    <button 
                      onClick={() => navigate('/forgot-password')}
                      className="font-sans text-[12px] text-[#fe5b18] hover:text-[#e54d0e] 
                              transition-colors duration-200 bg-transparent shadow-none"
                    >
                      Forgot Password?
                    </button>
                  </div>
                </>
              ) : (
                /* Phone Number Input */
                <input
                  className="w-[290px] border-[#dee1e6] border-[1px] border-solid rounded-[35px] h-[38px] 
                            flex items-center px-[12px] text-left"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="Phone Number"
                  type="tel"
                  name="phoneNumber"
                />
              )}

              {/* Error Message */}
              {validationError && (
                <div className="w-full text-center">
                  <span className="font-sans text-[#fe5b18] text-xs">
                    {validationError}
                  </span>
                </div>
              )}

              {/* Login/Send OTP Button */}
              <button
                className="font-sans w-full h-[38px] bg-[#fe5b18] text-white rounded-[28px] 
                          text-[14px] hover:bg-[#e54d0e] 
                          transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={isLoading || isRateLimited}
              >
                {isLoading ? (
                  <div className="font-sans flex items-center justify-center gap-2">
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    {loginMethod === 'email' ? 'Logging in...' : 'Sending OTP...'}
                  </div>
                ) : isRateLimited ? (
                  `Try again in ${waitTime} minutes`
                ) : (
                  loginMethod === 'email' ? 'Login' : 'Send OTP'
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