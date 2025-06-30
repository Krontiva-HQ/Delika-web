/// <reference types="vite/client" />                   

import { FunctionComponent, useState, useMemo, useEffect, useRef } from "react";
import { Button, Menu } from "@mui/material";
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
import { Branch, ActiveHours } from '../../types/branch';
import { useBranchEdit } from '../../hooks/useBranchEdit';
import LocationInput from '../../components/LocationInput';
import { LocationData } from '../../types/location';

// Import i18n related imports
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n/i18n';
import useLanguageChange from '../../hooks/useLanguageChange';

interface LocalUserResponse {
  id: string;
  email: string;
  // ...
}

const Settings: FunctionComponent = () => {
  const { t } = useTranslation();
  const [textfield4AnchorEl, setTextfield4AnchorEl] = useState<null | HTMLElement>(null);
  const [textfield9AnchorEl, setTextfield9AnchorEl] = useState<null | HTMLElement>(null);
  const [activeTab, setActiveTab] = useState('edit');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const { currentLanguage } = useLanguageChange();
  const [riderAssignment, setRiderAssignment] = useState<'auto' | 'manual'>('auto');
  const [priceCalculation, setPriceCalculation] = useState<'auto' | 'manual'>('auto');
  const [userData, setUserData] = useState<UserResponse | null>(null);
  
  // Update service settings state to match API parameters
  const [serviceSettings, setServiceSettings] = useState({
    Inventory: false,
    Transactions: true,
    Reports: true,
    Overview: true,
    DeliveryReport: false,
    FullService: false,
    WalkIn: false,
    OnDemand: false,
    Batch: false,
    Schedule: false
  });

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
  const { branchData: userBranchData } = useUserProfile();

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

        if (typeof userData.dateOfBirth === 'number') {
          userData.dateOfBirth = new Date(userData.dateOfBirth) as any;
        }

        setUserData(userData);
      } catch (error) {
        // Silently handle error
      }
    };

    fetchUserData();
  }, []);

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
        // Also set the i18n language
        i18n.changeLanguage(restaurantSettings.language);
      }

      // Set rider assignment based on AutoAssign
      setRiderAssignment(restaurantSettings.AutoAssign ? 'auto' : 'manual');

      // Set price calculation based on AutoCalculatePrice
      setPriceCalculation(restaurantSettings.AutoCalculatePrice ? 'auto' : 'manual');
      
      // Load service settings from restaurant settings
      const newSettings = { ...serviceSettings };
      
      // Map each property if it exists in the restaurant settings
      // Use type assertion to allow dynamic property access
      const settingsMap = [
        'Inventory', 'Transactions', 'Reports', 'Overview', 'DeliveryReport',
        'FullService', 'WalkIn', 'OnDemand', 'Batch', 'Schedule'
      ];
      
      settingsMap.forEach(setting => {
        const settingValue = (restaurantSettings as any)[setting];
        if (typeof settingValue === 'boolean') {
          newSettings[setting as keyof typeof newSettings] = settingValue;
        }
      });
      
      setServiceSettings(newSettings);
    }
  }, [userData]);

  // Function to handle service type selection with selection rules
  const handleServiceTypeChange = (type: keyof typeof serviceSettings, checked: boolean) => {
    const newSettings = { ...serviceSettings };
    
    // Simply update the selected service type
    newSettings[type] = checked;
    
    // Update dependent settings based on service types
    updateDependentSettings(newSettings);
  };
  
  // Function to update dependent settings
  const updateDependentSettings = (settings: typeof serviceSettings) => {
    // Reset dependent settings
    settings.Inventory = false;
    settings.DeliveryReport = false;
    
    // Apply rules based on selected service types
    if (settings.OnDemand || settings.FullService) {
      settings.DeliveryReport = true;
    }
    
    if (settings.FullService || settings.WalkIn) {
      settings.Inventory = true;
    }
    
    // These are always true for all service types
    settings.Transactions = true;
    settings.Reports = true;
    settings.Overview = true;
    
    setServiceSettings(settings);
  };

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
                  src={member.userTable?.image?.url || '/default-profile.jpg'} 
                  alt={member.userTable?.fullName || 'User'}
                  className="w-6 h-6 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/default-profile.jpg';
                  }}
                />
                <span className="truncate">{member.userTable?.fullName || 'N/A'}</span>
              </div>
              <div className="text-[11px] sm:text-[12px] truncate">{member.userTable?.email || 'N/A'}</div>
              <div className="text-[11px] sm:text-[12px] truncate">{member.branchTable?.branchName || 'N/A'}</div>
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
                      id: member.id,
                      fullName: member.userTable?.fullName || '',
                      email: member.userTable?.email || '',
                      role: member.role || '',
                      Status: member.userTable?.Status || false,
                      created_at: member.created_at,
                      userName: member.userTable?.userName || '',
                      city: member.userTable?.city || 'N/A',
                      phoneNumber: member.userTable?.phoneNumber || '',
                      address: member.userTable?.address || 'N/A',
                      postalCode: member.userTable?.postalCode || 'N/A',
                      country: member.userTable?.country || 'N/A',
                      restaurantId: member.restaurantId,
                      branchId: member.branchId,
                      image: member.userTable?.image
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

    const formData = new FormData();
    formData.append('userId', userData.id);
    formData.append('email', userData.email);
    formData.append('userName', userData.userName);
    formData.append('fullName', userData.fullName);
    formData.append('phoneNumber', userData.phoneNumber);
    formData.append('address', userData.address);
    formData.append('city', userData.city);
    formData.append('postalCode', userData.postalCode);
    if (userData.dateOfBirth) {
      formData.append('dateOfBirth', userData.dateOfBirth.toString());
    }
    
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
      // Silently handle error
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
                value={userData?.email || ''}
                disabled
              />
            </div>
            <button
              onClick={handleSendOTP}
              disabled={resetLoading}
              className="cursor-pointer border-gray-200 dark:border-[#333] border-[1px] border-solid py-[13px] px-[20px] bg-black dark:bg-[#fe5b18] text-white rounded-[8px] box-border overflow-hidden flex flex-row items-center justify-center hover:bg-orange-500 dark:hover:bg-[#e54d0e]"
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
      
      const deletedMember = teamMembers.find(member => member.id === userToDelete);
      
      setDeleteModalOpen(false);
      setUserToDelete(null);
    } catch (error) {
      // Silently handle error
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
      // Silently handle error
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
      // Silently handle error
    }
  };

  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update the handleSaveRestaurantSettings function
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
        Inventory: serviceSettings.Inventory,
        Transactions: serviceSettings.Transactions,
        Reports: serviceSettings.Reports,
        Overview: serviceSettings.Overview,
        DeliveryReport: serviceSettings.DeliveryReport,
        FullService: serviceSettings.FullService,
        WalkIn: serviceSettings.WalkIn,
        OnDemand: serviceSettings.OnDemand,
        Batch: serviceSettings.Batch,
        Schedule: serviceSettings.Schedule,
        AutoAssign: riderAssignment === 'auto',
        AutoCalculatePrice: priceCalculation === 'auto',
        language: language
      };

      await updateRestaurantPreferences(preferences);

      setIsSaved(true);
      addNotification({
        type: 'profile_update',
        message: `Restaurant settings updated successfully`
      });

      // Show saving message
      setTimeout(() => {
        setIsSaved(false);
        
        
        
        // Delay and then reload the application
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 1000);
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

  // Update the language change handler to change the application language
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    
    // Change the application language
    i18n.changeLanguage(newLanguage);
  };

  // Update the initial language state to use the current language
  const [language, setLanguage] = useState(() => {
    // If the user has stored a language preference in their userData, use that
    if (userProfile._restaurantTable?.[0]?.language) {
      return userProfile._restaurantTable[0].language;
    }
    // Otherwise use the current app language
    return currentLanguage || 'en';
  });

  const [branchData, setBranchData] = useState<Branch>({
    active: true,
    branchUrl: '',
    branchCity: '',
    branchName: '',
    activeHours: [
      { day: 'Monday', closingTime: '6:00 PM', openingTime: '4:00 AM' },
      { day: 'Tuesday', closingTime: '6:00 PM', openingTime: '4:00 AM' },
      { day: 'Wednesday', closingTime: '6:00 PM', openingTime: '4:00 AM' },
      { day: 'Thursday', closingTime: '6:00 PM', openingTime: '4:00 AM' },
      { day: 'Friday', closingTime: '6:00 PM', openingTime: '4:00 AM' },
      { day: 'Saturday', closingTime: '6:00 PM', openingTime: '4:00 AM' },
      { day: 'Sunday', closingTime: '6:00 PM', openingTime: '4:00 AM' }
    ],
    restaurantID: '',
    branchLatitude: '',
    branchLocation: '',
    branchLongitude: '',
    branchPhoneNumber: ''
  });

  const { updateBranch, isLoading: isBranchUpdating, error: branchUpdateError } = useBranchEdit();

  // Initialize branch data from userProfile
  useEffect(() => {
    if (userBranchData && userBranchData.id && !branchData.branchName) {
      setBranchData(prevData => {
        // Skip update if data is already set
        if (prevData.branchName) return prevData;

        // Ensure active hours are in correct format
        const formattedActiveHours = userBranchData.activeHours?.map((hour: ActiveHours) => ({
          ...hour,
          openingTime: hour.openingTime ? convertTo12Hour(convertTo24Hour(hour.openingTime)) : '8:00 AM',
          closingTime: hour.closingTime ? convertTo12Hour(convertTo24Hour(hour.closingTime)) : '8:00 PM'
        })) || [
          { day: 'Monday', closingTime: '8:00 PM', openingTime: '8:00 AM' },
          { day: 'Tuesday', closingTime: '8:00 PM', openingTime: '8:00 AM' },
          { day: 'Wednesday', closingTime: '8:00 PM', openingTime: '8:00 AM' },
          { day: 'Thursday', closingTime: '8:00 PM', openingTime: '8:00 AM' },
          { day: 'Friday', closingTime: '8:00 PM', openingTime: '8:00 AM' },
          { day: 'Saturday', closingTime: '8:00 PM', openingTime: '8:00 AM' },
          { day: 'Sunday', closingTime: '8:00 PM', openingTime: '8:00 AM' }
        ];

        return {
          ...prevData,
          branchName: userBranchData.branchName || '',
          branchPhoneNumber: userBranchData.branchPhoneNumber || '',
          branchLocation: userBranchData.branchLocation || '',
          branchCity: '', // This might need to be extracted from branchLocation or set separately
          branchLatitude: userBranchData.branchLatitude || '',
          branchLongitude: userBranchData.branchLongitude || '',
          restaurantID: userBranchData.restaurantID || userProfile.restaurantId || '',
          activeHours: formattedActiveHours
        };
      });
    }
  }, [userBranchData?.id, userProfile.restaurantId]);

  const handleBranchInputChange = (field: keyof Branch, value: string) => {
    setBranchData(prev => ({ ...prev, [field]: value }));
  };

  // Helper function to convert 24-hour time to 12-hour format
  const convertTo12Hour = (time24: string): string => {
    if (!time24) return '';
    
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper function to convert 12-hour time to 24-hour format
  const convertTo24Hour = (time12: string): string => {
    if (!time12) return '';
    
    const timeRegex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
    const match = time12.match(timeRegex);
    
    if (!match) return time12; // Return original value if it's already in 24h format
    
    let [, hours, minutes, ampm] = match;
    let hour = parseInt(hours, 10);
    
    if (ampm.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (ampm.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minutes}`;
  };

  const handleActiveHoursChange = (index: number, field: keyof ActiveHours, value: string) => {
    setBranchData(prev => {
      const newActiveHours = [...prev.activeHours];
      newActiveHours[index] = { 
        ...newActiveHours[index], 
        [field]: convertTo12Hour(value)  // Convert the 24h value from select to 12h format
      };
      return { ...prev, activeHours: newActiveHours };
    });
  };

  const [isBranchSaved, setIsBranchSaved] = useState(false);

  const handleSaveBranch = async () => {
    if (!userBranchData?.id) return;

    try {
      await updateBranch(userBranchData.id, branchData);
      setIsBranchSaved(true);
      addNotification({
        type: 'profile_update',
        message: `Branch details updated successfully`
      });
      
      setTimeout(() => {
        setIsBranchSaved(false);
      }, 2000);
    } catch (error) {
      // Silently handle error
    }
  };

  const handleLocationSelect = (locationData: LocationData) => {
    setBranchData(prev => ({
      ...prev,
      branchLocation: locationData.address,
      branchLatitude: locationData.latitude.toString(),
      branchLongitude: locationData.longitude.toString()
    }));
  };

  return (
    <div className="h-full w-full bg-white dark:bg-black m-0 p-0 font-sans">
      <div className="p-3 ml-4 mr-4">
        <b className="block text-[18px] mb-4 font-sans text-black dark:text-white">
          {t('settings.title')}
        </b>
        <section className="mb-[10px] mt-[20px] max-w-[calc(100%-px)] overflow-hidden">
          <form className="self-stretch rounded-[4px] bg-white dark:bg-black border-gray-200 dark:border-[#333] border-[1px] border-solid flex flex-col items-start justify-start py-[10px] px-[10px] gap-[20px]">
            {/* Tab Navigation */}
            <section className="self-stretch flex flex-col items-start justify-start p-[8px] border-b border-gray-200 dark:border-[#333] overflow-x-auto">
              <div className="self-stretch flex flex-row items-center justify-start gap-[20px] md:gap-[40px] min-w-max">
                {/* Edit Profile Tab */}
                <div 
                  className={`relative text-[11px] sm:text-[12px] leading-[20px] font-sans cursor-pointer ${
                    activeTab === 'edit' ? 'text-[#fe5b18] font-bold dark:text-[#fe5b18]' : 'text-black dark:text-white'
                  }`}
                  onClick={() => setActiveTab('edit')}
                >
                  {t('settings.tabs.editProfile')}
                </div>

                {/* Team Members Tab */}
                {!isStoreClerk && (
                  <div 
                    className={`relative text-[11px] sm:text-[12px] leading-[20px] font-sans cursor-pointer ${
                      activeTab === 'team' ? 'text-[#fe5b18] font-bold dark:text-[#fe5b18]' : 'text-black dark:text-white'
                    }`}
                    onClick={() => setActiveTab('team')}
                  >
                    {t('settings.tabs.teamMembers')}
                  </div>
                )}

                {/* Branch Settings Tab */}
                <div 
                  className={`relative text-[11px] sm:text-[12px] leading-[20px] font-sans cursor-pointer ${
                    activeTab === 'branch' ? 'text-[#fe5b18] font-bold dark:text-[#fe5b18]' : 'text-black dark:text-white'
                  }`}
                  onClick={() => setActiveTab('branch')}
                >
                  Branch Settings
                </div>

                {/* Restaurant Settings Tab */}
                {!isStoreClerk && (
                  <div 
                    className={`relative text-[11px] sm:text-[12px] leading-[20px] font-sans cursor-pointer ${
                      activeTab === 'restaurant-settings' ? 'text-[#fe5b18] font-bold dark:text-[#fe5b18]' : 'text-black dark:text-white'
                    }`}
                    onClick={() => setActiveTab('restaurant-settings')}
                  >
                    {t('settings.tabs.restaurantSettings')}
                  </div>
                )}

                {/* About Restaurant Tab */}
                {!isStoreClerk && (
                  <div 
                    className={`relative text-[11px] sm:text-[12px] leading-[20px] font-sans cursor-pointer ${
                      activeTab === 'restaurant' ? 'text-[#fe5b18] font-bold dark:text-[#fe5b18]' : 'text-black dark:text-white'
                    }`}
                    onClick={() => setActiveTab('restaurant')}
                  >
                    {t('settings.tabs.aboutRestaurant')}
                  </div>
                )}

                {/* Change Password Tab */}
                {userProfile.email && (
                  <div 
                    className={`relative text-[11px] sm:text-[12px] leading-[20px] font-sans cursor-pointer ${
                      activeTab === 'password' ? 'text-[#fe5b18] font-bold dark:text-[#fe5b18]' : 'text-black dark:text-white'
                    }`}
                    onClick={() => setActiveTab('password')}
                  >
                    {t('settings.tabs.changePassword')}
                  </div>
                )}
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
              ) : activeTab === 'password' && userProfile.email ? (
                <div className="self-stretch flex flex-col items-start justify-start gap-[10px]">
                  {renderPasswordChangeSection()}
                  {resetError && <div className="text-red-500 font-sans">{resetError}</div>}
                </div>
              ) : activeTab === 'restaurant-settings' ? (
                <div className="self-stretch flex flex-col items-start justify-start gap-[20px] p-4 sm:p-6">
                  {!userData ? (
                    <div className="w-full text-center text-gray-500">{t('common.loading')}</div>
                  ) : (
                    <>
                      {/* Settings Grid Container */}
                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {/* Language Settings Section */}
                        <div className="bg-transparent flex flex-col items-start justify-start gap-[16px]">
                          <div className="w-full bg-transparent flex flex-col items-start justify-start gap-[8px]">
                            <b className="text-[12px] sm:text-[14px] leading-[22px] font-sans text-black dark:text-white">
                              {t('settings.restaurant.language')}
                            </b>
                            <select
                              value={language}
                              onChange={handleLanguageChange}
                              className="block w-full px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                            >
                              <option value="en">English</option>
                              <option value="fr" disabled className="text-gray-400">Français (Coming Soon)</option>
                              <option value="es" disabled className="text-gray-400">Español (Coming Soon)</option>
                            </select>
                          </div>
                        </div>

                        {/* Rider Assignment Section */}
                        <div className="bg-transparent flex flex-col items-start justify-start gap-[16px]">
                          <div className="w-full bg-transparent flex flex-col items-start justify-start gap-[8px]">
                            <b className="text-[12px] sm:text-[14px] leading-[22px] font-sans text-black dark:text-white">
                              {t('settings.restaurant.riderAssignment')}
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
                                <span className="text-[12px] sm:text-[14px] text-black dark:text-white">
                                  {t('settings.restaurant.autoAssign')}
                                </span>
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
                                <span className="text-[12px] sm:text-[14px] text-black dark:text-white">
                                  {t('settings.restaurant.manualAssign')}
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Price Calculation Section */}
                        <div className="bg-transparent flex flex-col items-start justify-start gap-[16px]">
                          <div className="w-full bg-transparent flex flex-col items-start justify-start gap-[8px]">
                            <b className="text-[12px] sm:text-[14px] leading-[22px] font-sans text-black dark:text-white">
                              {t('settings.restaurant.priceCalculation')}
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
                                <span className="text-[12px] sm:text-[14px] text-black dark:text-white">
                                  {t('settings.restaurant.autoCalculate')}
                                </span>
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
                                <span className="text-[12px] sm:text-[14px] text-black dark:text-white">
                                  {t('settings.restaurant.manualCalculate')}
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Service Type Configuration Section */}
                      <div className="w-full mt-8">
                        <div className="border border-gray-200 dark:border-[#333] rounded-lg p-4 sm:p-6">
                          <h3 className="text-[14px] sm:text-[16px] font-semibold mb-4 text-black dark:text-white font-sans">
                            {t('settings.serviceTypes.title')}
                          </h3>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                            {/* Service Type Options */}
                            <div className="flex flex-col gap-4">
                              <b className="text-[12px] sm:text-[14px] font-sans text-black dark:text-white">
                                {t('settings.serviceTypes.selectTypes')}
                              </b>
                              
                              <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={serviceSettings.OnDemand}
                                  onChange={(e) => handleServiceTypeChange('OnDemand', e.target.checked)}
                                  className="mt-1 w-4 h-4 text-[#fe5b18] focus:ring-[#fe5b18]"
                                />
                                <div>
                                  <span className="block text-[12px] sm:text-[14px] font-medium text-black dark:text-white">{t('settings.serviceTypes.onDemand.name')}</span>
                                  <span className="block text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">{t('settings.serviceTypes.onDemand.description')}</span>
                                </div>
                              </label>
                              
                              <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={serviceSettings.FullService}
                                  onChange={(e) => handleServiceTypeChange('FullService', e.target.checked)}
                                  className="mt-1 w-4 h-4 text-[#fe5b18] focus:ring-[#fe5b18]"
                                />
                                <div>
                                  <span className="block text-[12px] sm:text-[14px] font-medium text-black dark:text-white">{t('settings.serviceTypes.fullService.name')}</span>
                                  <span className="block text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">{t('settings.serviceTypes.fullService.description')}</span>
                                </div>
                              </label>
                              
                              <label className="flex items-start gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={serviceSettings.WalkIn}
                                  onChange={(e) => handleServiceTypeChange('WalkIn', e.target.checked)}
                                  className="mt-1 w-4 h-4 text-[#fe5b18] focus:ring-[#fe5b18]"
                                />
                                <div>
                                  <span className="block text-[12px] sm:text-[14px] font-medium text-black dark:text-white">{t('settings.serviceTypes.walkIn.name')}</span>
                                  <span className="block text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">{t('settings.serviceTypes.walkIn.description')}</span>
                                </div>
                              </label>
                            </div>
                            
                            <div className="flex flex-col gap-4">
                              <b className="text-[12px] sm:text-[14px] font-sans text-black dark:text-white">
                                {t('settings.serviceTypes.additionalOptions')}
                              </b>
                              
                              <label className={`flex items-start gap-2 cursor-pointer ${(!serviceSettings.OnDemand) ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={serviceSettings.Batch}
                                  onChange={(e) => handleServiceTypeChange('Batch', e.target.checked)}
                                  disabled={!serviceSettings.OnDemand}
                                  className="mt-1 w-4 h-4 text-[#fe5b18] focus:ring-[#fe5b18]"
                                />
                                <div>
                                  <span className="block text-[12px] sm:text-[14px] font-medium text-black dark:text-white">{t('settings.serviceTypes.batchDelivery.name')}</span>
                                  <span className="block text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">{t('settings.serviceTypes.batchDelivery.description')}</span>
                                </div>
                              </label>
                              
                              <label className={`flex items-start gap-2 cursor-pointer ${(!serviceSettings.OnDemand) ? 'opacity-50 pointer-events-none' : ''}`}>
                                <input
                                  type="checkbox"
                                  checked={serviceSettings.Schedule}
                                  onChange={(e) => handleServiceTypeChange('Schedule', e.target.checked)}
                                  disabled={!serviceSettings.OnDemand}
                                  className="mt-1 w-4 h-4 text-[#fe5b18] focus:ring-[#fe5b18]"
                                />
                                <div>
                                  <span className="block text-[12px] sm:text-[14px] font-medium text-black dark:text-white">{t('settings.serviceTypes.scheduledDelivery.name')}</span>
                                  <span className="block text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">{t('settings.serviceTypes.scheduledDelivery.description')}</span>
                                </div>
                              </label>
                            </div>
                            
                            {/* Active Features Based on Selection */}
                            <div className="flex flex-col gap-4">
                              <b className="text-[12px] sm:text-[14px] font-sans text-black dark:text-white">
                                {t('settings.serviceTypes.activeFeatures')}
                              </b>
                              
                              <div className="grid grid-cols-1 gap-2">
                                <div className={`flex items-center gap-2 ${serviceSettings.Inventory ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                  <div className={`w-3 h-3 rounded-full ${serviceSettings.Inventory ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                  <span className="text-[12px]">{t('settings.serviceTypes.features.inventory')}</span>
                                </div>
                                
                                <div className={`flex items-center gap-2 ${serviceSettings.Transactions ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                  <div className={`w-3 h-3 rounded-full ${serviceSettings.Transactions ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                  <span className="text-[12px]">{t('settings.serviceTypes.features.transactions')}</span>
                                </div>
                                
                                <div className={`flex items-center gap-2 ${serviceSettings.Reports ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                  <div className={`w-3 h-3 rounded-full ${serviceSettings.Reports ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                  <span className="text-[12px]">{t('settings.serviceTypes.features.reports')}</span>
                                </div>
                                
                                <div className={`flex items-center gap-2 ${serviceSettings.Overview ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                  <div className={`w-3 h-3 rounded-full ${serviceSettings.Overview ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                  <span className="text-[12px]">{t('settings.serviceTypes.features.overview')}</span>
                                </div>
                                
                                <div className={`flex items-center gap-2 ${serviceSettings.DeliveryReport ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                  <div className={`w-3 h-3 rounded-full ${serviceSettings.DeliveryReport ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                  <span className="text-[12px]">{t('settings.serviceTypes.features.deliveryReport')}</span>
                                </div>
                                
                                <div className={`flex items-center gap-2 ${serviceSettings.Batch ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                  <div className={`w-3 h-3 rounded-full ${serviceSettings.Batch ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                  <span className="text-[12px]">{t('settings.serviceTypes.features.batch')}</span>
                                </div>
                                
                                <div className={`flex items-center gap-2 ${serviceSettings.Schedule ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>
                                  <div className={`w-3 h-3 rounded-full ${serviceSettings.Schedule ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                  <span className="text-[12px]">{t('settings.serviceTypes.features.schedule')}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Selection Rules Information */}
                          <div className="mt-6 border-t border-gray-200 dark:border-[#333] pt-4">
                            <div className="text-[11px] sm:text-[12px] text-gray-500 dark:text-gray-400">
                              <p className="mb-2 font-medium">{t('settings.serviceTypes.selectionRules.title')}</p>
                              <ul className="list-disc ml-5 space-y-1">
                                <li>{t('settings.serviceTypes.selectionRules.onDemand')}</li>
                                <li>{t('settings.serviceTypes.selectionRules.fullService')}</li>
                                <li>{t('settings.serviceTypes.selectionRules.walkIn')}</li>
                              </ul>
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
                          {isSettingsSaving ? t('settings.restaurant.saving') : isSaved ? t('settings.restaurant.saved') : t('settings.restaurant.saveSettings')}
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
              ) : activeTab === 'branch' ? (
                <div className="self-stretch flex flex-col items-start justify-start gap-[20px] p-4">
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="w-full bg-transparent flex flex-col items-start justify-start gap-[1px]">
                      <b className="self-stretch relative text-[12px] sm:text-[14px] leading-[22px] font-sans text-black dark:text-white">
                        Branch Name
                      </b>
                      <input
                        className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] sm:text-[14px] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[8px] box-border h-[40px] sm:h-[49px] pt-[13.5px] px-[20px] pb-[12.5px]"
                        type="text"
                        value={branchData.branchName}
                        onChange={(e) => handleBranchInputChange('branchName', e.target.value)}
                      />
                    </div>

                    <div className="w-full bg-transparent flex flex-col items-start justify-start gap-[1px]">
                      <b className="self-stretch relative text-[12px] sm:text-[14px] leading-[22px] font-sans text-black dark:text-white">
                        Branch Phone Number
                      </b>
                      <input
                        className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] font-sans text-[12px] sm:text-[14px] bg-white dark:bg-black text-black dark:text-white self-stretch relative rounded-[8px] box-border h-[40px] sm:h-[49px] pt-[13.5px] px-[20px] pb-[12.5px]"
                        type="tel"
                        value={branchData.branchPhoneNumber}
                        onChange={(e) => handleBranchInputChange('branchPhoneNumber', e.target.value)}
                      />
                    </div>

                    <div className="w-full bg-transparent flex flex-col items-start justify-start gap-[1px]">
                      <LocationInput
                        label="Branch Location"
                        onLocationSelect={handleLocationSelect}
                        prefillData={branchData ? {
                          address: branchData.branchLocation,
                          latitude: parseFloat(branchData.branchLatitude) || 0,
                          longitude: parseFloat(branchData.branchLongitude) || 0,
                          name: branchData.branchName
                        } : undefined}
                        disabled={isBranchUpdating}
                      />
                    </div>

                    
                  </div>

                  {/* Active Hours Section */}
                  <div className="w-full mt-6">
                    <h3 className="text-[18px] font-bold mb-6 text-black dark:text-white">
                      Active Hours
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      {branchData.activeHours.map((hours, index) => (
                        <div key={hours.day} className="flex items-center gap-4">
                          <div className="w-[120px] text-[14px] font-medium text-black dark:text-white">
                            {hours.day}
                          </div>
                          <div className="flex items-center gap-4">
                            <select
                              className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] 
                                       bg-white dark:bg-black text-black dark:text-white rounded-[8px] 
                                       h-[50px] px-4 appearance-none cursor-pointer w-[150px]
                                       bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==')] 
                                       bg-no-repeat bg-[center_right_1rem]"
                              value={convertTo24Hour(hours.openingTime)}
                              onChange={(e) => handleActiveHoursChange(index, 'openingTime', e.target.value)}
                            >
                              <option value="00:00">12:00 AM</option>
                              <option value="00:30">12:30 AM</option>
                              <option value="01:00">1:00 AM</option>
                              <option value="01:30">1:30 AM</option>
                              <option value="02:00">2:00 AM</option>
                              <option value="02:30">2:30 AM</option>
                              <option value="03:00">3:00 AM</option>
                              <option value="03:30">3:30 AM</option>
                              <option value="04:00">4:00 AM</option>
                              <option value="04:30">4:30 AM</option>
                              <option value="05:00">5:00 AM</option>
                              <option value="05:30">5:30 AM</option>
                              <option value="06:00">6:00 AM</option>
                              <option value="06:30">6:30 AM</option>
                              <option value="07:00">7:00 AM</option>
                              <option value="07:30">7:30 AM</option>
                              <option value="08:00">8:00 AM</option>
                              <option value="08:30">8:30 AM</option>
                              <option value="09:00">9:00 AM</option>
                              <option value="09:30">9:30 AM</option>
                              <option value="10:00">10:00 AM</option>
                              <option value="10:30">10:30 AM</option>
                              <option value="11:00">11:00 AM</option>
                              <option value="11:30">11:30 AM</option>
                              <option value="12:00">12:00 PM</option>
                              <option value="12:30">12:30 PM</option>
                              <option value="13:00">1:00 PM</option>
                              <option value="13:30">1:30 PM</option>
                              <option value="14:00">2:00 PM</option>
                              <option value="14:30">2:30 PM</option>
                              <option value="15:00">3:00 PM</option>
                              <option value="15:30">3:30 PM</option>
                              <option value="16:00">4:00 PM</option>
                              <option value="16:30">4:30 PM</option>
                              <option value="17:00">5:00 PM</option>
                              <option value="17:30">5:30 PM</option>
                              <option value="18:00">6:00 PM</option>
                              <option value="18:30">6:30 PM</option>
                              <option value="19:00">7:00 PM</option>
                              <option value="19:30">7:30 PM</option>
                              <option value="20:00">8:00 PM</option>
                              <option value="20:30">8:30 PM</option>
                              <option value="21:00">9:00 PM</option>
                              <option value="21:30">9:30 PM</option>
                              <option value="22:00">10:00 PM</option>
                              <option value="22:30">10:30 PM</option>
                              <option value="23:00">11:00 PM</option>
                              <option value="23:30">11:30 PM</option>
                            </select>
                            <span className="text-[14px] text-black dark:text-white">to</span>
                            <select
                              className="border-gray-200 dark:border-[#333] border-[1px] border-solid [outline:none] 
                                       bg-white dark:bg-black text-black dark:text-white rounded-[8px] 
                                       h-[50px] px-4 appearance-none cursor-pointer w-[150px]
                                       bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNkw4IDEwTDEyIDYiIHN0cm9rZT0iIzY2NjY2NiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg==')] 
                                       bg-no-repeat bg-[center_right_1rem]"
                              value={convertTo24Hour(hours.closingTime)}
                              onChange={(e) => handleActiveHoursChange(index, 'closingTime', e.target.value)}
                            >
                              <option value="00:00">12:00 AM</option>
                              <option value="00:30">12:30 AM</option>
                              <option value="01:00">1:00 AM</option>
                              <option value="01:30">1:30 AM</option>
                              <option value="02:00">2:00 AM</option>
                              <option value="02:30">2:30 AM</option>
                              <option value="03:00">3:00 AM</option>
                              <option value="03:30">3:30 AM</option>
                              <option value="04:00">4:00 AM</option>
                              <option value="04:30">4:30 AM</option>
                              <option value="05:00">5:00 AM</option>
                              <option value="05:30">5:30 AM</option>
                              <option value="06:00">6:00 AM</option>
                              <option value="06:30">6:30 AM</option>
                              <option value="07:00">7:00 AM</option>
                              <option value="07:30">7:30 AM</option>
                              <option value="08:00">8:00 AM</option>
                              <option value="08:30">8:30 AM</option>
                              <option value="09:00">9:00 AM</option>
                              <option value="09:30">9:30 AM</option>
                              <option value="10:00">10:00 AM</option>
                              <option value="10:30">10:30 AM</option>
                              <option value="11:00">11:00 AM</option>
                              <option value="11:30">11:30 AM</option>
                              <option value="12:00">12:00 PM</option>
                              <option value="12:30">12:30 PM</option>
                              <option value="13:00">1:00 PM</option>
                              <option value="13:30">1:30 PM</option>
                              <option value="14:00">2:00 PM</option>
                              <option value="14:30">2:30 PM</option>
                              <option value="15:00">3:00 PM</option>
                              <option value="15:30">3:30 PM</option>
                              <option value="16:00">4:00 PM</option>
                              <option value="16:30">4:30 PM</option>
                              <option value="17:00">5:00 PM</option>
                              <option value="17:30">5:30 PM</option>
                              <option value="18:00">6:00 PM</option>
                              <option value="18:30">6:30 PM</option>
                              <option value="19:00">7:00 PM</option>
                              <option value="19:30">7:30 PM</option>
                              <option value="20:00">8:00 PM</option>
                              <option value="20:30">8:30 PM</option>
                              <option value="21:00">9:00 PM</option>
                              <option value="21:30">9:30 PM</option>
                              <option value="22:00">10:00 PM</option>
                              <option value="22:30">10:30 PM</option>
                              <option value="23:00">11:00 PM</option>
                              <option value="23:30">11:30 PM</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <button
                    className="mt-6 cursor-pointer bg-black dark:bg-[#fe5b18] text-white px-6 sm:px-8 py-2 sm:py-3 rounded-[8px] font-sans text-[12px] sm:text-[14px] hover:bg-[#1a1a1a] dark:hover:bg-[#e54d0e] disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSaveBranch}
                    disabled={isBranchUpdating || isBranchSaved}
                  >
                    {isBranchUpdating ? 'Saving...' : isBranchSaved ? 'Saved!' : 'Save Branch Settings'}
                  </button>

                  {branchUpdateError && (
                    <div className="text-red-500 text-[11px] sm:text-sm font-sans mt-2">
                      {branchUpdateError}
                    </div>
                  )}
                </div>
              ) : null}
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