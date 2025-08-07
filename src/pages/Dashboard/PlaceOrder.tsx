import React, { useState, useEffect, FunctionComponent, ReactNode } from "react";
import { Button } from "@mui/material";
import { getAuthenticatedUser, UserResponse, placeOrder, getRidersByBranch, calculateDeliveryPriceAPI } from "../../services/api";
import LocationInput from '../../components/LocationInput';
import { LocationData } from "../../types/location";
import { calculateDistance } from "../../utils/distance";
import { RiDeleteBinLine } from "react-icons/ri";
import { usePlaceOrderItems } from '../../hooks/usePlaceOrderItems';
import { useNotifications } from '../../context/NotificationContext';
import { IoIosCloseCircleOutline, IoIosArrowBack, IoMdAdd } from "react-icons/io";
import { useUserProfile } from '../../hooks/useUserProfile';
import { useBranches } from '../../hooks/useBranches';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import { styled } from '@mui/material/styles';
import { SelectChangeEvent } from '@mui/material/Select';
import { toast } from 'react-toastify';
import BatchSummaryModal from '../../components/BatchSummaryModal';
import { ArrowLeftIcon } from '@heroicons/react/24/solid';
import { getAvailableDeliveryMethods } from '../../permissions/DashboardPermissions';
import { hasAutoCalculatePrice, calculateDeliveryFee, getDeliveryPriceInfo } from '../../permissions/DashboardPermissions';
import { Rider } from "../../components/RidersTable";
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import ServiceTypeModal from './ServiceTypeModal';
import OnDemandContent from '../../components/OnDemandContent';
import FullServiceContent from '../../components/FullServiceContent';
import ScheduleContent from '../../components/ScheduleContent';
import BatchContent from '../../components/BatchContent';
import WalkInContent from '../../components/WalkInContent';
import ExtrasSelectionInline from '../../components/ExtrasSelectionInline';
import { SelectedItem, SelectedItemExtra, MenuItemData } from '../../types/order';

// Add the API key directly if needed
const GOOGLE_MAPS_API_KEY = 'AIzaSyAdv28EbwKXqvlKo2henxsKMD-4EKB20l8';

// Add these type definitions at the top if not present
// @ts-ignore
// eslint-disable-next-line
// These are available in browsers with Web Bluetooth API, but may not be in TS env
// Fallback to 'any' if not available

// PrinterService Web Implementation - based on web-example.html
class WebPrinterService {
  // Add helper method for text wrapping
  static wrapText(text: string, maxChars: number = 10): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
      if ((currentLine + word).length <= maxChars) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        // If single word is longer than maxChars, split it
        if (word.length > maxChars) {
          const chunks = word.match(new RegExp(`.{1,${maxChars}}`, 'g')) || [];
          lines.push(...chunks);
          currentLine = '';
        } else {
          currentLine = word;
        }
      }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  // Add methods for printer persistence
  static savePrinterConnection(device: any) {
    console.log('💾 Saving printer connection...');
    if (device && device.name) {
      localStorage.setItem('lastConnectedPrinter', device.name);
      localStorage.setItem('printerType', this.detectPrinterType(device.name));
      console.log('✅ Printer connection saved:', device.name);
    }
  }

  static getLastConnectedPrinter() {
    const printer = localStorage.getItem('lastConnectedPrinter');
    console.log('📋 Retrieved last connected printer:', printer);
    return printer;
  }

  static getPrinterType() {
    const type = localStorage.getItem('printerType') || 'tspl';
    console.log('🔍 Retrieved printer type:', type);
    return type;
  }

  // Detect printer type based on device name
  static detectPrinterType(deviceName: string): 'tspl' | 'escpos' {
    console.log('🔍 Detecting printer type for:', deviceName);
    const name = deviceName.toLowerCase();
    if (name.includes('mp583') || name.includes('58mm') || name.includes('esc') || name.includes('pos')) {
      console.log('✅ Detected ESC/POS printer');
      return 'escpos';
    }
    console.log('✅ Detected TSPL printer');
    return 'tspl';
  }

  // Generate TSPL commands for TSPL printers
  static generateTSPL(receiptData: any) {
    const { customerName, paymentMethod, items, totalPrice, restaurantName } = receiptData;
    
    let tsplCommands = 'SIZE 50 mm, 60 mm\n';
    tsplCommands += 'CLS\n';
    
    // Restaurant name header
    tsplCommands += `TEXT 100,10,"4",0,2,2,"${restaurantName || 'RESTAURANT'}"\n`;
    
    // Customer name with wrapping
    const customerNameLines = this.wrapText(customerName);
    let yPos = 60;
    customerNameLines.forEach(line => {
      tsplCommands += `TEXT 100,${yPos},"3",0,1,1,"${line}"\n`;
      yPos += 25;
    });
    
    // Payment method
    tsplCommands += `TEXT 200,60,"3",0,1,1,"${paymentMethod}"\n`;
    
    // Items list with bullet points and wrapping
    yPos = Math.max(yPos, 100); // Ensure we start items below customer name
    items.forEach((item: any) => {
      const itemText = `• ${item.name} x${item.quantity}`;
      const itemLines = this.wrapText(itemText);
      itemLines.forEach(line => {
        tsplCommands += `TEXT 100,${yPos},"3",0,1,1,"${line}"\n`;
        yPos += 25;
      });
    });
    
    // Add timestamp
    const timestamp = new Date().toLocaleString();
    tsplCommands += `TEXT 100,${yPos + 50},"2",0,1,1,"${timestamp}"\n`;
    
    tsplCommands += 'PRINT 1\n';
    
    return tsplCommands;
  }

  // Generate ESC/POS commands for MP583 and similar printers
  static generateESCPOS(receiptData: any) {
    const { customerName, paymentMethod, items, totalPrice, restaurantName } = receiptData;
    
    let escposCommands = '';
    
    // Initialize printer
    escposCommands += '\x1B\x40'; // Initialize printer
    escposCommands += '\x1B\x61\x01'; // Center alignment
    
    // Header
    escposCommands += '\x1B\x21\x30'; // Double height, double width
    escposCommands += `${restaurantName || 'RESTAURANT'}\n`;
    escposCommands += '\x1B\x21\x00'; // Normal size
    
    escposCommands += '\x1B\x61\x00'; // Left alignment
    escposCommands += `Customer: ${customerName}\n`;
    escposCommands += `Payment: ${paymentMethod}\n`;
    escposCommands += `Date: ${new Date().toLocaleString()}\n`;
    
    // Separator line
    escposCommands += '--------------------------------\n';
    
    // Items
    items.forEach((item: any) => {
      const itemName = item.name; // Show full item name
      const quantity = item.quantity;
      const price = (item.price * quantity).toFixed(2);
      
      escposCommands += `${itemName}\n`;
      escposCommands += `  ${quantity}x @ GHC${item.price} = GHC${price}\n`;
    });
    
    // Separator line
    escposCommands += '--------------------------------\n';
    
    // Total
    escposCommands += '\x1B\x21\x10'; // Bold
    escposCommands += `TOTAL: GHC${totalPrice}\n`;
    escposCommands += '\x1B\x21\x00'; // Normal
    
    // Footer
    escposCommands += '\x1B\x61\x01'; // Center alignment
    escposCommands += 'Thank you!\n';
    escposCommands += '\n\n\n'; // Feed paper
    
    return escposCommands;
  }
  
  static async sendRawBytesInChunks(characteristic: any, data: string, chunkSize = 20) {
    console.log('📤 sendRawBytesInChunks called');
    console.log('📊 Data length:', data.length, 'bytes');
    console.log('📦 Chunk size:', chunkSize, 'bytes');
    
    const encoder = new TextEncoder();
    const rawBytes = encoder.encode(data);
    console.log('🔢 Encoded bytes length:', rawBytes.length);
    
    const totalChunks = Math.ceil(rawBytes.length / chunkSize);
    console.log('📦 Total chunks to send:', totalChunks);
    
    for (let i = 0; i < rawBytes.length; i += chunkSize) {
      const chunk = rawBytes.slice(i, i + chunkSize);
      const chunkNumber = Math.floor(i / chunkSize) + 1;
      
      console.log(`📤 Sending chunk ${chunkNumber}/${totalChunks} (${chunk.length} bytes)`);
      
      try {
        await characteristic.writeValueWithoutResponse(chunk.buffer);
        console.log(`✅ Chunk ${chunkNumber} sent without response`);
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`⚠️ Chunk ${chunkNumber} failed without response, trying with response...`);
        await characteristic.writeValueWithResponse(chunk.buffer);
        console.log(`✅ Chunk ${chunkNumber} sent with response`);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('✅ All chunks sent successfully');
  }
  
  static async printReceipt(characteristic: any, receiptData: any) {
    console.log('🖨️ WebPrinterService.printReceipt called');
    console.log('📄 Receipt data received:', receiptData);
    
    try {
      const printerType = this.getPrinterType();
      console.log('🔍 Using printer type:', printerType);
      
      let commands;
      
      if (printerType === 'escpos') {
        console.log('📝 Generating ESC/POS commands...');
        commands = this.generateESCPOS(receiptData);
        console.log('✅ ESC/POS commands generated, length:', commands.length);
      } else {
        console.log('📝 Generating TSPL commands...');
        commands = this.generateTSPL(receiptData);
        console.log('✅ TSPL commands generated, length:', commands.length);
      }
      
      console.log('📤 Sending commands to printer...');
      await this.sendRawBytesInChunks(characteristic, commands, 20);
      console.log('✅ Commands sent successfully');
      
      return true;
    } catch (error) {
      console.log('❌ Print receipt error in WebPrinterService:', error);
      throw error;
    }
  }
}

interface PlaceOrderProps {
  onClose: () => void;
  onOrderPlaced: () => void;
  branchId: string;
  showPlaceOrder?: boolean;
}

// Update the OrderPayload interface to match the API's expected structure
interface OrderPayload {
  restaurantId: string | null;
  branchId: string | null;
  dropOff: Array<{
    toLatitude: string;
    toLongitude: string;
    toAddress: string;
  }>;
  pickup: Array<{
    fromLatitude: string;
    fromLongitude: string;
    fromAddress: string;
  }>;
  customerName: string;
  customerPhoneNumber: string;
  orderNumber: number;
  deliveryDistance: string;
  orderPrice: string;
  trackingUrl: string;
  courierName: string;
  courierPhoneNumber: string;
  orderStatus: string;
  products: Array<{
    name: string;
    price: string;
    quantity: string;
    foodImage: {
      url: string;
      filename: string;
      type: string;
      size: number;
    };
    extras?: Array<{
      delika_extras_table_id: string;
      extrasDetails: {
        id: string;
        extrasTitle: string;
        extrasType: string;
        required: boolean;
        extrasDetails: Array<{
          delika_inventory_table_id: string;
          minSelection?: number;
          maxSelection?: number;
          inventoryDetails: Array<{
            id: string;
            foodName: string;
            foodPrice: number;
            foodDescription: string;
          }>;
        }>;
      };
    }>;
  }>;
  orderDate: string | null;
  deliveryPrice: string;
  pickupName: string;
  dropoffName: string;
  totalPrice: string;
  foodAndDeliveryFee: boolean;
  onlyDeliveryFee: boolean;
  payNow: boolean;
  payLater: boolean;
  scheduleDelivery?: {
    scheduleDate: string;
    scheduleTime: string;
    scheduleDateTime: string;
  };
  Walkin: boolean; // Add this line
  payVisaCard: boolean;  // Add this new field
}

// Style the Select component to match LocationInput
const StyledSelect = styled(Select)({
  '& .MuiOutlinedInput-input': {
    padding: '8px 12px',
    fontSize: '14px',
    fontFamily: 'Inter, sans-serif',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: '1px solid rgba(167, 161, 158, 0.15)',
    borderRadius: '8px',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(167, 161, 158, 0.3)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(167, 161, 158, 0.5)',
    borderWidth: '1px',
  },
  backgroundColor: 'white',
});

// Add new type for delivery method
type DeliveryMethod = 'on-demand' | 'full-service' | 'schedule' | 'batch-delivery' | 'walk-in' | null;

// Add this CSS class near your other styled components
const StyledDateInput = styled('input')({
  '&::-webkit-calendar-picker-indicator': {
    display: 'none'
  },
  '&::-webkit-inner-spin-button': {
    display: 'none'
  },
  '&::-webkit-clear-button': {
    display: 'none'
  },
  appearance: 'textfield',
  WebkitAppearance: 'textfield',
  MozAppearance: 'textfield',
});

const PlaceOrder: FunctionComponent<PlaceOrderProps> = ({ onClose, onOrderPlaced, branchId: initialBranchId, showPlaceOrder }): ReactNode => {  
  const { t } = useTranslation();  
  const { addNotification } = useNotifications();

  // Add Selection interface for ExtrasSelectionInline
  interface Selection {
    id: string;
    foodName: string;
    foodPrice: number;
    foodDescription?: string;
    groupTitle?: string;
    groupType?: string;
    required?: boolean;
    minSelection?: number;
    maxSelection?: number;
  }
  const { userProfile, restaurantData } = useUserProfile();
  const { branches, isLoading: branchesLoading } = useBranches(userProfile?.restaurantId ?? null);
  const [selectedBranchId, setSelectedBranchId] = useState(initialBranchId || '');
  const [selectCategoryAnchorEl, setSelectCategoryAnchorEl] = useState<null | HTMLElement>(null);
  const [selectItemAnchorEl, setSelectItemAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedItem, setSelectedItem] = useState<string>("");
  const [isItemsDropdownOpen, setIsItemsDropdownOpen] = useState(false);
  const [deliveryPrice, setDeliveryPrice] = useState<string>("");
  const [totalFoodPrice, setTotalFoodPrice] = useState("0.00");
  const [currentStep, setCurrentStep] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [pickupLocation, setPickupLocation] = useState<LocationData | null>(null);
  const [dropoffLocation, setDropoffLocation] = useState<LocationData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userData, setUserData] = useState<UserResponse | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // Printer state variables
  const [connectedDevice, setConnectedDevice] = useState<{name: string, gatt: any} | null>(null);
  const [printCharacteristic, setPrintCharacteristic] = useState<any | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState(false);
  const [printerConnectionStatus, setPrinterConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [hasShownPrinterModal, setHasShownPrinterModal] = useState(false);
    const {
    categories,
    categoryItems,
    selectedItems,
    setSelectedItems,
    selectedCategory,
    setSelectedCategory,
    addItem,
    updateQuantity,
    removeItem,
    isLoading: isMenuLoading
  } = usePlaceOrderItems(selectedBranchId);

  // Add validation states
  const [isStep1Valid, setIsStep1Valid] = useState(false);
  const [isStep2Valid, setIsStep2Valid] = useState(false);
  const [isStep3Valid, setIsStep3Valid] = useState(false);

  const selectCategoryOpen = Boolean(selectCategoryAnchorEl);
  const selectItemOpen = Boolean(selectItemAnchorEl);

  // Add these loading states near your other state declarations
  const [isPayLaterSubmitting, setIsPayLaterSubmitting] = useState(false);
  const [isPayNowSubmitting, setIsPayNowSubmitting] = useState(false);

  const [pickupData, setPickupData] = useState<any>(null);
  const [dropoffData, setDropoffData] = useState<any>(null);

  // Add new state for delivery method selection
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>(null);

  // Add these new state variables near the top of the component with other state declarations
  const [scheduledDate, setScheduledDate] = useState(() => {
    // Set default to today's date in YYYY-MM-DD format
    return new Date().toISOString().split('T')[0];
  });
  const [scheduledTime, setScheduledTime] = useState('');

  // Replace manual delivery method checks with the centralized version
  const deliveryMethods = getAvailableDeliveryMethods(restaurantData);
  const isOnDemandDisabled = !deliveryMethods.onDemand;
  const isFullServiceDisabled = !deliveryMethods.fullService;

  // First, add the state at the top with other states
  const [orderComment, setOrderComment] = useState<string>('');

  // Add these new state variables at the top with other states
  const [batchId, setBatchId] = useState<string | null>(null);
  const [batchedOrders, setBatchedOrders] = useState<any[]>([]);
  const [showBatchSummary, setShowBatchSummary] = useState(false);

  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);

  // Get WalkIn value with a default if it's undefined (since it's new to the schema)
  const walkInSetting = restaurantData?.WalkIn !== undefined ? restaurantData.WalkIn : true;

  const { autoCalculate, suggestedPrice, showSuggestedPrice } = getDeliveryPriceInfo(restaurantData, distance);

  // Update useEffect for delivery price calculation
  useEffect(() => {
    if (distance !== null && autoCalculate) {
      const calculatedPrice = Math.round(calculateDeliveryFee(distance));
      setDeliveryPrice(`${calculatedPrice}.00`);
    } else if (!autoCalculate) {
      setDeliveryPrice(''); // Clear the price if auto-calculate is disabled
    }
  }, [distance, autoCalculate]);

  // Update the distance section to include suggested price when autoCalculate is false
  const renderDistanceInfo = () => (
    <div className="self-stretch bg-[#f9fafb] rounded-lg p-4 mb-4">
      <div className="text-sm !font-sans">
        <div className="font-medium mb-1 !font-sans">
          Estimated Distance: {distance} km
          {showSuggestedPrice && (
            <div className="text-gray-600 mt-1">
              Suggested Delivery Price: GH₵{suggestedPrice}
            </div>
          )}
        </div>
        <div className="text-gray-500 !font-sans">
          From {pickupLocation?.address} to {dropoffLocation?.address}
        </div>
      </div>
    </div>
  );

  // Add this function to check if delivery price is valid
  const isDeliveryPriceValid = () => {
    if (autoCalculate) return true;
    return deliveryPrice !== '' && parseFloat(deliveryPrice) > 0;
  };

  // Update the delivery price input section
  const renderDeliveryPriceInput = () => (
    <div className="self-stretch flex flex-col items-start justify-start gap-[4px] mb-4">
      {!autoCalculate && deliveryPrice === '' && (
        <div className="text-red-500 text-sm mb-2 font-sans">
          Please enter the delivery price to proceed
        </div>
      )}
      <div className="self-stretch relative leading-[20px] font-sans text-black">Delivery Price</div>
      <div className="self-stretch shadow-[0px_0px_2px_rgba(23,_26,_31,_0.12),_0px_0px_1px_rgba(23,_26,_31,_0.07)] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[1px] px-[0px]">
        <div className="w-[64px] rounded-[6px] bg-[#f6f6f6] border-[#fff] border-[1px] border-solid box-border overflow-hidden shrink-0 flex flex-row items-center justify-center py-[12px] px-[16px]">
          <div className="relative leading-[20px] font-sans">GH₵</div>
        </div>
        <div className="flex-1 rounded-[6px] bg-[#fff] border-[#fff] border-[1px] border-solid flex flex-row items-center justify-start py-[12px] px-[16px] text-[#858a89]">
          <input
            type="text"
            value={deliveryPrice}
            onChange={handleDeliveryPriceChange}
            placeholder={autoCalculate ? '' : 'Enter delivery price'}
            className="w-full bg-transparent border-none outline-none text-[14px] font-sans"
            readOnly={autoCalculate}
          />
        </div>
      </div>
    </div>
  );

  const handleSelectCategoryClick = (event: React.MouseEvent<HTMLElement>) => {
    setSelectCategoryAnchorEl(event.currentTarget);
  };

  const handleSelectCategoryClose = () => {
    setSelectCategoryAnchorEl(null);
  };

  const handleSelectItemClick = (event: React.MouseEvent<HTMLElement>) => {
    setSelectItemAnchorEl(event.currentTarget);
  };

  const handleSelectItemClose = () => {
    setSelectItemAnchorEl(null);
  };

  const onButtonPlaceOrderClick = () => {
    // Add your order placement logic here
    onClose?.();
  };


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isItemsDropdownOpen) {
        const dropdown = document.getElementById('items-dropdown');
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setIsItemsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isItemsDropdownOpen]);

  const handleDeliveryPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDeliveryPrice(value);
    }
  };

  const calculateTotal = () => {
    const itemsTotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryAmount = deliveryPrice ? parseFloat(deliveryPrice) : 0;
    const total = Math.round(itemsTotal + deliveryAmount);
    return `${total}.00`;
  };

  // Printer connection functions
  const checkWebBluetoothSupport = () => {
    return typeof navigator !== 'undefined' && typeof (navigator as any).bluetooth !== 'undefined';
  };

  // Modify the connectToPrinter function to use persistence
  const connectToPrinter = async () => {
    console.log('🖨️ Starting printer connection process...');
    
    if (!checkWebBluetoothSupport()) {
      console.log('❌ Web Bluetooth not supported');
      addNotification({
        type: 'order_status',
        message: 'Web Bluetooth is not supported in this browser'
      });
      return;
    }

    try {
      console.log('🔄 Setting connection status to connecting...');
      setPrinterConnectionStatus('connecting');
      
      // Get last connected printer name
      const lastPrinterName = WebPrinterService.getLastConnectedPrinter();
      console.log('📋 Last connected printer:', lastPrinterName || 'None');
      
      console.log('🔍 Requesting Bluetooth device...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          ...(lastPrinterName ? [{ name: lastPrinterName }] : []),
          { namePrefix: 'MP583' },
          { namePrefix: 'MP-583' },
          { namePrefix: '58MM' },
          { namePrefix: '58mm' },
          { namePrefix: 'Thermal' },
          { namePrefix: 'Printer' },
          { namePrefix: 'DL' },
          { namePrefix: 'Deli' },
          { namePrefix: 'ESC' },
          { namePrefix: 'POS' }
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', 
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
          '0000180f-0000-1000-8000-00805f9b34fb', // Generic Access
          '0000180a-0000-1000-8000-00805f9b34fb'  // Device Information
        ]
      });
      
      console.log('✅ Device selected:', device.name);
      console.log('🔗 Connecting to GATT server...');
      const server = await device.gatt!.connect();
      console.log('✅ GATT server connected');
      
      let service;
      let characteristic;
      
      // Try different service UUIDs for different printer types
      const serviceUUIDs = [
        '000018f0-0000-1000-8000-00805f9b34fb',
        '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        '0000180f-0000-1000-8000-00805f9b34fb',
        '0000180a-0000-1000-8000-00805f9b34fb'
      ];
      
      console.log('🔍 Searching for compatible service...');
      for (const serviceUUID of serviceUUIDs) {
        try {
          console.log(`  Trying service UUID: ${serviceUUID}`);
          service = await server.getPrimaryService(serviceUUID);
          console.log(`✅ Found service: ${serviceUUID}`);
          break;
        } catch (error) {
          console.log(`❌ Service not found: ${serviceUUID}`);
          continue;
        }
      }
      
      if (!service) {
        console.log('❌ No compatible printer service found');
        throw new Error('No compatible printer service found');
      }
      
      // Try different characteristic UUIDs
      const characteristicUUIDs = [
        '00002af1-0000-1000-8000-00805f9b34fb',
        '49535343-8841-43f4-a8d4-ecbe34729bb3',
        '00002a19-0000-1000-8000-00805f9b34fb'
      ];
      
      console.log('🔍 Searching for compatible characteristic...');
      for (const characteristicUUID of characteristicUUIDs) {
        try {
          console.log(`  Trying characteristic UUID: ${characteristicUUID}`);
          characteristic = await service.getCharacteristic(characteristicUUID);
          console.log(`✅ Found characteristic: ${characteristicUUID}`);
          break;
        } catch (error) {
          console.log(`❌ Characteristic not found: ${characteristicUUID}`);
          continue;
        }
      }
      
      if (!characteristic) {
        console.log('❌ No compatible printer characteristic found');
        throw new Error('No compatible printer characteristic found');
      }
      
      console.log('💾 Storing connection details...');
      // Store connection
      setConnectedDevice({ name: device.name || 'Unknown Device', gatt: server });
      setPrintCharacteristic(characteristic);
      setPrinterConnectionStatus('connected');
      setShowPrinterModal(false);
      
      // Save printer connection and detect type
      const printerType = WebPrinterService.detectPrinterType(device.name || '');
      console.log('🔍 Detected printer type:', printerType);
      WebPrinterService.savePrinterConnection(device);
      
      console.log('✅ Printer connection successful!');
      console.log('📊 Connection Summary:');
      console.log('  - Device Name:', device.name);
      console.log('  - Printer Type:', printerType);
      console.log('  - Service UUID:', service.uuid);
      console.log('  - Characteristic UUID:', characteristic.uuid);
      
      addNotification({
        type: 'order_created',
        message: `Connected to ${device.name} (${printerType.toUpperCase()} printer)`
      });
      
    } catch (error) {
      console.log('❌ Printer connection failed:', error);
      setPrinterConnectionStatus('error');
      addNotification({
        type: 'order_status',
        message: 'Failed to connect to printer'
      });
    }
  };

  const disconnectPrinter = () => {
    console.log('🔄 Disconnecting printer...');
    
    if (connectedDevice?.gatt) {
      console.log('🔗 Disconnecting from GATT server...');
      connectedDevice.gatt.disconnect();
      console.log('✅ GATT server disconnected');
    }
    
    console.log('🧹 Clearing connection state...');
    setConnectedDevice(null);
    setPrintCharacteristic(null);
    setPrinterConnectionStatus('disconnected');
    
    console.log('✅ Printer disconnected successfully');
    addNotification({
      type: 'order_status',
      message: 'Printer disconnected'
    });
  };

  const printReceipt = async (orderData: any) => {
    console.log('🖨️ Starting print receipt process...');
    console.log('📄 Receipt data:', orderData);
    
    if (!printCharacteristic) {
      console.log('❌ No printer characteristic available');
      addNotification({
        type: 'order_status',
        message: 'Printer not connected'
      });
      return;
    }

    try {
      console.log('🔍 Getting printer type...');
      const printerType = WebPrinterService.getPrinterType();
      console.log('📋 Printer type:', printerType);
      
      console.log('📝 Generating receipt commands...');
      const success = await WebPrinterService.printReceipt(printCharacteristic, orderData);
      
      if (success) {
        console.log('✅ Receipt printed successfully!');
      addNotification({
        type: 'order_created',
          message: 'Receipt printed successfully'
      });
      } else {
        console.log('❌ Receipt printing failed');
      addNotification({
        type: 'order_status',
        message: 'Failed to print receipt'
        });
      }
    } catch (error) {
      console.log('❌ Print receipt error:', error);
      addNotification({
        type: 'order_status',
        message: 'Error printing receipt'
      });
    }
  };



  // Add automatic printer connection when modal opens for walk-in orders only
  useEffect(() => {
    if (deliveryMethod === 'walk-in' && checkWebBluetoothSupport() && !connectedDevice) {
      console.log('🔄 Auto-connecting to printer for walk-in order...');
      // Auto-connect to printer when walk-in modal opens
      connectToPrinter();
    }
  }, [deliveryMethod, connectedDevice]);

  // Add this handler function
  const handleQuantityChange = (itemName: string, newQuantity: string) => {
    // Convert to number and validate
    const quantity = parseInt(newQuantity);
    if (!isNaN(quantity) && quantity > 0) {
      setSelectedItems(selectedItems.map(item => 
        item.name === itemName 
          ? { ...item, quantity: quantity }
          : item
      ));
    }
  };

  useEffect(() => {
    const total = selectedItems.reduce((sum, item) => {
      return sum + (Number(item.price) * Number(item.quantity));
    }, 0);
    setTotalFoodPrice(`${Math.round(total)}.00`);
    

  }, [selectedItems]);

  // Function to handle next step
  const handleNextStep = () => {
    const { restaurantData } = useUserProfile();
    const isFullServiceEnabled = restaurantData.FullService;

    if (deliveryMethod === 'full-service') {
      if (currentStep === 1) {
        if (!isDeliveryPriceValid()) {
          addNotification({
            type: 'order_status',
            message: 'Please enter a valid delivery price to proceed'
          });
          return;
        }
        setCurrentStep(2);
      } else if (currentStep === 2) {
        if (selectedItems.length === 0) {
          addNotification({
            type: 'order_status',
            message: 'Please select at least one item to proceed'
          });
          return;
        }
        setCurrentStep(3);
      }
    } else if (deliveryMethod === 'schedule' || deliveryMethod === 'batch-delivery') {
      if (currentStep === 1) {
        if (!isDeliveryPriceValid()) {
          addNotification({
            type: 'order_status',
            message: 'Please enter a valid delivery price to proceed'
          });
          return;
        }
        setCurrentStep(isFullServiceEnabled ? 2 : 3);
      } else if (currentStep === 2 && isFullServiceEnabled) {
        if (selectedItems.length === 0) {
          addNotification({
            type: 'order_status',
            message: 'Please select at least one item to proceed'
          });
          return;
        }
        setCurrentStep(3);
      }
    } else {
      if (!isDeliveryPriceValid()) {
        addNotification({
          type: 'order_status',
          message: 'Please enter a valid delivery price to proceed'
        });
        return;
      }
      setCurrentStep(2);
    }
  };

  // Function to handle previous step
  const handlePreviousStep = () => {
    const { restaurantData } = useUserProfile();
    const isFullServiceEnabled = restaurantData.FullService;

    if (currentStep === 3) {
      if (deliveryMethod === 'schedule' || deliveryMethod === 'batch-delivery') {
        // If FullService is false, go back to step 1, otherwise go to step 2
        setCurrentStep(isFullServiceEnabled ? 2 : 1);
      } else {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      setCurrentStep(1);
    }
  };

  // Add useEffect to fetch user data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await getAuthenticatedUser();
        setUserData(response.data);
      } catch (error) {
      }
    };

    fetchUserData();
  }, []);

  // Add this function to generate a 6-digit batch ID
  const generateBatchId = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Add this useEffect to generate batch ID when delivery method is selected
  useEffect(() => {
    if (deliveryMethod === 'batch-delivery' && !currentBatchId) {
      setCurrentBatchId(generateBatchId());
    }
  }, [deliveryMethod]);

  // Update the OrderPayload interface to include extras
  interface OrderPayload {
    restaurantId: string | null;
    branchId: string | null;
    dropOff: Array<{
      toLatitude: string;
      toLongitude: string;
      toAddress: string;
    }>;
    pickup: Array<{
      fromLatitude: string;
      fromLongitude: string;
      fromAddress: string;
    }>;
    customerName: string;
    customerPhoneNumber: string;
    orderNumber: number;
    deliveryDistance: string;
    orderPrice: string;
    trackingUrl: string;
    courierName: string;
    courierPhoneNumber: string;
    orderStatus: string;
    products: Array<{
      name: string;
      price: string;
      quantity: string;
      foodImage: {
        url: string;
        filename: string;
        type: string;
        size: number;
      };
      extras?: Array<{
        delika_extras_table_id: string;
        extrasDetails: {
          id: string;
          extrasTitle: string;
          extrasType: string;
          required: boolean;
          extrasDetails: Array<{
            delika_inventory_table_id: string;
            minSelection?: number;
            maxSelection?: number;
            inventoryDetails: Array<{
              id: string;
              foodName: string;
              foodPrice: number;
              foodDescription: string;
            }>;
          }>;
        };
      }>;
    }>;
    orderDate: string | null;
    deliveryPrice: string;
    pickupName: string;
    dropoffName: string;
    totalPrice: string;
    foodAndDeliveryFee: boolean;
    onlyDeliveryFee: boolean;
    payNow: boolean;
    payLater: boolean;
    scheduleDelivery?: {
      scheduleDate: string;
      scheduleTime: string;
      scheduleDateTime: string;
    };
    Walkin: boolean; // Add this line
    payVisaCard: boolean;  // Add this new field
  }

  // Update the handlePlaceOrder function to format extras correctly
  const handlePlaceOrder = async (paymentType: 'cash' | 'momo' | 'visa') => {
    console.log('🛒 Starting order placement process...');
    console.log('📋 Order details:', {
      deliveryMethod,
      paymentType,
      customerName,
      selectedItems: selectedItems.length,
      totalPrice: calculateTotal()
    });
    
    setIsSubmitting(true);

    try {
      if (!isDeliveryPriceValid()) {
        addNotification({
          type: 'order_status',
          message: 'Please enter a valid delivery price to proceed'
        });
        return;
      }
      
      const formData = new FormData();
      
      // Add products to formData
      selectedItems.forEach((item: SelectedItem, index: number) => {
        formData.append(`products[${index}][name]`, item.name);
        formData.append(`products[${index}][price]`, item.price.toString());
        formData.append(`products[${index}][quantity]`, item.quantity.toString());
        
        if (item.image) {
          formData.append(`products[${index}][foodImage][url]`, item.image);
          formData.append(`products[${index}][foodImage][filename]`, item.name);
          formData.append(`products[${index}][foodImage][type]`, 'image');
          formData.append(`products[${index}][foodImage][size]`, '0');
        }

        // Format extras according to the API's expected structure
        if (item.extras && item.extras.length > 0) {
          item.extras.forEach((extraGroup: SelectedItemExtra, groupIndex: number) => {
            formData.append(
              `products[${index}][extras][${groupIndex}][delika_extras_table_id]`, 
              extraGroup.delika_extras_table_id
            );
            
            // Add the selected items as the inventory details
            const extrasDetails = {
              id: extraGroup.extrasDetails.id,
              extrasTitle: `Extra Group ${groupIndex + 1}`,
              extrasType: 'multiple',
              required: true,
              extrasDetails: extraGroup.extrasDetails.extrasDetails.map(detail => ({
                delika_inventory_table_id: detail.delika_inventory_table_id,
                inventoryDetails: detail.inventoryDetails.map(selection => ({
                  id: selection.id,
                  foodName: selection.foodName,
                  foodPrice: selection.foodPrice,
                  foodDescription: selection.foodDescription || ''
                }))
              }))
            };

            formData.append(
              `products[${index}][extras][${groupIndex}][extrasDetails]`,
              JSON.stringify(extrasDetails)
            );
          });
        }
      });

      // Add other fields to formData
      formData.append('customerName', customerName);
      formData.append('customerPhoneNumber', customerPhone);
      formData.append('restaurantId', userProfile?.restaurantId || '');
      formData.append('branchId', selectedBranchId || userProfile?.branchId || '');
      formData.append('deliveryPrice', deliveryPrice);
      formData.append('pickupName', pickupLocation?.address || '');
      formData.append('dropoffName', dropoffLocation?.address || '');
      formData.append('orderPrice', totalFoodPrice);
      formData.append('totalPrice', calculateTotal());
      formData.append('orderComment', orderComment);
      
      // Set orderStatus based on delivery method and AutoAssign setting
      let orderStatus = 'ReadyForPickup';
      if (deliveryMethod === 'walk-in') {
        orderStatus = 'Delivered';
      } else if (!restaurantData?.AutoAssign && selectedRider) {
        orderStatus = 'Assigned';
      }
      formData.append('orderStatus', orderStatus);

      formData.append('orderDate', new Date().toISOString());
      formData.append('foodAndDeliveryFee', 'true');
      formData.append('deliveryDistance', distance?.toString() || '');
      formData.append('onlyDeliveryFee', 'false');
      formData.append('payNow', (paymentType === 'cash').toString());
      formData.append('payLater', (paymentType === 'momo').toString());
      formData.append('payVisaCard', (paymentType === 'visa').toString());
      formData.append('Walkin', (deliveryMethod === 'walk-in').toString());

      // Add pickup and dropoff locations
      if (pickupLocation) {
        formData.append('pickup[0][fromLatitude]', pickupLocation.latitude.toString());
        formData.append('pickup[0][fromLongitude]', pickupLocation.longitude.toString());
        formData.append('pickup[0][fromAddress]', pickupLocation.address);
      }
      if (dropoffLocation) {
        formData.append('dropOff[0][toLatitude]', dropoffLocation.latitude.toString());
        formData.append('dropOff[0][toLongitude]', dropoffLocation.longitude.toString());
        formData.append('dropOff[0][toAddress]', dropoffLocation.address);
      }

      // Add batch ID if it's a batch delivery
      if (deliveryMethod === 'batch-delivery' && currentBatchId) {
        formData.append('batchID', currentBatchId);
      }

      // Add schedule information if it's a scheduled delivery
      if (deliveryMethod === 'schedule' && scheduledDate && scheduledTime) {
        const scheduleDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
        formData.append('scheduleTime[scheduleDateTime]', scheduleDateTime.toISOString());
      }

      // Handle rider assignment based on AutoAssign setting
      if (restaurantData?.AutoAssign) {
        // If AutoAssign is enabled, don't send courierId
      } else if (selectedRider) {
        // If AutoAssign is disabled and a rider is selected, send the courierId
        formData.append('courierId', selectedRider);
      } else {
        // If AutoAssign is disabled but no rider is selected, show error
        throw new Error(t('orders.error.noRiderSelected'));
      }

      // Use the placeOrder function from api.ts
      const response = await placeOrder(formData);

      if (!response.data) {
        throw new Error(t('orders.error.failedToPlaceOrder'));
      }

      console.log('✅ Order placed successfully via API');

      // If this is a batch delivery, add the order to batchedOrders and show the modal
      if (deliveryMethod === 'batch-delivery') {
        console.log('📦 Processing batch delivery order...');
        const orderData = {
          customerName,
          customerPhoneNumber: customerPhone,
          dropOff: [{
            toAddress: dropoffLocation?.address || ''
          }],
          products: selectedItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          deliveryPrice,
          totalPrice: calculateTotal()
        };
        
        setBatchedOrders(prev => [...prev, orderData]);
        setShowBatchSummary(true);
        
        // Show success notification
        addNotification({
          type: 'order_created',
          message: t('orders.success.batchOrderAdded')
        });
      } else if (deliveryMethod === 'walk-in') {
        console.log('🏪 Processing walk-in order...');
        // For walk-in orders, handle printing
        const orderData = {
          orderNumber: `#${Date.now().toString().slice(-6)}`,
          customerName,
          paymentMethod: paymentType.toUpperCase(),
          items: selectedItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          totalPrice: calculateTotal(),
          restaurantName: userProfile._restaurantTable?.[0]?.restaurantName || 'RESTAURANT'
        };

        console.log('🖨️ Walk-in order data for printing:', orderData);
        console.log('🔗 Printer characteristic available:', !!printCharacteristic);
        console.log('📱 Web Bluetooth supported:', checkWebBluetoothSupport());
        console.log('👁️ Has shown printer modal:', hasShownPrinterModal);

        // Use the same reliable printing logic as test print
        if (printCharacteristic) {
          console.log('🖨️ Printing receipt for walk-in order...');
          try {
            // Call the same printReceipt function that works in test
            await printReceipt(orderData);
            console.log('✅ Receipt printed successfully for walk-in order');
          } catch (error) {
            console.log('❌ Failed to print receipt for walk-in order:', error);
          }
        } else if (!hasShownPrinterModal && checkWebBluetoothSupport()) {
          console.log('📱 Showing printer connection modal for first time...');
          setShowPrinterModal(true);
          setHasShownPrinterModal(true);
        } else {
          console.log('⚠️ No printer characteristic available for walk-in order');
        }

        // Close modal and show success
        onOrderPlaced();
        addNotification({
          type: 'order_created',
          message: t('orders.success.orderPlaced')
        });
      } else {
        console.log('🚚 Processing regular delivery order...');
        // For non-batch orders, close the modal and show success
        onOrderPlaced();
        addNotification({
          type: 'order_created',
          message: t('orders.success.orderPlaced')
        });
      }

    } catch (error) {
      console.log('❌ Order placement failed:', error);
      addNotification({
        type: 'order_status',
        message: error instanceof Error ? error.message : t('orders.error.failedToPlaceOrder')
      });
    } finally {
      setIsSubmitting(false);
    }
  };



  // Add validation effects
  useEffect(() => {
    // Validate Step 1
    const isPhoneValid = customerPhone.length === 10 && /^\d+$/.test(customerPhone);
    const isNameValid = customerName.trim().length > 0;
    const areLocationsValid = pickupLocation !== null && dropoffLocation !== null;
    const isDistanceValid = distance !== null;

    const isValid = isNameValid && isPhoneValid && areLocationsValid && isDistanceValid;
    
    setIsStep1Valid(isValid);
  }, [customerName, customerPhone, pickupLocation, dropoffLocation, distance]);

  useEffect(() => {
    // Validate Step 2
    const hasItems = selectedItems.length > 0;
    const hasDeliveryPrice = deliveryPrice !== '' && parseFloat(deliveryPrice) > 0;
    
    setIsStep2Valid(hasItems && hasDeliveryPrice);
  }, [selectedItems, deliveryPrice]);

  useEffect(() => {
    // Validate Step 3
    const isBasicInfoValid = customerName.trim() !== '' && 
                            customerPhone.length === 10 && 
                            pickupLocation !== null && 
                            dropoffLocation !== null;
    const isPricingValid = selectedItems.length > 0 && 
                          deliveryPrice !== '' && 
                          parseFloat(deliveryPrice) > 0;
    
    setIsStep3Valid(isBasicInfoValid && isPricingValid);
  }, [customerName, customerPhone, pickupLocation, dropoffLocation, selectedItems, deliveryPrice]);

  // Replace the renderStepContent function
  const renderStepContent = () => {
    // Permission checks for each delivery method
    if (deliveryMethod === 'on-demand' && !deliveryMethods.onDemand) {
      setCurrentStep(1);
      setDeliveryMethod(null);
      return renderDeliveryMethodSelection();
    }

    if (deliveryMethod === 'full-service' && !deliveryMethods.fullService) {
      setCurrentStep(1);
      setDeliveryMethod(null);
      return renderDeliveryMethodSelection();
    }

    if (deliveryMethod === 'schedule' && !deliveryMethods.schedule) {
      setCurrentStep(1);
      setDeliveryMethod(null);
      return renderDeliveryMethodSelection();
    }

    if (deliveryMethod === 'batch-delivery' && !deliveryMethods.batchDelivery) {
      setCurrentStep(1);
      setDeliveryMethod(null);
      return renderDeliveryMethodSelection();
    }

    if (deliveryMethod === 'walk-in' && !deliveryMethods.walkIn) {
      setCurrentStep(1);
      setDeliveryMethod(null);
      return renderDeliveryMethodSelection();
    }

    // If permissions are valid, render the appropriate content
    switch (deliveryMethod) {
      case 'on-demand':
        return (
          <OnDemandContent
            currentStep={currentStep}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            selectedBranchId={selectedBranchId}
            setSelectedBranchId={setSelectedBranchId}
            branches={branches}
            userProfile={userProfile}
            handlePickupLocationSelect={handlePickupLocationSelect}
            handleDropoffLocationSelect={handleDropoffLocationSelect}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            distance={distance}
            handleBackToDeliveryType={handleBackToDeliveryType}
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
            isDeliveryPriceValid={isDeliveryPriceValid}
            handlePlaceOrder={handlePlaceOrder}
            isSubmitting={isSubmitting}
            deliveryPrice={deliveryPrice}
            totalFoodPrice={totalFoodPrice}
            calculateTotal={calculateTotal}
            renderDistanceInfo={renderDistanceInfo}
            renderDeliveryPriceInput={renderDeliveryPriceInput}
            renderRiderSelection={renderRiderSelection}
            orderComment={orderComment}
            setOrderComment={setOrderComment}
          />
        );
      case 'full-service':
        return (
          <FullServiceContent
            currentStep={currentStep}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            selectedBranchId={selectedBranchId}
            setSelectedBranchId={setSelectedBranchId}
            branches={branches}
            userProfile={userProfile}
            handlePickupLocationSelect={handlePickupLocationSelect}
            handleDropoffLocationSelect={handleDropoffLocationSelect}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            distance={distance}
            handleBackToDeliveryType={handleBackToDeliveryType}
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
            isDeliveryPriceValid={isDeliveryPriceValid}
            handlePlaceOrder={handlePlaceOrder}
            isSubmitting={isSubmitting}
            deliveryPrice={deliveryPrice}
            totalFoodPrice={totalFoodPrice}
            calculateTotal={calculateTotal}
            renderDistanceInfo={renderDistanceInfo}
            renderDeliveryPriceInput={renderDeliveryPriceInput}
            renderRiderSelection={renderRiderSelection}
            orderComment={orderComment}
            setOrderComment={setOrderComment}
            selectedItems={selectedItems}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
            categoryItems={categoryItems}
            renderEnhancedMenuSelection={renderEnhancedMenuSelection}
          />
        );
      case 'schedule':
        return (
          <ScheduleContent
            currentStep={currentStep}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            selectedBranchId={selectedBranchId}
            setSelectedBranchId={setSelectedBranchId}
            branches={branches}
            userProfile={userProfile}
            handlePickupLocationSelect={handlePickupLocationSelect}
            handleDropoffLocationSelect={handleDropoffLocationSelect}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            distance={distance}
            handleBackToDeliveryType={handleBackToDeliveryType}
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
            isDeliveryPriceValid={isDeliveryPriceValid}
            handlePlaceOrder={handlePlaceOrder}
            isSubmitting={isSubmitting}
            deliveryPrice={deliveryPrice}
            totalFoodPrice={totalFoodPrice}
            calculateTotal={calculateTotal}
            renderDistanceInfo={renderDistanceInfo}
            renderDeliveryPriceInput={renderDeliveryPriceInput}
            renderRiderSelection={renderRiderSelection}
            orderComment={orderComment}
            setOrderComment={setOrderComment}
            selectedItems={selectedItems}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
            categoryItems={categoryItems}
            renderEnhancedMenuSelection={renderEnhancedMenuSelection}
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
            handleDateChange={handleDateChange}
            setScheduledTime={setScheduledTime}
          />
        );
      case 'batch-delivery':
        return (
          <BatchContent
            currentStep={currentStep}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            selectedBranchId={selectedBranchId}
            setSelectedBranchId={setSelectedBranchId}
            branches={branches}
            userProfile={userProfile}
            handlePickupLocationSelect={handlePickupLocationSelect}
            handleDropoffLocationSelect={handleDropoffLocationSelect}
            pickupLocation={pickupLocation}
            dropoffLocation={dropoffLocation}
            distance={distance}
            handleBackToDeliveryType={handleBackToDeliveryType}
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
            isDeliveryPriceValid={isDeliveryPriceValid}
            handlePlaceOrder={handlePlaceOrder}
            isSubmitting={isSubmitting}
            deliveryPrice={deliveryPrice}
            totalFoodPrice={totalFoodPrice}
            calculateTotal={calculateTotal}
            renderDistanceInfo={renderDistanceInfo}
            renderDeliveryPriceInput={renderDeliveryPriceInput}
            renderRiderSelection={renderRiderSelection}
            orderComment={orderComment}
            setOrderComment={setOrderComment}
            selectedItems={selectedItems}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
            categoryItems={categoryItems}
            renderEnhancedMenuSelection={renderEnhancedMenuSelection}
            currentBatchId={currentBatchId}
            handleAddAnotherOrder={handleAddAnotherOrder}
            handleCompleteBatch={handleCompleteBatch}
          />
        );
      case 'walk-in':
        return (
          <WalkInContent
            currentStep={currentStep}
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            handleBackToDeliveryType={handleBackToDeliveryType}
            handleNextStep={handleNextStep}
            handlePreviousStep={handlePreviousStep}
            handlePlaceOrder={handlePlaceOrder}
            isSubmitting={isSubmitting}
            totalFoodPrice={totalFoodPrice}
            calculateTotal={calculateTotal}
            orderComment={orderComment}
            setOrderComment={setOrderComment}
            selectedItems={selectedItems}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
            categoryItems={categoryItems}
            renderEnhancedMenuSelection={renderEnhancedMenuSelection}
            showPrinterModal={showPrinterModal}
            setShowPrinterModal={setShowPrinterModal}
            printerConnectionStatus={printerConnectionStatus}
            connectToPrinter={connectToPrinter}
            disconnectPrinter={disconnectPrinter}
            connectedDevice={connectedDevice}
            updateItemWithExtras={updateItemWithExtras}
          />
        );
      default:
        setCurrentStep(1);
        return renderDeliveryMethodSelection();
    }
  };

  const handlePickupLocationSelect = (location: LocationData) => {
    setPickupLocation(location);
  };

  const handleDropoffLocationSelect = async (location: LocationData) => {
    setDropoffLocation(location);
    // Only run calculation if pickupLocation is set and not already calculated for this dropoff
    if (pickupLocation && location && !hasCalculatedDelivery) {
      try {
        setHasCalculatedDelivery(true);
        const result = await calculateDeliveryPriceAPI({
          pickup: {
            fromLongitude: pickupLocation.longitude,
            fromLatitude: pickupLocation.latitude
          },
          dropOff: {
            toLongitude: location.longitude,
            toLatitude: location.latitude
          },
          rider: false,
          pedestrian: false
        });
        setDeliveryPrice(result.riderFee.toString());
        setDistance(result.distance);
      } catch (err) {
        setDeliveryPrice('');
        setDistance(null);
      }
    }
  };

  useEffect(() => {
    if (pickupLocation && dropoffLocation) {
      const calculatedDistance = calculateDistance(
        pickupLocation.latitude,
        pickupLocation.longitude,
        dropoffLocation.latitude,
        dropoffLocation.longitude
      );
      setDistance(calculatedDistance);
    } else {
      setDistance(null);
    }
  }, [pickupLocation, dropoffLocation]);

  // Add this delete handler function near your other handlers
  const handleDeleteItem = (itemName: string, itemPrice?: number) => {
    setSelectedItems(selectedItems.filter(item => 
      !(item.name === itemName && (itemPrice === undefined || item.price === itemPrice))
    ));
  };

  useEffect(() => {
    const userProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');

    if (userProfile.branchesTable) {
      const location = {
        longitude: parseFloat(userProfile.branchesTable.branchLongitude),
        latitude: parseFloat(userProfile.branchesTable.branchLatitude),
        name: userProfile.branchesTable.branchName,
        address: userProfile.branchesTable.branchLocation
      };
      setPickupLocation(location);
    }
  }, []);

  const pickupPrefillData = userProfile.branchesTable ? {
    longitude: parseFloat(userProfile.branchesTable.branchLongitude),
    latitude: parseFloat(userProfile.branchesTable.branchLatitude),
    name: userProfile.branchesTable.branchName,
    address: userProfile.branchesTable.branchLocation
  } : undefined;

  // Update useEffect to handle branch data based on user role
  useEffect(() => {
    if (userProfile) {
      if (userProfile.role === 'Admin') {
        // For Admin users, use the selected branch
        if (selectedBranchId) {
          const selectedBranch = branches.find(branch => branch.id === selectedBranchId);
          if (selectedBranch) {
            setPickupData({
              fromLatitude: selectedBranch.branchLatitude,
              fromLongitude: selectedBranch.branchLongitude,
              fromAddress: selectedBranch.branchLocation,
              branchId: selectedBranch.id
            });
            handlePickupLocationSelect({
              address: selectedBranch.branchLocation,
              latitude: parseFloat(selectedBranch.branchLatitude),
              longitude: parseFloat(selectedBranch.branchLongitude),
              name: selectedBranch.branchName
            });
          }
        }
      } else {
        // For non-Admin users, use the branch from userProfile
        if (userProfile.branchesTable) {
          setPickupData({
            fromLatitude: userProfile.branchesTable.branchLatitude,
            fromLongitude: userProfile.branchesTable.branchLongitude,
            fromAddress: userProfile.branchesTable.branchLocation,
            branchId: userProfile.branchesTable.id
          });
          handlePickupLocationSelect({
            address: userProfile.branchesTable.branchLocation,
            latitude: parseFloat(userProfile.branchesTable.branchLatitude),
            longitude: parseFloat(userProfile.branchesTable.branchLongitude),
            name: userProfile.branchesTable.branchName
          });
        }
      }
    }
  }, [userProfile, selectedBranchId, branches]);

  // Replace the branch selection section with this:
  const renderBranchSelection = () => {
    if (userProfile?.role === 'Admin') {
      return (
        <div className="w-full">
          <div className="text-[12px] leading-[20px] font-sans text-[#535353] mb-1">
            Select Branch for Pickup
          </div>
          <StyledSelect
            fullWidth
            value={selectedBranchId}
            onChange={(event: SelectChangeEvent<unknown>, child: React.ReactNode) => {
              const selectedId = event.target.value as string;
              setSelectedBranchId(selectedId);
              
              // Find selected branch
              const selectedBranch = branches.find(branch => branch.id === selectedId);
              if (selectedBranch) {
                setPickupData({
                  fromLatitude: selectedBranch.branchLatitude,
                  fromLongitude: selectedBranch.branchLongitude,
                  fromAddress: selectedBranch.branchLocation,
                  branchId: selectedBranch.id
                });
                // Update pickup location for distance calculation
                handlePickupLocationSelect({
                  address: selectedBranch.branchLocation,
                  latitude: parseFloat(selectedBranch.branchLatitude),
                  longitude: parseFloat(selectedBranch.branchLongitude),
                  name: selectedBranch.branchName
                });
              }
            }}
            variant="outlined"
            size="small"
            className="mb-2"
          >
            {branches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>
                {branch.branchName} - {branch.branchLocation}
              </MenuItem>
            ))}
          </StyledSelect>
        </div>
      );
    } else if (userProfile?.branchesTable) {
      return (
        <div className="w-full">
          <div className="text-[12px] leading-[20px] font-sans text-[#535353] mb-1">
            Pickup Branch
          </div>
          <div className="p-2 bg-gray-50 rounded-md text-sm font-sans">
            {userProfile.branchesTable.branchName} - {userProfile.branchesTable.branchLocation}
          </div>
        </div>
      );
    }
    return null;
  };

  // Modify the handleDeliveryMethodSelect function
  const handleDeliveryMethodSelect = (method: DeliveryMethod) => {
    setDeliveryMethod(method);
    
    // Initialize specific data based on delivery method
    switch (method) {
      case 'batch-delivery':
        // Generate a new batch ID when batch delivery is selected
        const newBatchId = generateBatchId();
        setCurrentBatchId(newBatchId);
        setBatchedOrders([]); // Reset batched orders
        break;
        
      case 'schedule':
        // Initialize schedule with default values
        setScheduledDate(new Date().toISOString().split('T')[0]);
        setScheduledTime('');
        break;
        
      case 'walk-in':
        // Walk-in orders are handled in handlePlaceOrder
        break;

      case 'full-service':
        // Initialize full service specific states
        setCurrentBatchId(null);
        setBatchedOrders([]);
        setScheduledDate('');
        setScheduledTime('');
        break;
        
      default:
        // Reset any delivery-specific states
        setCurrentBatchId(null);
        setBatchedOrders([]);
        setScheduledDate('');
        setScheduledTime('');
    }
    
    // Reset form fields
    setCustomerName('');
    setCustomerPhone('');
    setSelectedItems([]);
    setDeliveryPrice('');
    setOrderComment('');
    setCurrentStep(1);
  };

  // Add this function to handle date changes with validation
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    const today = new Date().toISOString().split('T')[0];
    
    // Only allow dates from today onwards
    if (selectedDate >= today) {
      setScheduledDate(selectedDate);
    }
  };

  // When submitting the order, you can create the timestamp like this:
  const getScheduledTimestamp = () => {
    if (scheduledDate && scheduledTime) {
      const [hours, minutes] = scheduledTime.split(':');
      const scheduleDateTime = new Date(scheduledDate);
      scheduleDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
      return scheduleDateTime.getTime(); // Returns timestamp in milliseconds
    }
    return null;
  };

  const handleAddItem = (item: MenuItemData) => {
    // Always add the item immediately, regardless of extras
      const newItem: SelectedItem = {
        name: item.name,
        quantity: 1,
        price: Number(item.price),
        image: item.foodImage?.url || '',
        extras: []
      };
      setSelectedItems(prev => [...prev, newItem]);
    
    // Note: Extras display is now handled in the onClick handler
  };

  // Add new state for extras selection
  const [showSelectExtrasModal, setShowSelectExtrasModal] = useState(false);
  const [selectedItemForExtras, setSelectedItemForExtras] = useState<MenuItemData | null>(null);
  const [selectedItemForExtrasDisplay, setSelectedItemForExtrasDisplay] = useState<MenuItemData | null>(null);

  // Add new function to handle extras confirmation
  const handleExtrasConfirm = (selectedExtras: { [key: string]: any[] }) => {
    if (!selectedItemForExtrasDisplay) return;

    // First, remove any existing extras for this main item
    setSelectedItems(prev => {
      const filteredItems = prev.filter(item => {
        // Keep the main item and remove any existing extras for this item
        if (item.name === selectedItemForExtrasDisplay.name) {
          return true; // Keep the main item
        }
        // Remove any extras that belong to this main item
        if (item.name.startsWith(`${selectedItemForExtrasDisplay.name} - `)) {
          return false; // Remove existing extras
        }
        return true; // Keep other items
      });
      return filteredItems;
    });

    // Then add the new selections as separate line items
    Object.entries(selectedExtras).forEach(([groupId, selections]) => {
      const extraGroup = selectedItemForExtrasDisplay.extras?.find(e => e.delika_extras_table_id === groupId);
      if (!extraGroup) return;

      selections.forEach(selection => {
        const extraItem: SelectedItem = {
          name: `${selectedItemForExtrasDisplay.name} - ${selection.foodName}`,
      quantity: 1,
          price: Number(selection.foodPrice),
      image: selectedItemForExtrasDisplay.foodImage?.url || '',
          extras: []
        };
        setSelectedItems(prev => [...prev, extraItem]);
      });
    });
  };

  // Add a function to update items with extras for WalkInContent
  const updateItemWithExtras = (itemName: string, extras: SelectedItemExtra[], extrasCost: number) => {
    setSelectedItems(prev => {
      const existingItemIndex = prev.findIndex(item => item.name === itemName);
      
      if (existingItemIndex !== -1) {
        // Update existing item with extras
        const updatedItems = [...prev];
        const originalItem = updatedItems[existingItemIndex];
        updatedItems[existingItemIndex] = {
          ...originalItem,
          price: originalItem.price + extrasCost,
          extras: extras
        };
        return updatedItems;
      }
      return prev; // If item doesn't exist, don't do anything
    });
  };

  // Add these functions inside the PlaceOrder component
  const handleAddAnotherOrder = () => {
    // Add check for maximum orders
    if (batchedOrders.length >= 5) {
      addNotification({
        type: 'order_status',
        message: 'Maximum limit of 5 orders per batch reached'
      });
      return;
    }

    // Reset form fields but keep the batch ID
    setCustomerName('');
    setCustomerPhone('');
    setPickupLocation(null);
    setDropoffLocation(null);
    setSelectedItems([]);
    setOrderComment('');
    setDeliveryPrice("0");
    setDistance(0);
    
    // Hide the summary modal
    setShowBatchSummary(false);
    
    // Reset to step 1
    setCurrentStep(1);
  };

  const handleCompleteBatch = () => {
    // Clear batch-related states for next batch
    setCurrentBatchId(null);
    setBatchedOrders([]);
    setShowBatchSummary(false);
    onClose();
    
    addNotification({
      type: 'system',
      message: t('orders.success.batchCompleted')
    });
  };

  // Add new function to reset form state
  const resetFormState = () => {
    setCustomerName('');
    setCustomerPhone('');
    setPickupLocation(null);
    setDropoffLocation(null);
    setSelectedItems([]);
    setDeliveryPrice('');
    setTotalFoodPrice('0.00');
    setCurrentStep(1);
    setOrderComment('');
    setDistance(null);
    setSelectedCategory('');
    setSelectedItem('');
    setBatchId(null);
    setBatchedOrders([]);
  };

  // Add function to handle back to delivery type selection
  const handleBackToDeliveryType = () => {
    setDeliveryMethod(null);
    resetFormState();
  };

  // New enhanced menu selection component
  const renderEnhancedMenuSelection = () => {
    return (
      <>
        {/* Category Selection */}
        <div className="mb-6">
          <div className="text-lg font-semibold mb-4 font-sans">Select Category</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => {
                  setSelectedItemForExtrasDisplay(null); // Clear extras selection if used
                  setSelectedCategory(category.value); // Use value (ID), not label
                }}
                className={`p-4 rounded-lg border-2 transition-all font-sans text-sm font-medium ${
                  selectedCategory === category.value
                    ? 'border-[#fd683e] bg-[#fff5f3] text-[#fd683e]'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        {/* Items Grid - Only show when category is selected */}
        {selectedCategory && (
          <div className="mb-6">
            <div className="text-lg font-semibold mb-4 font-sans">
              Select Items from {categories.find(cat => cat.value === selectedCategory)?.label || ''}
            </div>
            {/* Two-row horizontal scrolling grid with placeholder for odd items */}
            <div className="overflow-x-auto pb-2">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2" style={{ minWidth: 'min-content' }}>
                {(() => {
                  // Show ALL items without deduplication as requested by user
                  const allItems = categoryItems;
                  
                  const sortedItems = allItems.sort((a, b) => a.name.localeCompare(b.name));
                  const cards = sortedItems.map((item) => {
                    // Use both name and price to identify unique items
                    const isSelected = selectedItems.some(selected => 
                      selected.name === item.name && Math.abs(Number(selected.price) - Number(item.price)) < 0.01
                    );
                    return (
                      <Card
                        key={`${item.name}-${item.price}`}
                        className={`cursor-pointer w-[220px] relative ${!item.available ? 'grayscale opacity-60' : ''} ${isSelected ? 'border-2 border-[#fd683e]' : ''}`}
                        onClick={() => {
                          if (item.available) {
                            if (isSelected) {
                              setSelectedItems(prev => prev.filter(i => 
                                !(i.name === item.name && Math.abs(Number(i.price) - Number(item.price)) < 0.01)
                              ));
                              setSelectedItemForExtrasDisplay(null);
                            } else {
                              handleAddItem(item);
                              // Update extras display for the newly selected item
                              if (item.extras && item.extras.length > 0) {
                                setSelectedItemForExtrasDisplay(item);
                              } else {
                                setSelectedItemForExtrasDisplay(null);
                              }
                            }
                          }
                        }}
                      >
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-[#fd683e] rounded-full p-0.5">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <CardContent className="p-3">
                          <div className="flex items-center gap-2">
                            {/* Product Image */}
                            <div className={`w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 ${!item.available ? 'grayscale' : ''}`}>
                              {item.foodImage?.url || item.image ? (
                                <img
                                  src={item.foodImage?.url || item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-food.png';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <span className="text-[10px]">No Image</span>
                                </div>
                              )}
                            </div>
                            {/* Product Info */}
                            <div className="flex flex-col h-full">
                              <div className="flex-1">
                                <h3 className="font-medium text-xs font-sans text-gray-900 break-words leading-tight">
                                  {item.name}
                                </h3>
                              </div>
                              {/* Price */}
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-xs font-sans text-gray-900 font-semibold">
                                  GH₵ {item.price}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  });
                  return isMenuLoading ? (
                    <div className="col-span-full text-center py-8 text-gray-400 font-sans">Loading items...</div>
                  ) : (
                    cards
                  );
                })()}
              </div>
            </div>
            {categoryItems.length === 0 && (
              <div className="text-center py-8 text-gray-500 font-sans">
                No items available in this category
              </div>
            )}
          </div>
        )}

        {/* Extras Selection - Only show when an item with extras is selected for display */}
        {selectedItemForExtrasDisplay && selectedItemForExtrasDisplay.extras && selectedItemForExtrasDisplay.extras.length > 0 && (
          <div className="mb-6 p-4 border-2 border-[#fd683e] bg-[#fff5f3] rounded-lg">
            <div className="text-lg font-semibold mb-4 font-sans text-[#fd683e]">
              Select Extras for {selectedItemForExtrasDisplay.name}
            </div>
            <ExtrasSelectionInline
              extras={selectedItemForExtrasDisplay.extras}
              existingSelections={(() => {
                // Get existing selections for this item from selectedItems
                // Look for separate line items that start with the main item name
                const existingExtras = selectedItems.filter(item => 
                  item.name.startsWith(`${selectedItemForExtrasDisplay.name} - `)
                );
                
                if (existingExtras.length === 0) return {};
                
                // Convert existing extras back to the format expected by ExtrasSelectionInline
                const existingSelections: { [key: string]: Selection[] } = {};
                
                existingExtras.forEach(extraItem => {
                  // Extract the extra name from "MainItem - ExtraName"
                  const extraName = extraItem.name.replace(`${selectedItemForExtrasDisplay.name} - `, '');
                  
                  // Find the corresponding extra group and item
                  selectedItemForExtrasDisplay.extras?.forEach(extraGroup => {
                    extraGroup.extrasDetails.extrasDetails.forEach(detail => {
                      const matchingItem = detail.inventoryDetails.find(item => 
                        item.foodName === extraName
                      );
                      
                      if (matchingItem) {
                        const groupId = extraGroup.delika_extras_table_id;
                        if (!existingSelections[groupId]) {
                          existingSelections[groupId] = [];
                        }
                        existingSelections[groupId].push({
                          id: matchingItem.id,
                          foodName: matchingItem.foodName,
                          foodPrice: matchingItem.foodPrice,
                          foodDescription: matchingItem.foodDescription || '',
                          groupTitle: extraGroup.extrasDetails.extrasTitle,
                          groupType: extraGroup.extrasDetails.extrasType,
                          required: extraGroup.extrasDetails.required,
                          minSelection: detail.minSelection,
                          maxSelection: detail.maxSelection
                        });
                      }
                    });
                  });
                });
                
                return existingSelections;
              })()}
              onConfirm={(selectedExtras) => {
                handleExtrasConfirm(selectedExtras);
              }}
              itemName={selectedItemForExtrasDisplay.name}
            />
          </div>
        )}
      </>
    );
  };

  const isWalkInValid = () => {
    return (
        customerName.trim() !== '' &&
        customerPhone.length === 10 &&
        selectedItems.length > 0
    );
};

  const renderDeliveryMethodSelection = () => {    return (      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">        {/* Only show On-Demand if walkInSetting is true */}        {walkInSetting && (          <div             className="flex flex-col items-center p-6 bg-[#FFF5F3] rounded-lg relative cursor-pointer hover:bg-[#FFE5E0] transition-colors"            onClick={() => handleDeliveryMethodSelect('on-demand')}          >            <h3 className="text-lg font-medium text-[#333]">On Demand Delivery</h3>            <p className="text-sm text-gray-600 mt-2 text-center">Immediate delivery service</p>          </div>        )}                {/* Other delivery options like schedule, batch, full-service */}        <div           className="flex flex-col items-center p-6 bg-[#FFF5F3] rounded-lg relative cursor-pointer hover:bg-[#FFE5E0] transition-colors"          onClick={() => handleDeliveryMethodSelect('full-service')}        >          <h3 className="text-lg font-medium text-[#333]">Full Service Delivery</h3>          <p className="text-sm text-gray-600 mt-2 text-center">Complete delivery service with menu selection</p>        </div>                <div           className="flex flex-col items-center p-6 bg-[#FFF5F3] rounded-lg relative cursor-pointer hover:bg-[#FFE5E0] transition-colors"          onClick={() => handleDeliveryMethodSelect('schedule')}        >          <h3 className="text-lg font-medium text-[#333]">Schedule Delivery</h3>          <p className="text-sm text-gray-600 mt-2 text-center">Schedule delivery for later</p>        </div>                {/* Show Walk-In regardless of WalkIn setting */}        <div           className="flex flex-col items-center p-6 bg-[#FFF5F3] rounded-lg relative cursor-pointer hover:bg-[#FFE5E0] transition-colors"          onClick={() => handleDeliveryMethodSelect('walk-in')}         >          <h3 className="text-lg font-medium text-[#333]">Walk-In Service</h3>          <p className="text-sm text-gray-600 mt-2 text-center">In-store dining or takeout</p>        </div>      </div>    );  };

  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedRider, setSelectedRider] = useState<string>('');
  const [isLoadingRiders, setIsLoadingRiders] = useState(false);

  // Update useEffect to fetch riders when component mounts
  useEffect(() => {
    const fetchRiders = async () => {
      // Use the active branch ID instead of branch name
      const activeBranchId = selectedBranchId || userProfile?.branchId;
      if (!activeBranchId) return;

      try {
        setIsLoadingRiders(true);
        const response = await getRidersByBranch(activeBranchId);
        if (response.data) {
          setRiders(response.data);
        }
      } catch (err) {
        addNotification({
          type: 'order_status',
          message: 'Failed to fetch riders. Please try again.'
        });
      } finally {
        setIsLoadingRiders(false);
      }
    };

    // Only fetch riders if AutoAssign is false
    if (restaurantData && !restaurantData.AutoAssign) {
      fetchRiders();
    }
  }, [selectedBranchId, userProfile?.branchId, restaurantData?.AutoAssign]);

  // Update renderRiderSelection to handle loading state
  const renderRiderSelection = () => {
    // Only show rider selection when AutoAssign is false
    if (restaurantData?.AutoAssign) {
      return null;
    }


    return (
      <div className="self-stretch flex flex-col items-start justify-start gap-[4px] mb-4">
        <div className="self-stretch relative leading-[20px] font-sans text-black">Assign Rider</div>
        <select
          className="font-sans border-[#efefef] border-[1px] border-solid [outline:none] 
                    text-[12px] bg-[#fff] self-stretch rounded-[3px] overflow-hidden 
                    flex flex-row items-center justify-start py-[10px] px-[12px]"
          value={riders.find(r => r.userTable?.id === selectedRider || r.userId === selectedRider)?.id || ''}
          onChange={handleRiderSelect}
          disabled={isLoadingRiders}
        >
          <option value="">
            {isLoadingRiders ? 'Loading riders...' : 'Select a rider'}
          </option>
          {riders.map((rider) => (
            <option key={rider.id} value={rider.id}>
              {rider.userTable?.fullName || rider.fullName || 'N/A'} - {rider.userTable?.phoneNumber || rider.phoneNumber || 'N/A'}
            </option>
          ))}
        </select>
        {!isLoadingRiders && riders.length === 0 && (
          <div className="text-[12px] text-red-500 mt-1">
            No riders available for this branch
          </div>
        )}
      </div>
    );
  };

  // Update the rider selection handler to store userId instead of rider id
  const handleRiderSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const riderId = e.target.value;
    
    // Find the selected rider's userId from the riders array
    const selectedRiderData = riders.find(rider => rider.id === riderId);
    const userId = selectedRiderData?.userTable?.id || selectedRiderData?.userId || '';
    
    setSelectedRider(userId);
  };

  const [hasCalculatedDelivery, setHasCalculatedDelivery] = useState(false);

  // Reset hasCalculatedDelivery when pickup or dropoff changes
  useEffect(() => {
    setHasCalculatedDelivery(false);
  }, [pickupLocation]);

  // Printer Connection Modal Component
  const renderPrinterModal = () => {
    if (!showPrinterModal) return null;

    const currentPrinterType = WebPrinterService.getPrinterType();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">🖨️ Connect to Printer</h2>
            <button
              onClick={() => setShowPrinterModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <IoIosCloseCircleOutline size={24} />
            </button>
          </div>
          
          <div className="mb-4">
            <div className={`p-3 rounded-lg mb-4 ${
              printerConnectionStatus === 'connected' 
                ? 'bg-green-100 text-green-800' 
                : printerConnectionStatus === 'connecting'
                ? 'bg-blue-100 text-blue-800'
                : printerConnectionStatus === 'error'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {printerConnectionStatus === 'connected' && connectedDevice && (
                <div>
                <span>✅ Connected to {connectedDevice.name}</span>
                  <div className="text-sm mt-1">
                    Type: {currentPrinterType.toUpperCase()} Printer
                  </div>
                </div>
              )}
              {printerConnectionStatus === 'connecting' && (
                <span>🔄 Connecting to printer...</span>
              )}
              {printerConnectionStatus === 'error' && (
                <span>❌ Failed to connect to printer</span>
              )}
              {printerConnectionStatus === 'disconnected' && (
                <span>📱 Ready to connect to printer</span>
              )}
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
              Connect to a thermal printer to automatically print receipts for walk-in orders.
            </p>
              <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                <strong>Supported Printers:</strong>
                <ul className="mt-1 space-y-1">
                  <li>• TSPL Printers (DL, Deli, etc.)</li>
                  <li>• ESC/POS Printers (MP583, 58mm, etc.)</li>
                  <li>• Generic Thermal Receipt Printers</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            {printerConnectionStatus !== 'connected' ? (
              <button
                onClick={connectToPrinter}
                disabled={printerConnectionStatus === 'connecting'}
                className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                  printerConnectionStatus === 'connecting'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {printerConnectionStatus === 'connecting' ? 'Connecting...' : 'Connect Printer'}
              </button>
            ) : (
              <button
                onClick={disconnectPrinter}
                className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
              >
                Disconnect
              </button>
            )}
            
            <button
              onClick={() => setShowPrinterModal(false)}
              className="flex-1 py-2 px-4 bg-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-400"
            >
              Skip
            </button>
          </div>

          <div className="mt-4 text-xs text-gray-500">
            <p><strong>Supported browsers:</strong> Chrome 56+, Edge 79+, Opera 43+</p>
            <p className="mt-1"><strong>Note:</strong> Printer type is automatically detected based on device name.</p>
          </div>
        </div>
      </div>
    );
  };

  // Add this near other state declarations at the top of PlaceOrder
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);

  // Add these effects after state declarations
  useEffect(() => {
    if (selectedCategory) {
      setIsCategoryLoading(true);
    }
  }, [selectedCategory]);

  useEffect(() => {
    setIsCategoryLoading(false);
  }, [categoryItems]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-10 rounded-lg relative flex flex-col overflow-y-auto max-h-[90vh] w-full sm:w-[900px] mx-4 sm:mx-0">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 bg-transparent z-50"
        >
          <IoIosCloseCircleOutline className="w-8 h-8" />
        </button>
        {!deliveryMethod ? (
          <ServiceTypeModal
            onSelect={handleDeliveryMethodSelect}
            onClose={onClose}
            deliveryMethods={{
              onDemand: !!deliveryMethods.onDemand,
              fullService: !!deliveryMethods.fullService,
              schedule: !!deliveryMethods.schedule,
              batchDelivery: !!deliveryMethods.batchDelivery,
              walkIn: !!deliveryMethods.walkIn,
            }}
          />
        ) : (
          <>
            {renderStepContent()}
          </>
        )}

        <BatchSummaryModal
          open={showBatchSummary}
          orders={batchedOrders}
          batchId={batchId || ''}
          onAddAnother={handleAddAnotherOrder}
          onComplete={handleCompleteBatch}
        />
        {renderPrinterModal()}
      </div>
    </div>
  );
};

export default PlaceOrder;