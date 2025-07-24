import { styled } from '@mui/material/styles';
import Select from '@mui/material/Select';

export const StyledSelect = styled(Select)({
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