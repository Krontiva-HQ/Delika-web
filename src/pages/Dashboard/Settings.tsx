/// <reference types="vite/client" />                   

import { FunctionComponent, useState, useMemo, useEffect, useRef } from "react";
import { Button, Menu } from "@mui/material";
import Select from 'react-select';
import countryList from 'react-select-country-list';
import { IoMdAdd } from "react-icons/io";
import { SlOptionsVertical } from "react-icons/sl";
import { FaCamera } from "react-icons/fa";
import AddTeamMember from './AddTeamMembers';
import { getAuthenticatedUser, UserResponse, deleteUser, verifyOTP, updateRestaurantPreferences, deleteRider } from "../../services/api";
import { useUpdateUser } from '../../hooks/useUpdateUser';
import { useTeamMembers, TeamMember } from '../../hooks/useTeamMembers';
import useChangePassword from '../../hooks/useChangePassword';
import useResetPassword from '../../hooks/useResetPassword';
import { useDeleteUser } from '../../hooks/useDeleteUser';
import axios from 'axios';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useUserProfile } from '../../hooks/useUserProfile';
import { CiEdit } from "react-icons/ci";
import EditTeamMemberModal from '../../components/EditTeamMemberModal';
import { useNotifications } from '../../context/NotificationContext';
import { RiDeleteBin5Line } from "react-icons/ri";
import RidersTable from '../../components/RidersTable';
import { Rider } from '../../components/RidersTable';



interface LocalUserResponse {
  id: string;
  email: string;
  // ...
}

const Settings: FunctionComponent = () => {
  const [textfield4AnchorEl, setTextfield4AnchorEl] = useState<null | HTMLElement>(null);
  const [textfield9AnchorEl, setTextfield9AnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [country, setCountry] = useState<{ value: string; label: string } | null>(null);
  const [activeTab, setActiveTab] = useState('edit');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [language, setLanguage] = useState('en');
  const [riderAssignment, setRiderAssignment] = useState<'auto' | 'manual'>('auto');
  const [priceCalculation, setPriceCalculation] = useState<'auto' | 'manual'>('auto');
  const options = useMemo(() => countryList().getData(), []);
  const [userData, setUserData] = useState<UserResponse | null>(null);
  const { updateUser, isLoading, error } = useUpdateUser();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { changePassword, isLoading: isChangingPassword, error: passwordError } = useChangePassword();
  const [validationError, setValidationError] = useState<string | null>(null);
  const [passwordChangeStep, setPasswordChangeStep] = useState<'email' | 'otp' | 'newPassword'>('email');
  const [otp, setOtp] = useState(['', '', '', '']);
  const { resetPassword, loading: resetLoading, error: resetError } = useResetPassword();
  const { userProfile } = useUserProfile();
  const otpRefs = Array(4).fill(0).map(() => useRef<HTMLInputElement>(null));
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const { teamMembers, refetch: fetchTeamMembers } = useTeamMembers({
    restaurantId: userData?.restaurantId || '',
    branchId: userData?.branchId || ''
  });
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');
  const { restaurantData: initialRestaurantData } = useUserProfile();
  const [restaurantFormData, setRestaurantFormData] = useState({
    restaurantName: initialRestaurantData?.restaurantName || '',
    restaurantEmail: initialRestaurantData?.restaurantEmail || '',
    restaurantPhoneNumber: initialRestaurantData?.restaurantPhoneNumber || '',
    restaurantAddress: initialRestaurantData?.restaurantAddress || '',
    restaurantLogo: null as File | null
  });
  const [restaurantLogoUrl, setRestaurantLogoUrl] = useState<string | null>(
    initialRestaurantData?.restaurantLogo?.url || null
  );
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);
  const [memberToEdit, setMemberToEdit] = useState<TeamMember | null>(null);
  const { addNotification } = useNotifications();
  const isStoreClerk = userProfile.role === 'Store Clerk';
 
  const textfield4Open = Boolean(textfield4AnchorEl);
  const textfield9Open = Boolean(textfield9AnchorEl);

  const handleTextfield4Click = (event: React.MouseEvent<HTMLElement>) => {
    setTextfield4AnchorEl(event.currentTarget);
  };

  const handleTextfield4Close = () => {
    setTextfield4AnchorEl(null);
  };

  const handleTextfield9Click = (event: React.MouseEvent<HTMLElement>) => {
    setTextfield9AnchorEl(event.currentTarget);
  };

  const handleTextfield9Close = () => {
    setTextfield9AnchorEl(null);
  };

  const handleAddMember = (newMember: Omit<TeamMember, 'id'>) => {
    const member: TeamMember = {
      ...newMember,
      id: `TM${String(teamMembers.length + 1).padStart(3, '0')}`,
      Status: true,
      created_at: Date.now()
    };
    setIsAddMemberOpen(false);
    fetchTeamMembers();
    
    addNotification({
      type: 'employee_update',
      message: `New team member **${newMember.fullName}** has been added`
    });
  };

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      height: '50px',
      backgroundColor: 'var(--bg-color, white)',
      borderColor: 'var(--border-color, #edf0f2)',
      borderRadius: '8px',
      boxShadow: 'none',
      '&:hover': {
        borderColor: 'var(--border-hover-color, #d1d5db)'
      }
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: 'var(--text-color, black)',
      fontFamily: 'inherit',
      fontSize: '14px'
    }),
    input: (provided: any) => ({
      ...provided,
      color: 'var(--text-color, black)',
      fontFamily: 'inherit',
      fontSize: '14px'
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: 'var(--bg-color, white)',
      border: '1px solid var(--border-color, #edf0f2)'
    }),
    option: (provided: any, state: { isSelected: any; }) => ({
      ...provided,
      backgroundColor: state.isSelected ? 'var(--selected-bg, #f3f4f6)' : 'var(--bg-color, white)',
      color: 'var(--text-color, black)',
      '&:hover': {
        backgroundColor: 'var(--hover-bg, #f9fafb)'
      },
      fontFamily: 'inherit',
      fontSize: '14px'
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: 'var(--placeholder-color, #6b7280)',
      fontFamily: 'inherit',
      fontSize: '14px'
    })
  };

  const changeHandler = (selectedOption: { value: string; label: string } | null) => {
    setCountry(selectedOption);
  };

  const handleInputChange = (field: keyof UserResponse, value: string) => {
    if (userData) {
      setUserData({ ...userData, [field]: value });
    }
  };

  // Add useEffect to fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getAuthenticatedUser();
        const userData = response.data;

        // Convert dateOfBirth to a Date object if it's a number
        if (typeof userData.dateOfBirth === 'number') {
          userData.dateOfBirth = new Date(userData.dateOfBirth) as any;
        }

        setUserData(userData);
      } catch (error) {
      }
    };

    fetchUserData();
  }, []);

  // Add this useEffect to set initial country when userData loads
  useEffect(() => {
    if (userData?.country) {
      const countryOption = options.find(option => option.value === userData.country);
      if (countryOption) {
        setCountry(countryOption);
      }
    }
  }, [userData, options]);

  // Redirect Store Clerks if they try to access team members tab
  useEffect(() => {
    if (isStoreClerk && activeTab === 'team') {
      setActiveTab('edit');
    }
  }, [isStoreClerk, activeTab]);

  // Add useEffect to initialize settings from userData
  useEffect(() => {
    if (userData?._restaurantTable && userData._restaurantTable.length > 0) {
      const restaurantSettings = userData._restaurantTable[0];
      
      // Set language
      if (restaurantSettings.language) {
        setLanguage(restaurantSettings.language);
      }

      // Set rider assignment based on AutoAssign
      setRiderAssignment(restaurantSettings.AutoAssign ? 'auto' : 'manual');

      // Set price calculation based on AutoCalculatePrice
      setPriceCalculation(restaurantSettings.AutoCalculatePrice ? 'auto' : 'manual');
    }
  }, [userData]);

  // Update the renderTeamMembersTable function
  const renderTeamMembersTable = () => (
    <>
      <div className="w-full md:w-[95%] mx-auto overflow-x-auto">
        <div className="min-w-[800px] border-[1px] border-solid border-gray-200 dark:border-[rgba(167,161,158,0.1)] rounded-lg bg-white dark:bg-black">
          {/* Table Header */}
          <div className="flex justify-between items-center p-3 bg-white dark:bg-black text-black dark:text-white">
            <h3 className="text-[12px] sm:text-[14px] font-semibold font-sans">Team Members</h3>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsAddMemberOpen(true);
              }}
              className="flex items-center gap-1 px-2 sm:px-3 py-1 sm:py-1.5 bg-[#fe5b18] text-white rounded-md font-sans text-[11px] sm:text-[12px]"
            >
              <IoMdAdd className="w-3 h-3 sm:w-4 sm:h-4" />
              Add Member
            </button>
          </div>

          {/* Table Headers */}
          <div className="grid grid-cols-[150px_1fr_1fr_1fr_80px] sm:grid-cols-[200px_1fr_1fr_1fr_100px] items-center p-2 sm:p-3 bg-white dark:bg-black text-black dark:text-white font-sans">
            <div className="text-[11px] sm:text-[12px] flex items-center">Name</div>
            <div className="text-[11px] sm:text-[12px]">Email</div>
            <div className="text-[11px] sm:text-[12px]">Branch Name</div>
            <div className="text-[11px] sm:text-[12px]">Role</div>
            <div className="text-[11px] sm:text-[12px]">Action</div>
          </div>

          {/* Table Body */}
          {teamMembers.map((member) => (
            <div key={member.id} className="grid grid-cols-[150px_1fr_1fr_1fr_80px] sm:grid-cols-[200px_1fr_1fr_1fr_100px] items-center gap-2 p-3 border-t border-gray-200 dark:border-[#333] font-sans bg-white dark:bg-black text-black dark:text-white">
              <div className="text-[11px] sm:text-[12px] flex items-center gap-1 min-h-[24px]">
                <img 
                  src={member.image?.url || '/default-profile.jpg'} 
                  alt={member.fullName}
                  className="w-6 h-6 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-profile.jpg';
                  }}
                />z
                <span className="truncate">{member.fullName}</span>
              </div>
              <div className="text-[11px] sm:text-[12px] truncate">{member.email}</div>
              <div className="text-[11px] sm:text-[12px] truncate">{member.branchesTable?.branchName || 'N/A'}</div>
              <div className="text-[11px] sm:text-[12px] truncate">{member.role}</div>
              <div className="flex items-center gap-1">
                <button 
                  className="p-1.5 border-[1px] border-solid border-red-600 text-orange-600 rounded-[4px] hover:bg-red-50 dark:hover:bg-red-900/20 text-[11px] font-sans"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteMember(member.id);
                  }}
                >
                  <RiDeleteBin5Line className="w-4 h-4" />
                </button>
                <button 
                  className="p-1.5 border-[1px] border-solid border-blue-600 text-blue-600 rounded-[4px] hover:bg-blue-50 dark:hover:bg-blue-900/20 text-[11px] font-sans"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMemberToEdit({
                      ...member,
                      address: member.address || 'N/A',
                      city: member.city || 'N/A',
                      postalCode: member.postalCode || 'N/A',
                      country: member.country || 'N/A'
                    });
                    setIsEditMemberOpen(true);
                  }}
                >
                  <CiEdit className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Riders Section */}
      <div className="w-full md:w-[95%] mx-auto mt-8 overflow-x-auto">
        <div className="min-w-[800px] border-[1px] border-solid border-gray-200 dark:border-[rgba(167,161,158,0.1)] rounded-lg bg-white dark:bg-black">
          <div className="flex justify-between items-center p-3 bg-white dark:bg-black text-black dark:text-white">
            <h3 className="text-[12px] sm:text-[14px] font-semibold font-sans">Riders</h3>
          </div>
          <RidersTable 
            branchName={userData?.branchId || ''} 
            onDeleteRider={handleDeleteRider}
            onEditRider={handleEditRider}
            key={refreshRiders ? 'refresh' : 'initial'}
          />
        </div>
      </div>
    </>
  );

  // Update the handleSave function to preserve existing image if no new one is uploaded
  const handleSave = async () => {
    if (!userData) return;

    // Create FormData to handle file upload
    const formData = new FormData();
    formData.append('userId', userData.id);
    formData.append('email', userData.email);
    formData.append('userName', userData.userName);
    formData.append('fullName', userData.fullName);
    formData.append('phoneNumber', userData.phoneNumber);
    formData.append('country', country?.value || '');
    formData.append('address', userData.address);
    formData.append('city', userData.city);
    formData.append('postalCode', userData.postalCode);
    if (userData.dateOfBirth) {
      formData.append('dateOfBirth', userData.dateOfBirth.toString());
    }
    
    // Only append photo if a new one was selected, otherwise keep existing image
    if (photoFile) {
      formData.append('photo', photoFile);
    } else if (userData.image?.url) {
      formData.append('photo', userData.image.url);
    }

    formData.append('role', userData.role);
    formData.append('restaurantId', userData.restaurantId || '');
    formData.append('branchId', userData.branchId || '');

    try {
      const result = await updateUser(formData);
      if (result) {
        addNotification({
          type: 'profile_update',
          message: `Profile updated for user **${userData.fullName}**`
        });
      }
    } catch (error) {
      // Handle error
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoFile(file); // Store the file
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
  };

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword) {
      setValidationError('Please fill in all password fields');
      return;
    }

    const response = await changePassword(oldPassword, newPassword);
    
    if (response.success) {
      addNotification({
        type: 'password_change',
        message: `Password has been successfully changed for **${userData?.fullName}**`
      });
      
      setOldPassword('');
      setNewPassword('');
    }
  };

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Move to next input if value is entered
      if (value !== '' && index < 3) {
        otpRefs[index + 1]?.current?.focus();
      }
    }
  };

  // Handle sending OTP
  const handleSendOTP = async () => {
    if (userProfile.email) {
      await resetPassword(userProfile.email);
      setPasswordChangeStep('otp');
    }
  };

  // Handle OTP verification with proper error handling
  const handleVerifyOTP = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      const otpString = otp.join('');
      
      if (otpString.length !== 4) {
        alert('Please enter all 4 digits of the OTP');
        return;
      }

      const response = await verifyOTP({
        OTP: parseInt(otpString),
        type: true,
        contact: userProfile.email
      });

      if (response.data.otpValidate === 'otpFound') {
        setPasswordChangeStep('newPassword');
        setOtp(['', '', '', '']);
      } else {
        alert('Invalid OTP. Please try again.');
      }
    } catch (error) {
      alert('An error occurred. Please try again.');
    }
  };

  // Render password change section based on current step
  const renderPasswordChangeSection = () => {
    switch (passwordChangeStep) {
      case 'email':
        return (
          <div className="flex flex-col gap-4">
            <div className="w-[392px] bg-[rgba(0,0,0,0)] flex flex-col items-start justify-start gap-[1px]">
              <b className="self-stretch relative text-[14px] leading-[22px] font-sans text-black dark:text-white">
                Confirm Your Email
              </b>
              <input
                className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[8px] box-border h-[50px] pt-[17.5px] px-[20px] pb-[16.5px] font-sans text-[14px] placeholder-gray-500"
                type="email"
                value={userProfile.email || ''}
                disabled
              />
            </div>
            <button
              onClick={handleSendOTP}
              disabled={resetLoading}
              className="cursor-pointer border-gray-200 dark:border-[#333] border-[1px] border-solid py-[13px] px-[20px] bg-black dark:bg-[#fe5b18] text-black dark:text-white rounded-[8px] box-border overflow-hidden flex flex-row items-center justify-center hover:bg-orange-500 dark:hover:bg-[#e54d0e]"
            >
              <div className="flex-1 relative text-[14px] leading-[22px] font-sans text-white dark:text-white text-left">
                {resetLoading ? 'Sending OTP...' : 'Send OTP'}
              </div>
            </button>
          </div>
        );

      case 'otp':
        return (
          <div className="flex flex-col gap-4">
            <div className="w-[392px] bg-[rgba(0,0,0,0)] flex flex-col items-start justify-start gap-[1px]">
              <b className="self-stretch relative text-[14px] leading-[22px] font-sans text-white">
                Enter 4-digit OTP
              </b>
              <div className="flex gap-4 mt-2 justify-center">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={otpRefs[index]}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    className="w-14 h-14 text-center border-[#333] border-[1px] border-solid rounded-md text-xl font-sans focus:border-[#fe5b18] focus:outline-none"
                    inputMode="numeric"
                    pattern="\d*"
                  />
                ))}
              </div>
              <div className="flex flex-col items-center gap-2 mt-4">
                <p className="text-sm text-gray-500 text-center font-sans">
                  Enter the 4-digit code sent to your email
                </p>
              </div>
            </div>
            <button
              onClick={handleVerifyOTP}
              className="cursor-pointer border-[#333] border-[1px] border-solid py-[13px] px-[20px] bg-black dark:bg-[#fe5b18] text-white rounded-[8px] box-border overflow-hidden flex flex-row items-center justify-center hover:bg-[#1a1a1a] dark:hover:bg-[#e54d0e]"
            >
              <div className="flex-1 relative text-[14px] leading-[22px] font-sans text-white text-left">
                Verify OTP
              </div>
            </button>
          </div>
        );

      case 'newPassword':
        return (
          <div className="flex flex-col gap-4">
            <div className="w-[392px] bg-[rgba(0,0,0,0)] flex flex-col items-start justify-start gap-[1px]">
              <b className="self-stretch relative text-[14px] leading-[22px] font-sans text-white">
                Enter New Password
              </b>
              <input
                className="border-[#333] border-[1px] border-solid [outline:none] bg-white text-black self-stretch relative rounded-[8px] box-border h-[50px] pt-[17.5px] px-[20px] pb-[16.5px] font-sans text-[14px] placeholder-gray-500"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
              />
            </div>
            <button
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                if (!newPassword) {
                  alert('Please enter a new password');
                  return;
                }

                const response = await changePassword(userProfile.email, newPassword);
                
                if (response.success) {
                  alert('Password changed successfully');
                  setNewPassword('');
                  setPasswordChangeStep('email');
                } else {
                  alert(response.error || 'Failed to change password');
                }
              }}
              disabled={isChangingPassword}
              className="cursor-pointer border-[#333] border-[1px] border-solid py-[13px] px-[20px] bg-black dark:bg-[#fe5b18] text-white rounded-[8px] box-border overflow-hidden flex flex-row items-center justify-center hover:bg-[#1a1a1a] dark:hover:bg-[#e54d0e]"
            >
              <div className="flex-1 relative text-[14px] leading-[22px] font-sans text-white text-left">
                {isChangingPassword ? 'Changing...' : 'Save New Password'}
              </div>
            </button>
            {passwordError && (
              <div className="text-red-500 text-sm font-sans">{passwordError}</div>
            )}
          </div>
        );
    }
  };

  const handleDeleteMember = async (userId: string) => {
    setUserToDelete(userId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await deleteUser(userToDelete);
      await fetchTeamMembers();
      
      // Find the user's name from teamMembers
      const deletedMember = teamMembers.find(member => member.id === userToDelete);
      
      addNotification({
        type: 'user_deleted',
        message: `Team member **${deletedMember?.fullName || 'Unknown'}** has been removed`
      });
      
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
    }
  };

  const handleRestaurantLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setRestaurantFormData(prev => ({ ...prev, restaurantLogo: file }));
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleRestaurantInputChange = (field: string, value: string) => {
    setRestaurantFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveRestaurant = async () => {
    if (!userData?.restaurantId) return;

    const formData = new FormData();
    formData.append('restaurantId', userData.restaurantId);
    formData.append('restaurantName', restaurantFormData.restaurantName);
    formData.append('restaurantEmail', restaurantFormData.restaurantEmail);
    formData.append('restaurantPhoneNumber', restaurantFormData.restaurantPhoneNumber);
    formData.append('restaurantAddress', restaurantFormData.restaurantAddress);
    
    if (restaurantFormData.restaurantLogo) {
      formData.append('restaurantLogo', restaurantFormData.restaurantLogo);
    }

    try {
      // Add your API call here to update restaurant data
      // await updateRestaurant(formData);
    } catch (error) {
    }
  };

  const handleEditMember = async (formData: FormData) => {
    try {
      await updateUser(formData);
      await fetchTeamMembers();
      
      addNotification({
        type: 'employee_update',
        message: `Team member **${memberToEdit?.fullName}** details have been updated`
      });
      
      setIsEditMemberOpen(false);
      setMemberToEdit(null);
    } catch (error) {
    }
  };

  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Add this function to handle saving restaurant settings
  const handleSaveRestaurantSettings = async () => {
    if (!userData?.restaurantId) {
      setSaveError('Restaurant ID not found');
      return;
    }

    setIsSettingsSaving(true);
    setSaveError(null);
    setIsSaved(false);

    try {
      const preferences = {
        restaurantId: userData.restaurantId,
        AutoAssign: riderAssignment === 'auto',
        AutoCalculatePrice: priceCalculation === 'auto',
        language: language
      };

      await updateRestaurantPreferences(preferences);

      setIsSaved(true);
      addNotification({
        type: 'profile_update',
        message: `Restaurant settings updated: Language: ${language}, ${riderAssignment === 'auto' ? 'Auto' : 'Manual'} rider assignment, ${priceCalculation === 'auto' ? 'Auto' : 'Manual'} price calculation`
      });

      // Reset saved state after 2 seconds
      setTimeout(() => {
        setIsSaved(false);
      }, 2000);
    } catch (error: any) {
      setSaveError(
        error.response?.data?.message || 
        error.message || 
        'Failed to update restaurant settings'
      );
    } finally {
      setIsSettingsSaving(false);
    }
  };

  // Add state for rider deletion
  const [riderToDelete, setRiderToDelete] = useState<string | null>(null);
  const [deleteRiderModalOpen, setDeleteRiderModalOpen] = useState(false);

  // Update the handleDeleteRider function
  const handleDeleteRider = async (riderId: string) => {
    setRiderToDelete(riderId);
    setDeleteRiderModalOpen(true);
  };

  // Update the handleConfirmRiderDelete function
  const handleConfirmRiderDelete = async () => {
    if (!riderToDelete || !userData?.branchId) return;

    try {
      await deleteRider({
        delikaquickshipper_user_table_id: riderToDelete,
        branchName: userData.branchId
      });

      addNotification({
        type: 'user_deleted',
        message: 'Rider has been removed'
      });

      setRefreshRiders(prev => !prev);
    } catch (error) {
      addNotification({
        type: 'user_deleted',
        message: 'Failed to remove rider'
      });
    } finally {
      setDeleteRiderModalOpen(false);
      setRiderToDelete(null);
    }
  };

  const handleEditRider = (rider: Rider) => {
    // Add your edit rider logic here
  };

  // Add state for refreshing riders
  const [refreshRiders, setRefreshRiders] = useState(false);

  return (
    <div className="h-full w-full bg-white dark:bg-black m-0 p-0 font-sans">
      <div className="p-3 ml-4 mr-4">
        <b className="block text-[18px] mb-4 font-sans text-black dark:text-white">
          Settings
        </b>
        <section className="mb-[10px] mt-[20px] max-w-[calc(100%-px)] overflow-hidden">
          <form className="self-stretch rounded-[4px] bg-white dark:bg-black border-gray-200 dark:border-[#333] border-[1px] border-solid flex flex-col items-start justify-start py-[10px] px-[10px] gap-[20px]">
            {/* Tab Navigation */}
            <section className="self-stretch flex flex-col items-start justify-start p-[8px] border-b border-gray-200 dark:border-[#333] overflow-x-auto">
              <div className="self-stretch flex flex-row items-center justify-start gap-[20px] md:gap-[40px] min-w-max">
                <div className={`relative text-[11px] sm:text-[12px] leading-[20px] font-sans cursor-pointer ${
                  activeTab === 'edit' ? 'text-[#fe5b18] font-bold dark:text-[#fe5b18]' : 'text-black dark:text-white'
                }`}
                onClick={() => setActiveTab('edit')}
                >
                  Edit Profile
                </div>
                {!isStoreClerk && (
                  <div className={`relative text-[11px] sm:text-[12px] leading-[20px] font-sans cursor-pointer ${
                    activeTab === 'team' ? 'text-[#fe5b18] font-bold dark:text-[#fe5b18]' : 'text-black dark:text-white'
                  }`}
                  onClick={() => setActiveTab('team')}
                  >
                    Team Members
                  </div>
                )}
                <div className={`relative text-[11px] sm:text-[12px] leading-[20px] font-sans cursor-pointer ${
                  activeTab === 'password' ? 'text-[#fe5b18] font-bold dark:text-[#fe5b18]' : 'text-black dark:text-white'
                }`}
                onClick={() => setActiveTab('password')}
                >
                  Change Password
                </div>
                <div className={`relative text-[11px] sm:text-[12px] leading-[20px] font-sans cursor-pointer ${
                  activeTab === 'restaurant' ? 'text-[#fe5b18] font-bold dark:text-[#fe5b18]' : 'text-black dark:text-white'
                }`}
                onClick={() => setActiveTab('restaurant')}
                >
                  About Restaurant
                </div>
                <div className={`relative text-[11px] sm:text-[12px] leading-[20px] font-sans cursor-pointer ${
                  activeTab === 'restaurant-settings' ? 'text-[#fe5b18] font-bold dark:text-[#fe5b18]' : 'text-black dark:text-white'
                }`}
                onClick={() => setActiveTab('restaurant-settings')}
                >
                  Restaurant Settings
                </div>
              </div>
            </section>

            {/* Content Area */}
            <div className="w-full px-2">
              {activeTab === 'edit' ? (
                <div className="self-stretch flex flex-row items-start justify-start gap-[30px]">
                  <div className="relative rounded-[30px] bg-[#ced0f8] overflow-hidden group cursor-pointer"
                       onClick={() => fileInputRef.current?.click()}>
                    {isUploading && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white text-sm">Uploading...</div>
                      </div>
                    )}
                    <img
                      className="w-[70px] h-[70px] object-cover"
                      alt={userData?.fullName || "Profile picture"}
                      src={previewImage || userData?.image?.url || "/default-profile.jpg"}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = "/default-profile.jpg";
                      }}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <FaCamera className="text-white text-2xl" />
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                  <div className="flex-1 flex flex-col items-start justify-start gap-[20px]">
                    <div className="self-stretch flex flex-row items-start justify-start flex-wrap content-start gap-x-[20px] gap-y-[20px]">
                      <div className="w-[350px] bg-transparent flex flex-col items-start justify-start gap-[1px]">
                        <b className="self-stretch relative text-[12px] leading-[20px] font-sans text-black dark:text-white">
                          Full Name
                        </b>
                        <input
                          className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[6px] box-border h-[40px] pt-[10px] px-[15px] pb-[10px] placeholder-gray-500"
                          placeholder="full name"
                          type="text"
                          value={userData?.fullName || ''}
                          onChange={(e) => handleInputChange('fullName', e.target.value)}
                        />
                      </div>
                      <div className="w-[350px] bg-transparent flex flex-col items-start justify-start gap-[1px]">
                        <b className="self-stretch relative text-[12px] leading-[20px] font-sans text-black dark:text-white">
                          User Name
                        </b>
                        <input
                          className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[6px] box-border h-[40px] pt-[10px] px-[15px] pb-[10px] placeholder-gray-500"
                          placeholder="user name"
                          type="text"
                          value={userData?.userName || ''}
                          onChange={(e) => handleInputChange('userName', e.target.value)}
                        />
                      </div>
                      <div className="w-[350px] bg-transparent flex flex-col items-start justify-start gap-[1px]">
                        <b className="self-stretch relative text-[12px] leading-[20px] font-sans text-black dark:text-white">
                          Email
                        </b>
                        <input
                          className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[6px] box-border h-[40px] pt-[10px] px-[15px] pb-[10px] placeholder-gray-500"
                          placeholder="email"
                          type="email"
                          value={userData?.email || ''}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          disabled
                        />
                      </div>
                      <div className="w-[350px] bg-transparent flex flex-col items-start justify-start gap-[1px]">
                        <b className="self-stretch relative text-[12px] leading-[20px] font-sans text-black dark:text-white">
                          Phone Number
                        </b>
                        <input
                          className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[6px] box-border h-[40px] pt-[10px] px-[15px] pb-[10px] placeholder-gray-500"
                          placeholder="phone number"
                          type="tel"
                          value={userData?.phoneNumber || ''}
                          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                        />
                      </div>
                      <div className="w-[350px] bg-transparent flex flex-col items-start justify-start gap-[1px]">
                        <b className="self-stretch relative text-[12px] leading-[20px] font-sans text-black dark:text-white">
                          Role
                        </b>
                        <input
                          className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[6px] box-border h-[40px] pt-[10px] px-[15px] pb-[10px] placeholder-gray-500"
                          placeholder="role"
                          type="text"
                          value={userData?.role || ''}
                          onChange={(e) => handleInputChange('role', e.target.value)}
                          disabled  // Making it read-only since role usually shouldn't be editable by the user
                        />
                      </div>
                      <div className="w-[350px] bg-transparent flex flex-col items-start justify-start gap-[1px]">
                        <b className="self-stretch relative text-[12px] leading-[20px] font-sans text-black dark:text-white">
                          Date of Birth
                        </b>
                        <input
                          type="date"
                          className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] 
                                    bg-white dark:bg-black self-stretch relative rounded-[6px] 
                                    h-[40px] px-[15px] font-sans text-[12px] text-black dark:text-white
                                    cursor-pointer appearance-none
                                    [&::-webkit-calendar-picker-indicator]:appearance-auto
                                    [&::-webkit-calendar-picker-indicator]:px-2
                                    [&::-webkit-calendar-picker-indicator]:py-2
                                    [&::-webkit-calendar-picker-indicator]:dark:invert
                                    [&::-webkit-calendar-picker-indicator]:dark:opacity-100
                                    [&::-webkit-calendar-picker-indicator]:dark:hover:opacity-80
                                    [&::-webkit-calendar-picker-indicator]:dark:filter-none"
                          placeholder="date of birth"
                          onChange={(e) => {
                            // Handle date change
                          }}
                          max={new Date().toISOString().split('T')[0]}
                          min="1900-01-01"
                        />
                      </div>
                      
                      <div className="w-[350px] bg-transparent flex flex-col items-start justify-start gap-[1px]">
                        <b className="self-stretch relative text-[12px] leading-[20px] font-sans text-black dark:text-white">
                          Permanent Address
                        </b>
                        <input
                          className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[6px] box-border h-[40px] pt-[10px] px-[15px] pb-[10px]"
                          type="text"
                          placeholder="permanent address"
                          value={userData?.address || ''}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                          disabled={!userData}
                        />
                      </div>
                      <div className="w-[350px] bg-transparent flex flex-col items-start justify-start gap-[1px]">
                        <b className="self-stretch relative text-[12px] leading-[20px] font-sans text-black dark:text-white">
                          City
                        </b>
                        <input
                          className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[6px] box-border h-[40px] pt-[10px] px-[15px] pb-[10px]"
                          type="text"
                          placeholder="city"
                          value={userData?.city || ''}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          disabled={!userData}
                        />
                      </div>
                      <div className="w-[350px] bg-transparent flex flex-col items-start justify-start gap-[1px]">
                        <b className="self-stretch relative text-[12px] leading-[20px] font-sans text-black dark:text-white">
                          Postal Code
                        </b>
                        <input
                          className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[6px] box-border h-[40px] pt-[10px] px-[15px] pb-[10px]"
                          type="text"
                          placeholder="postal code"
                          value={userData?.postalCode || ''}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                          disabled={!userData}
                        />
                      </div>
                      <div className="w-[350px] bg-transparent flex flex-col items-start justify-start gap-[0px]">
                        <b className="self-stretch relative text-[12px] leading-[20px] font-sans text-black dark:text-white">
                          Country
                        </b>
                        <Select
                          options={options}
                          value={country}
                          onChange={changeHandler}
                          className="self-stretch"
                          styles={customStyles}
                          placeholder="country"
                        />
                      </div>
                    </div>
                    <button
                      className="cursor-pointer border-[#333] border-[1px] border-solid py-[10px] px-[60px] bg-black dark:bg-[#fe5b18] text-white w-[150px] rounded-[6px] box-border overflow-hidden flex flex-row items-center justify-center hover:bg-[#1a1a1a] dark:hover:bg-[#e54d0e]"
                      onClick={handleSave}
                      disabled={isLoading}
                    >
                      <div className="flex-1 relative text-[12px] leading-[20px] font-sans text-white text-left">
                        {isLoading ? 'Saving...' : 'Save'}
                      </div>
                    </button>
                    {validationError && <div className="text-red-500 font-sans">{validationError}</div>}
                  </div>
                </div>
              ) : activeTab === 'team' ? (
                // Team members table
                renderTeamMembersTable()
              ) : activeTab === 'password' ? (
                <div className="self-stretch flex flex-col items-start justify-start gap-[10px]">
                  {renderPasswordChangeSection()}
                  {resetError && <div className="text-red-500 font-sans">{resetError}</div>}
                </div>
              ) : activeTab === 'restaurant' ? (
                <div className="self-stretch flex flex-col sm:flex-row items-start justify-start gap-[20px] sm:gap-[30px] p-4">
                  <div className="relative rounded-[8px] bg-gray-100 dark:bg-gray-800 overflow-hidden group cursor-pointer w-full sm:w-[200px] h-[200px]">
                    {restaurantLogoUrl || previewImage ? (
                      <img
                        className="w-full h-full object-cover"
                        alt="Restaurant Logo"
                        src={previewImage || restaurantLogoUrl || undefined}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-restaurant.png";
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-gray-400 dark:text-gray-500 flex flex-col items-center">
                          <FaCamera className="text-2xl sm:text-3xl mb-2" />
                          <span className="text-[11px] sm:text-sm">Upload Logo</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col items-start justify-start gap-[20px] sm:gap-[49px]">
                    <div className="self-stretch grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-x-[26px] sm:gap-y-[24px]">
                      <div className="w-full sm:w-[392px] bg-transparent flex flex-col items-start justify-start gap-[1px]">
                        <b className="self-stretch relative text-[12px] sm:text-[14px] leading-[22px] font-sans text-black dark:text-white">
                          Restaurant Name
                        </b>
                        <input
                          className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] sm:text-[14px] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[8px] box-border h-[40px] sm:h-[49px] pt-[13.5px] px-[20px] pb-[12.5px]"
                          type="text"
                          value={restaurantFormData.restaurantName}
                          readOnly
                        />
                      </div>

                      <div className="w-full sm:w-[392px] bg-transparent flex flex-col items-start justify-start gap-[1px]">
                        <b className="self-stretch relative text-[12px] sm:text-[14px] leading-[22px] font-sans text-black dark:text-white">
                          Restaurant Email
                        </b>
                        <input
                          className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] sm:text-[14px] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[8px] box-border h-[40px] sm:h-[49px] pt-[13.5px] px-[20px] pb-[12.5px]"
                          type="email"
                          value={restaurantFormData.restaurantEmail}
                          readOnly
                        />
                      </div>

                      <div className="w-full sm:w-[392px] bg-transparent flex flex-col items-start justify-start gap-[1px]">
                        <b className="self-stretch relative text-[12px] sm:text-[14px] leading-[22px] font-sans text-black dark:text-white">
                          Restaurant Phone Number
                        </b>
                        <input
                          className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] sm:text-[14px] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[8px] box-border h-[40px] sm:h-[49px] pt-[13.5px] px-[20px] pb-[12.5px]"
                          type="tel"
                          value={restaurantFormData.restaurantPhoneNumber}
                          readOnly
                        />
                      </div>

                      <div className="w-full sm:w-[392px] bg-transparent flex flex-col items-start justify-start gap-[1px]">
                        <b className="self-stretch relative text-[12px] sm:text-[14px] leading-[22px] font-sans text-black dark:text-white">
                          Restaurant Address
                        </b>
                        <input
                          className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] sm:text-[14px] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[8px] box-border h-[40px] sm:h-[49px] pt-[13.5px] px-[20px] pb-[12.5px]"
                          type="text"
                          value={restaurantFormData.restaurantAddress}
                          readOnly
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : activeTab === 'restaurant-settings' ? (
                <div className="self-stretch flex flex-col items-start justify-start gap-[20px] p-4 sm:p-6">
                  {!userData ? (
                    <div className="w-full text-center text-gray-500">Loading settings...</div>
                  ) : (
                    <>
                      {/* Settings Grid Container */}
                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {/* Language Settings Section */}
                        <div className="bg-transparent flex flex-col items-start justify-start gap-[16px]">
                          <div className="w-full bg-transparent flex flex-col items-start justify-start gap-[8px]">
                            <b className="text-[12px] sm:text-[14px] leading-[22px] font-sans text-black dark:text-white">
                              Select Language
                            </b>
                            <select
                              className="w-full border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] sm:text-[14px] bg-white dark:bg-black text-black dark:text-white rounded-[8px] h-[40px] sm:h-[45px] px-[12px] sm:px-[16px]"
                              value={language}
                              onChange={(e) => setLanguage(e.target.value)}
                            >
                              <option value="en">English</option>
                              <option value="ar">Arabic</option>
                              <option value="fr">French</option>
                              <option value="es">Spanish</option>
                            </select>
                          </div>
                        </div>

                        {/* Rider Assignment Section */}
                        <div className="bg-transparent flex flex-col items-start justify-start gap-[16px]">
                          <div className="w-full bg-transparent flex flex-col items-start justify-start gap-[8px]">
                            <b className="text-[12px] sm:text-[14px] leading-[22px] font-sans text-black dark:text-white">
                              Rider Assignment Method
                            </b>
                            <div className="flex flex-col gap-3 mt-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="riderAssignment"
                                  value="auto"
                                  checked={riderAssignment === 'auto'}
                                  onChange={(e) => setRiderAssignment(e.target.value as 'auto' | 'manual')}
                                  className="w-4 h-4 text-[#fe5b18] focus:ring-[#fe5b18]"
                                />
                                <span className="text-[12px] sm:text-[14px] text-black dark:text-white">Auto Assign Riders</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="riderAssignment"
                                  value="manual"
                                  checked={riderAssignment === 'manual'}
                                  onChange={(e) => setRiderAssignment(e.target.value as 'auto' | 'manual')}
                                  className="w-4 h-4 text-[#fe5b18] focus:ring-[#fe5b18]"
                                />
                                <span className="text-[12px] sm:text-[14px] text-black dark:text-white">Assign Riders Manually</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Price Calculation Section */}
                        <div className="bg-transparent flex flex-col items-start justify-start gap-[16px]">
                          <div className="w-full bg-transparent flex flex-col items-start justify-start gap-[8px]">
                            <b className="text-[12px] sm:text-[14px] leading-[22px] font-sans text-black dark:text-white">
                              Price Calculation Method
                            </b>
                            <div className="flex flex-col gap-3 mt-2">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="priceCalculation"
                                  value="auto"
                                  checked={priceCalculation === 'auto'}
                                  onChange={(e) => setPriceCalculation(e.target.value as 'auto' | 'manual')}
                                  className="w-4 h-4 text-[#fe5b18] focus:ring-[#fe5b18]"
                                />
                                <span className="text-[12px] sm:text-[14px] text-black dark:text-white">Auto-calculate Price</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name="priceCalculation"
                                  value="manual"
                                  checked={priceCalculation === 'manual'}
                                  onChange={(e) => setPriceCalculation(e.target.value as 'auto' | 'manual')}
                                  className="w-4 h-4 text-[#fe5b18] focus:ring-[#fe5b18]"
                                />
                                <span className="text-[12px] sm:text-[14px] text-black dark:text-white">Set Price Manually</span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Save Button and Error Message */}
                      <div className="flex flex-col gap-4 mt-6">
                        <button
                          className="cursor-pointer bg-black dark:bg-[#fe5b18] text-white px-6 sm:px-8 py-2 sm:py-3 rounded-[8px] font-sans text-[12px] sm:text-[14px] hover:bg-[#1a1a1a] dark:hover:bg-[#e54d0e] disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={handleSaveRestaurantSettings}
                          disabled={isSettingsSaving}
                        >
                          {isSettingsSaving ? 'Saving...' : isSaved ? 'Saved!' : 'Save Settings'}
                        </button>
                        {saveError && (
                          <div className="text-red-500 text-[11px] sm:text-sm font-sans">
                            {saveError}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                null
              )}
            </div>
          </form>
        </section>
      </div>
      
      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <AddTeamMember 
          onClose={() => setIsAddMemberOpen(false)}
          restaurantId={userData?.restaurantId || null}
        />
      )}
      
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Team Member"
        message="Are you sure you want to delete this team member? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      
      <ConfirmationModal
        isOpen={deleteRiderModalOpen}
        onClose={() => {
          setDeleteRiderModalOpen(false);
          setRiderToDelete(null);
        }}
        onConfirm={handleConfirmRiderDelete}
        title="Delete Rider"
        message="Are you sure you want to delete this rider? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
      />
      
      {isEditMemberOpen && memberToEdit && (
        <EditTeamMemberModal
          member={memberToEdit}
          onClose={() => {
            setIsEditMemberOpen(false);
            setMemberToEdit(null);
          }}
          onSave={handleEditMember}
        />
      )}
      
    </div>
  );
};

export default Settings;