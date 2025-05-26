import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  SelectChangeEvent,
  TextField,
  IconButton,
  Box,
  Typography,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardActions,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import { api } from '@/services/api';
import { useUserProfile } from '../hooks/useUserProfile';
// Option type for dropdowns
type Option = { label: string; value: string };

export interface Extra {
  id: string;
  variant: string;
  title: string;
}

export interface ExtraGroup {
  id: string;
  title: string;
  extras: Extra[];
}

interface AddExtrasModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (groups: ExtraGroup[]) => void;
}

interface FoodItem {
  foodType: string;
  foodName: string;
  foodPrice: string;
  restaurantName: string;
}

const steps = ['Enter extras title', 'Add extras', 'Review extras'];

const AddExtrasModal: React.FC<AddExtrasModalProps> = ({
  open,
  onClose,
  onAdd,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [groupTitle, setGroupTitle] = useState('');
  const [variant, setVariant] = useState('');
  const [extraGroups, setExtraGroups] = useState<ExtraGroup[]>([]);
  const [currentGroup, setCurrentGroup] = useState<ExtraGroup | null>(null);
  const [foodTypes, setFoodTypes] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  const { restaurantData } = useUserProfile();

  useEffect(() => {
    const fetchFoodTypes = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://api-server.krontiva.africa/api:uEBBwbSs/delika_inventory_table');
        const data = response.data as FoodItem[];
        
        // Filter for restaurant ID and get unique food types
        const filteredData = data.filter(item => 
          item.restaurantName === restaurantData.id
        );
        
        // Get unique food types and create options
        const uniqueFoodTypes = Array.from(new Set(filteredData.map(item => item.foodName)))
          .map(type => ({
            label: type,
            value: type
          }));
        
        setFoodTypes(uniqueFoodTypes);
      } catch (error) {
        console.error('Error fetching food types:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchFoodTypes();
    }
  }, [open, restaurantData.id]);

  const handleNext = () => {
    if (activeStep === 0) {
      setCurrentGroup({
        id: Date.now().toString(),
        title: groupTitle,
        extras: []
      });
      setActiveStep(1);
    } else if (activeStep === 1) {
      if (currentGroup) {
        setExtraGroups([...extraGroups, currentGroup]);
        setCurrentGroup(null);
        setGroupTitle('');
        setActiveStep(2);
      }
    }
  };

  const handleBack = () => {
    if (activeStep === 1) {
      setCurrentGroup(null);
    }
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleAddVariant = () => {
    if (currentGroup && variant) {
      setCurrentGroup({
        ...currentGroup,
        extras: [...currentGroup.extras, { 
          id: Date.now().toString(), 
          variant,
          title: currentGroup.title 
        }]
      });
      setVariant('');
    }
  };

  const handleRemoveVariant = (id: string) => {
    if (currentGroup) {
      setCurrentGroup({
        ...currentGroup,
        extras: currentGroup.extras.filter(extra => extra.id !== id)
      });
    }
  };

  const handleRemoveGroup = (id: string) => {
    setExtraGroups(extraGroups.filter(group => group.id !== id));
  };

  const handleEditGroup = (group: ExtraGroup) => {
    setCurrentGroup(group);
    setGroupTitle(group.title);
    setExtraGroups(extraGroups.filter(g => g.id !== group.id));
    setActiveStep(1);
  };

  const handleAddAnotherGroup = () => {
    setGroupTitle('');
    setActiveStep(0);
  };

  const handleSave = () => {
    onAdd(extraGroups);
    setExtraGroups([]);
    setActiveStep(0);
    onClose();
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ mt: 2, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif ' }}>
            <TextField
              fullWidth
              label="Extras Title"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="e.g., Toppings, Sauces, Sides"
              InputProps={{
                sx: { 
                  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#000',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#000',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#000',
                  },
                  '& .MuiOutlinedInput-input': {
                    color: '#201a18', // default text color
                  },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-input': {
                    color: '#fd683e', // orange text when focused
                  },
                }
              }}
              InputLabelProps={{
                sx: { 
                  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                  color: '#201a18', // default label color
                  '&.Mui-focused': {
                    color: '#fd683e', // orange label when focused
                  },
                }
              }}
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
            <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
              Adding variants for: {currentGroup?.title}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <FormControl fullWidth sx={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
                <InputLabel 
                  sx={{ 
                    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                    color: '#201a18', // black by default
                    '&.Mui-focused': {
                      color: '#fd683e', // orange when focused
                    },
                  }}
                >Select Variant</InputLabel>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress sx={{ color: '#fd683e' }} size={24} />
                  </Box>
                ) : (
                  <Select
                    value={variant}
                    onChange={(e: SelectChangeEvent) => setVariant(e.target.value as string)}
                    label="Select Variant"
                    sx={{ 
                      fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#000',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#000',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#000',
                      },
                      '& .MuiSelect-select': {
                        color: '#201a18', // always black for selected value
                      },
                    }}
                  >
                    {foodTypes.map(opt => (
                      <MenuItem key={opt.value} value={opt.value} sx={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              </FormControl>
              <Button
                variant="contained"
                onClick={handleAddVariant}
                disabled={!variant}
                startIcon={<AddIcon />}
                sx={{
                  backgroundColor: '#fd683e',
                  '&:hover': {
                    backgroundColor: '#e54d0e',
                  },
                  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
                }}
              >
                Add
              </Button>
            </Box>
            {currentGroup && currentGroup.extras.length > 0 && (
              <Paper sx={{ p: 2, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
                  Added Variants:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {currentGroup.extras.map((extra) => (
                    <Chip
                      key={extra.id}
                      label={extra.variant}
                      onDelete={() => handleRemoveVariant(extra.id)}
                      sx={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
                    />
                  ))}
                </Box>
              </Paper>
            )}
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 2, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
            {extraGroups.length === 0 ? (
              <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                No extras added yet. Click "Add Another Group" to get started!
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {extraGroups.map((group) => (
                  <Grid item xs={12} sm={6} key={group.id}>
                    <Card
                      sx={{
                        boxShadow: 1,
                        borderRadius: 1.5,
                        overflow: 'visible',
                        position: 'relative',
                        minHeight: 110,
                      }}
                    >
                      <Box
                        sx={{
                          background: '#201a18',
                          color: '#fff',
                          px: 1.5,
                          py: 0.7,
                          borderTopLeftRadius: 6,
                          borderTopRightRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>
                          {group.title}
                        </Typography>
                        <Box>
                          <IconButton
                            onClick={() => handleEditGroup(group)}
                            sx={{ color: '#fff', mr: 0.5, p: 0.5 }}
                            size="small"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => handleRemoveGroup(group.id)}
                            sx={{ color: '#fff', p: 0.5 }}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                      <CardContent sx={{ pt: 1, pb: 1, px: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.2, display: 'block', fontSize: 13 }}>
                          {group.extras.length} variant{group.extras.length !== 1 ? 's' : ''} added:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {group.extras.map((extra) => (
                            <Chip
                              key={extra.id}
                              label={extra.variant}
                              size="small"
                              sx={{
                                fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                                background: '#fff3ea',
                                color: '#fd683e',
                                fontWeight: 500,
                                fontSize: 12,
                                height: 24,
                              }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            <Button
              sx={{
                mt: 2,
                backgroundColor: '#fd683e',
                '&:hover': { backgroundColor: '#e54d0e' },
                fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
              }}
              onClick={handleAddAnotherGroup}
              startIcon={<AddIcon />}
              variant="contained"
            >
              Add Another Group
            </Button>
          </Box>
        );
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '30vh',
          maxWidth: 600,
          width: '100%',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          p: 1.5,
          '& .MuiDialogTitle-root': { fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', fontSize: 22, py: 1 },
          '& .MuiTypography-root': { fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' },
          '& .MuiStepLabel-label': { fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' },
        }
      }}
    >
      {/* Close button at top right */}
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 12,
          top: 12,
          color: '#686868',
          zIndex: 10,
        }}
      >
        <span style={{ fontSize: 24, fontWeight: 700 }}>&times;</span>
      </IconButton>
      <DialogTitle sx={{ fontSize: 22, py: 1 }}>Add Extras</DialogTitle>
      <DialogContent sx={{ p: 1.5 }}>
        <Stepper 
          activeStep={activeStep} 
          sx={{ 
            pt: 1,
            pb: 1.5,
            '& .MuiStepIcon-root': {
              color: '#ffd2b3', // default (inactive) step icon color
            },
            '& .MuiStepIcon-root.Mui-active': {
              color: '#fd683e', // active step icon color
            },
            '& .MuiStepIcon-root.Mui-completed': {
              color: '#fd683e', // completed step icon color
            },
            '& .MuiStepLabel-label': {
              color: '#000', // always black for step label text
            },
            '& .MuiStepLabel-label.Mui-active': {
              color: '#000', // active step label color black
            },
            '& .MuiStepLabel-label.Mui-completed': {
              color: '#000', // completed step label color black
            },
            '& .MuiStepLabel-iconContainer .Mui-active': {
              color: '#fd683e', // active step icon
            },
            '& .MuiStepLabel-iconContainer .Mui-completed': {
              color: '#fd683e', // completed step icon
            },
          }}
        >
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent()}
      </DialogContent>
      <DialogActions sx={{ gap: 1, px: 2, pb: 2 }}>
        {/* Only show Cancel button if not on step 2 or 3 */}
        {activeStep > 0 && (
          <Button
            variant="contained"
            onClick={handleBack}
            className="uppercase font-semibold rounded-md px-4 py-1 text-sm shadow-none"
            sx={{
              backgroundColor: '#201a18',
              color: '#fff',
              '&:hover': { backgroundColor: '#181512' },
              boxShadow: 'none',
            }}
          >
            Back
          </Button>
        )}
        {activeStep === 2 ? (
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={extraGroups.length === 0}
            className="uppercase font-semibold rounded-md px-4 py-1 text-sm shadow-none"
            sx={{
              backgroundColor: '#fd683e',
              color: '#fff',
              '&:hover': { backgroundColor: '#e54d0e' },
              boxShadow: 'none',
              '&.Mui-disabled': {
                backgroundColor: '#ffd2b3',
                color: '#fff',
                opacity: 1,
              },
            }}
          >
            Save All
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={
              (activeStep === 0 && !groupTitle) ||
              (activeStep === 1 && (!currentGroup || currentGroup.extras.length === 0))
            }
            className="uppercase font-semibold rounded-md px-4 py-1 text-sm shadow-none"
            sx={{
              backgroundColor: '#fd683e',
              color: '#fff',
              '&:hover': { backgroundColor: '#e54d0e' },
              boxShadow: 'none',
              '&.Mui-disabled': {
                backgroundColor: '#ffd2b3',
                color: '#fff',
                opacity: 1,
              },
            }}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddExtrasModal; 