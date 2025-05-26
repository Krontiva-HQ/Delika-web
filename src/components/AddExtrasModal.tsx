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

const steps = ['Enter Group Title', 'Add Variants', 'Review Groups'];

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

  useEffect(() => {
    const fetchFoodTypes = async () => {
      try {
        setLoading(true);
        const response = await axios.get('https://api-server.krontiva.africa/api:uEBBwbSs/delika_inventory_table');
        const data = response.data as FoodItem[];
        
        // Filter for restaurant ID and get unique food types
        const filteredData = data.filter(item => 
          item.restaurantName === '12439651-ffdd-4dba-97b3-7f618cc2481d'
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
  }, [open]);

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
          <Box sx={{ mt: 2, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
            <TextField
              fullWidth
              label="Group Title"
              value={groupTitle}
              onChange={(e) => setGroupTitle(e.target.value)}
              placeholder="e.g., Toppings, Sauces, Sides"
              InputProps={{
                sx: { fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }
              }}
              InputLabelProps={{
                sx: { fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }
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
                <InputLabel sx={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>Select Variant</InputLabel>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress sx={{ color: '#fd683e' }} size={24} />
                  </Box>
                ) : (
                  <Select
                    value={variant}
                    onChange={(e: SelectChangeEvent) => setVariant(e.target.value as string)}
                    label="Select Variant"
                    sx={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
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
            <Grid container spacing={2}>
              {extraGroups.map((group) => (
                <Grid 
                  key={group.id} 
                  item 
                  xs={12} 
                  sm={6}
                  component="div"
                  sx={{ display: 'flex', flexDirection: 'column' }}
                >
                  <Card sx={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
                    <CardContent sx={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
                      <Typography variant="h6" gutterBottom sx={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
                        {group.title}
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {group.extras.map((extra) => (
                          <Chip
                            key={extra.id}
                            label={extra.variant}
                            size="small"
                            sx={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                    <CardActions sx={{ fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEditGroup(group)}
                        title="Edit group"
                        sx={{ color: '#686868', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => handleRemoveGroup(group.id)}
                        title="Remove group"
                        sx={{ color: '#686868', fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif' }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {extraGroups.length > 0 && (
              <Button
                sx={{ 
                  mt: 2,
                  backgroundColor: '#fd683e',
                  '&:hover': {
                    backgroundColor: '#e54d0e',
                  },
                  fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
                }}
                onClick={handleAddAnotherGroup}
                startIcon={<AddIcon />}
                variant="contained"
              >
                Add Another Group
              </Button>
            )}
          </Box>
        );
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '50vh',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          '& .MuiDialogTitle-root': {
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          },
          '& .MuiTypography-root': {
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          },
          '& .MuiStepLabel-label': {
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          },
        }
      }}
    >
      <DialogTitle>Add Extras</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ pt: 2, pb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent()}
      </DialogContent>
      <DialogActions sx={{ gap: 2, px: 3, pb: 3 }}>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{
            backgroundColor: '#201a18',
            color: '#fff',
            boxShadow: 'none',
            '&:hover': { backgroundColor: '#181512' },
            textTransform: 'uppercase',
            fontWeight: 500,
            borderRadius: '6px',
            px: 4,
            py: 1.5,
            minWidth: 110,
            fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
          }}
        >
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button
            variant="contained"
            onClick={handleBack}
            sx={{
              backgroundColor: '#686868',
              color: '#fff',
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#4d4d4d' },
              textTransform: 'uppercase',
              fontWeight: 500,
              borderRadius: '6px',
              px: 4,
              py: 1.5,
              minWidth: 110,
              fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
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
            sx={{
              backgroundColor: '#fd683e',
              color: '#fff',
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#e54d0e' },
              '&.Mui-disabled': {
                backgroundColor: '#ffd2b3',
                color: '#fff',
                opacity: 1,
              },
              textTransform: 'uppercase',
              fontWeight: 500,
              borderRadius: '6px',
              px: 4,
              py: 1.5,
              minWidth: 110,
              fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
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
            sx={{
              backgroundColor: '#fd683e',
              color: '#fff',
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#e54d0e' },
              '&.Mui-disabled': {
                backgroundColor: '#ffd2b3',
                color: '#fff',
                opacity: 1,
              },
              textTransform: 'uppercase',
              fontWeight: 500,
              borderRadius: '6px',
              px: 4,
              py: 1.5,
              minWidth: 110,
              fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
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