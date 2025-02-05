import { FunctionComponent, useState, useMemo, useRef, useEffect } from "react";
import Select from 'react-select';
import countryList from 'react-select-country-list';
import { FaCamera } from "react-icons/fa";
import { TeamMember } from '../hooks/useTeamMembers';
import { IoIosCloseCircleOutline } from "react-icons/io";
import { useUpdateTeamMember } from '../hooks/useUpdateTeamMember';

interface EditTeamMemberModalProps {
  member: TeamMember;
  onClose: () => void;
  onSave: (formData: FormData) => Promise<void>;
}

const EditTeamMemberModal: FunctionComponent<EditTeamMemberModalProps> = ({
  member,
  onClose,
  onSave
}) => {
  // Initialize state with all member data immediately
  const [editedMember, setEditedMember] = useState({
    ...member,
    address: member.address || 'N/A',
    city: member.city || 'N/A',
    postalCode: member.postalCode || 'N/A',
  });

  // Initialize country state with existing country data
  const [country, setCountry] = useState<{ value: string; label: string } | null>(() => {
    const countryCode = member.country || 'N/A';
    const countryLabel = countryList().getLabel(countryCode);
    return { value: countryCode, label: countryLabel };
  });

  const [previewImage, setPreviewImage] = useState<string | null>(member.image?.url || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const options = useMemo(() => countryList().getData(), []);
  const { updateTeamMember, isLoading, error } = useUpdateTeamMember();

  // For debugging - remove this after confirming data
  useEffect(() => {
    console.log('Member data:', member);
    console.log('Edited member:', editedMember);
    console.log('Country:', country);
  }, [member, editedMember, country]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPreviewImage(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    const formData = new FormData();
    formData.append('userId', editedMember.id);
    formData.append('email', editedMember.email);
    formData.append('userName', editedMember.userName);
    formData.append('fullName', editedMember.fullName);
    formData.append('phoneNumber', editedMember.phoneNumber);
    formData.append('role', editedMember.role);
    formData.append('country', country?.value || '');
    formData.append('address', editedMember.address);
    formData.append('city', editedMember.city);
    formData.append('postalCode', editedMember.postalCode);
    formData.append('restaurantId', member.restaurantId);
    formData.append('branchId', member.branchId);
    
    if (photoFile) {
      formData.append('photo', photoFile);
    } else if (member.image?.url) {
      formData.append('photo', member.image.url);
    }

    try {
      await updateTeamMember(formData);
      await onSave(formData);
      onClose();
    } catch (err) {
    }
  };

  const isFormValid = () => {
    return (
      editedMember.email.trim() !== '' &&
      editedMember.userName.trim() !== '' &&
      editedMember.fullName.trim() !== '' &&
      editedMember.phoneNumber.trim() !== '' &&
      editedMember.role.trim() !== '' &&
      editedMember.address.trim() !== '' &&
      editedMember.city.trim() !== '' &&
      editedMember.postalCode.trim() !== '' &&
      country?.value // Check if country is selected
    );
  };

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      height: '50px',
      borderRadius: '6px',
      backgroundColor: 'var(--bg-color, white)',
      borderColor: 'var(--border-color, #edf0f2)',
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
    option: (provided: any, state: { isSelected: boolean }) => ({
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white dark:bg-black rounded-lg p-6 w-[700px] max-h-[90vh] overflow-y-auto transform scale-60">
    {/* Header Section */}
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold text-black dark:text-white font-sans">Edit Profile</h2>
      <button onClick={onClose} className="bg-transparent">
        <IoIosCloseCircleOutline className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
      </button>
    </div>

    {/* Profile Image */}
    <div className="flex justify-center mb-6">
      <div className="relative rounded-full w-[100px] h-[100px] cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
        <img src={previewImage || '/default-profile.jpg'} alt="Profile" className="w-full h-full rounded-full object-cover" />
        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <FaCamera className="text-white text-2xl" />
        </div>
        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
      </div>
    </div>

    {/* Form Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {/* Left Column */}
      <div className="space-y-6 w-[300px]">
        <div className="mb-6">
          <label className="block text-sm font-medium text-black dark:text-white mb-2 font-sans">Full Name</label>
          <input
            type="text"
            value={editedMember.fullName}
            onChange={(e) => setEditedMember({ ...editedMember, fullName: e.target.value })}
            placeholder="Enter full name"
            className="w-full h-[45px] px-3 border border-gray-200 border-solid rounded-lg bg-white dark:bg-black text-black dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-black dark:text-white mb-2 font-sans">Username</label>
          <input
            type="text"
            value={editedMember.userName}
            onChange={(e) => setEditedMember({ ...editedMember, userName: e.target.value })}
            placeholder="Enter username"
            className="w-full h-[45px] px-3 border border-gray-200 border-solid rounded-lg bg-white dark:bg-black text-black dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-black dark:text-white mb-2 font-sans">Email</label>
          <input
            type="email"
            value={editedMember.email}
            onChange={(e) => setEditedMember({ ...editedMember, email: e.target.value })}
            placeholder="Enter email"
            className="w-full h-[45px] px-3 border border-gray-200 border-solid rounded-lg bg-white dark:bg-black text-black dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-black dark:text-white mb-2 font-sans">Phone Number</label>
          <input
            type="tel"
            value={editedMember.phoneNumber}
            onChange={(e) => setEditedMember({ ...editedMember, phoneNumber: e.target.value })}
            placeholder="Enter phone number"
            className="w-full h-[45px] px-3 border border-gray-200 border-solid rounded-lg bg-white dark:bg-black text-black dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-black dark:text-white mb-2 font-sans">Role</label>
          <select
            value={editedMember.role}
            onChange={(e) => setEditedMember({ ...editedMember, role: e.target.value })}
            className="w-[330px] h-[45px] px-3 border border-gray-200 border-solid rounded-lg bg-white dark:bg-black text-black dark:text-white"
          >
            <option value="">Select a role</option>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Store Clerk">Store Clerk</option>
            <option value="Rider">Rider</option>
          </select>
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-6 gap-10 w-[300px]">
        <div className="mb-6">
          <label className="block text-sm font-medium text-black dark:text-white mb-2 font-sans">Address</label>
          <input
            type="text"
            value={editedMember.address}
            onChange={(e) => setEditedMember({ ...editedMember, address: e.target.value })}
            placeholder="Enter address"
            className="w-full h-[45px] px-3 border border-gray-200 border-solid rounded-lg bg-white dark:bg-black text-black dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-black dark:text-white mb-2 font-sans">City</label>
          <input
            type="text"
            value={editedMember.city}
            onChange={(e) => setEditedMember({ ...editedMember, city: e.target.value })}
            placeholder="Enter city"
            className="w-full h-[45px] px-3 border border-gray-200 border-solid rounded-lg bg-white dark:bg-black text-black dark:text-white"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-black dark:text-white mb-2 font-sans">Postal Code</label>
          <input
            type="text"
            value={editedMember.postalCode}
            onChange={(e) => setEditedMember({ ...editedMember, postalCode: e.target.value })}
            placeholder="Enter postal code"
            className="w-full h-[45px] px-3 border border-gray-200 border-solid rounded-lg bg-white dark:bg-black text-black dark:text-white"
          />
        </div>

    
        <div className="mb-6">
  <label className="block text-sm font-medium text-black dark:text-white mb-2 font-sans">Country</label>
  <Select
    options={options}
    value={country}
    onChange={(val) => setCountry(val)}
    className="w-[330px]"
    styles={customStyles}
    placeholder="Select a country"
  />
</div>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="flex justify-end gap-4 mt-6">
      <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
      <button 
        onClick={handleSave} 
        disabled={isLoading || !isFormValid()}
        className="px-4 py-2 bg-[#fe5b18] text-white rounded-lg hover:bg-[#e54d0e] disabled:opacity-50"
      >
        {isLoading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  </div>
</div>

  );
};

export default EditTeamMemberModal; 