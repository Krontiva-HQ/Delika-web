import { FunctionComponent, useState, useEffect } from "react";
import { IoMdClose, IoIosCloseCircleOutline } from "react-icons/io";
import { useAddMember } from '../../hooks/useAddMember';

interface SelectedItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface AddTeamMemberProps {
  onClose: () => void;
  restaurantId: string | null;
}

const AddTeamMember: FunctionComponent<AddTeamMemberProps> = ({ onClose, restaurantId }) => {
  const { addMember, isLoading: isAddingMember, error: addMemberError } = useAddMember();
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<Array<{ id: string; branchName: string }>>([]);
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: '',
    fullName: '',
    phoneNumber: '',
    branchId: '',
    userName: '',
    country: '',
    address: '',
    city: '',
    postalCode: '',
    dateOfBirth: '',
  });

  useEffect(() => {
    const fetchBranches = async () => {
      if (!restaurantId) {
        console.log('No restaurantId provided');
        return;
      }
      
      setIsLoading(true);
      try {
        console.log('Fetching branches for restaurant:', restaurantId);
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/delikaquickshipper_branches_table/${restaurantId}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched branches:', data);
        setBranches(data);
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, [restaurantId]);

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phoneNumber') {
      const numericValue = value.replace(/[^0-9]/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
      return;
    }

    if (name === 'email') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toLowerCase()
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isFormValid = () => {
    return (
      formData.email.trim() !== '' &&
      isValidEmail(formData.email) &&
      formData.role.trim() !== '' &&
      formData.fullName.trim() !== '' &&
      formData.phoneNumber.trim() !== '' &&
      formData.phoneNumber.length >= 10 &&
      formData.branchId.trim() !== '' &&
      formData.userName.trim() !== '' &&
      formData.country.trim() !== '' &&
      formData.address.trim() !== '' &&
      formData.city.trim() !== '' &&
      formData.postalCode.trim() !== '' &&
      formData.dateOfBirth.trim() !== ''
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addMember({
      ...formData,
      restaurantId: restaurantId,
      Status: false
    });
    if (result) onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div 
          className="bg-white rounded-lg p-6 max-w-[562px] w-full max-h-[90vh] overflow-y-auto relative
                     shadow-[0_0_15px_rgba(0,0,0,0.2)] animate-[fadeIn_0.3s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 
                     transition-colors duration-200 bg-transparent"
          >
            <IoIosCloseCircleOutline className="w-7 h-7" />
          </button>

          {/* Modal Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-[#201a18] font-sans">Add Team Member</h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div className="w-[500px] space-y-1">
  <label className="block text-[14px] font-semibold text-[#201a18] font-sans">
    Full Name
  </label>
  <input
    type="text"
    name="fullName"
    value={formData.fullName}
    onChange={handleChange}
    className="appearance-none w-full h-[50px] px-4 rounded-lg border border-[#edf0f2] 
               focus:outline-none focus:border-[#fe5b18] focus:ring-2 focus:ring-[#fe5b18] 
               font-sans bg-white box-shadow-none outline-none"
    placeholder="Enter full name"
    style={{
      boxShadow: 'none', // Disable any shadows
      border: '1px solid #edf0f2', // Initial border color
      outline: 'none', // Prevent focus outline
    }}
  />
</div>


            {/* Email */}
            <div className="w-[500px] space-y-1">
              <label className="block text-[14px] font-semibold text-[#201a18] font-sans">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`appearance-none w-full h-[50px] px-4 rounded-lg border 
                          ${!formData.email || isValidEmail(formData.email) 
                            ? 'border-[#edf0f2]' 
                            : 'border-red-500'} 
                          focus:outline-none focus:border-[#fe5b18] font-sans bg-white`}
                placeholder="Enter email address"
                style={{
                  boxShadow: 'none', // Disable any shadows
                  border: '1px solid #edf0f2', // Initial border color
                  outline: 'none', // Prevent focus outline
                }}
                required
              />
              {formData.email && !isValidEmail(formData.email) && (
                <p className="text-red-500 text-sm mt-1">Please enter a valid email address</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="w-[500px] space-y-1">
              <label className="block text-[14px] font-semibold text-[#201a18] font-sans">
                Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`appearance-none w-full h-[50px] px-4 rounded-lg border 
                          ${!formData.phoneNumber || formData.phoneNumber.length >= 10 
                            ? 'border-[#edf0f2]' 
                            : 'border-red-500'}
                          focus:outline-none focus:border-[#fe5b18] font-sans bg-white`}
                placeholder="Enter phone number"
                style={{
                  boxShadow: 'none', // Disable any shadows
                  border: '1px solid #edf0f2', // Initial border color
                  outline: 'none', // Prevent focus outline
                }}
                maxLength={15}
                required
              />
              {formData.phoneNumber && formData.phoneNumber.length < 10 && (
                <p className="text-red-500 text-sm mt-1">Phone number must be at least 10 digits</p>
              )}
            </div>

            {/* Role */}
            <div className="w-full space-y-1">
              <label className="block text-[14px] font-semibold text-[#201a18] font-sans">
                Role
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="appearance-none w-full h-[50px] px-4 rounded-lg border border-[#edf0f2] 
                         focus:outline-none focus:border-[#fe5b18] font-sans bg-white"
              >
                <option value="">Select role</option>
                <option value="Manager">Manager</option>
                <option value="Store Clerk">Store Clerk</option>
                <option value="Dispatcher">Dispatcher</option>
                <option value="Rider">Rider</option>
              </select>
            </div>

            {/* Branch */}
            <div className="w-full space-y-1">
              <label className="block text-[14px] font-semibold text-[#201a18] font-sans">
                Restaurant Branch
              </label>
              <select
                name="branchId"
                value={formData.branchId}
                onChange={handleChange}
                className="appearance-none w-full h-[50px] px-4 rounded-lg border border-[#edf0f2] 
                         focus:outline-none focus:border-[#fe5b18] font-sans bg-white"
              >
                <option value="">
                  {isLoading ? 'Loading branches...' : 'Select branch'}
                </option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
            </div>

            {/* Username */}
            <div className="w-[500px] space-y-1">
              <label className="block text-[14px] font-semibold text-[#201a18] font-sans">
                Username
              </label>
              <input
                type="text"
                name="userName"
                value={formData.userName}
                onChange={handleChange}
                className="appearance-none w-full h-[50px] px-4 rounded-lg border border-[#edf0f2] 
                         focus:outline-none focus:border-[#fe5b18] font-sans bg-white"
                placeholder="Enter username"
                style={{
                  boxShadow: 'none', // Disable any shadows
                  border: '1px solid #edf0f2', // Initial border color
                  outline: 'none', // Prevent focus outline
                }}
              />
            </div>

            {/* Date of Birth */}
            <div className="w-[500px] space-y-1">
              <label className="block text-[14px] font-semibold text-[#201a18] font-sans">
                Date of Birth
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                style={{
                  boxShadow: 'none', // Disable any shadows
                  border: '1px solid #edf0f2', // Initial border color
                  outline: 'none', // Prevent focus outline
                }}
                className="appearance-none w-full h-[50px] px-4 rounded-lg border border-[#edf0f2] 
                         focus:outline-none focus:border-[#fe5b18] font-sans bg-white"
              />
            </div>

            {/* Country */}
            <div className="w-[500px] space-y-1">
              <label className="block text-[14px] font-semibold text-[#201a18] font-sans">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="appearance-none w-full h-[50px] px-4 rounded-lg border border-[#edf0f2] 
                         focus:outline-none focus:border-[#fe5b18] font-sans bg-white"
                placeholder="Enter country"
                style={{
                  boxShadow: 'none', // Disable any shadows
                  border: '1px solid #edf0f2', // Initial border color
                  outline: 'none', // Prevent focus outline
                }}
              />
            </div>

            {/* Address */}
            <div className="w-[500px] space-y-1">
              <label className="block text-[14px] font-semibold text-[#201a18] font-sans">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="appearance-none w-full h-[50px] px-4 rounded-lg border border-[#edf0f2] 
                         focus:outline-none focus:border-[#fe5b18] font-sans bg-white"
                placeholder="Enter address"
                style={{
                  boxShadow: 'none', // Disable any shadows
                  border: '1px solid #edf0f2', // Initial border color
                  outline: 'none', // Prevent focus outline
                }}
              />
            </div>

            {/* City */}
            <div className="w-[500px] space-y-1">
              <label className="block text-[14px] font-semibold text-[#201a18] font-sans">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="appearance-none w-full h-[50px] px-4 rounded-lg border border-[#edf0f2] 
                         focus:outline-none focus:border-[#fe5b18] font-sans bg-white"
                placeholder="Enter city"
                style={{
                  boxShadow: 'none', // Disable any shadows
                  border: '1px solid #edf0f2', // Initial border color
                  outline: 'none', // Prevent focus outline
                }}
              />
            </div>

            {/* Postal Code */}
            <div className="w-[500px] space-y-1">
              <label className="block text-[14px] font-semibold text-[#201a18] font-sans">
                Postal Code
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="appearance-none w-full h-[50px] px-4 rounded-lg border border-[#edf0f2] 
                         focus:outline-none focus:border-[#fe5b18] font-sans bg-white"
                placeholder="Enter postal code"
                style={{
                  boxShadow: 'none', // Disable any shadows
                  border: '1px solid #edf0f2', // Initial border color
                  outline: 'none', // Prevent focus outline
                }}
              />
            </div>

            {/* Error message */}
            {addMemberError && (
              <div className="text-red-500 text-sm">{addMemberError}</div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAddingMember || !isFormValid()}
              className="w-full bg-[#fe5b18] text-white rounded-lg py-3 font-sans font-semibold
                       hover:bg-[#fe5b18]/90 transition-colors duration-200 mt-6 
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingMember ? 'Adding Member...' : 'Add Team Member'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddTeamMember;