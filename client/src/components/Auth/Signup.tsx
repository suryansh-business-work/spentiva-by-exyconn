import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';
import BusinessIcon from '@mui/icons-material/Business';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Signup: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<'personal' | 'business'>('personal');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const steps = ['Enter Details', 'Enter Phone', 'Verify OTP'];

  const handleNext = () => {
    if (activeStep === 0) {
      if (!name.trim()) {
        setError('Please enter your name');
        return;
      }
      setError('');
      setActiveStep(1);
    } else if (activeStep === 1) {
      handleSendOTP();
    }
  };

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/send-otp', {
        phone,
        type: 'phone',
      });

      setDevOtp(response.data.devOtp);
      setActiveStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/verify-otp', {
        phone,
        otp,
        name,
        accountType,
      });

      login(response.data.token, response.data.user);
      navigate('/trackers');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (activeStep === 2) {
      setOtp('');
    }
    setActiveStep((prev) => prev - 1);
    setError('');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
            Sign Up
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Create your expense tracker account
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {devOtp && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Development OTP: {devOtp}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box>
            <TextField
              fullWidth
              label={accountType === 'personal' ? 'Your Name' : 'Business Name'}
              placeholder={accountType === 'personal' ? 'Enter your full name' : 'Enter business name'}
              value={name}
              onChange={(e) => setName(e.target.value)}
              InputProps={{
                startAdornment: accountType === 'personal' 
                  ? <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  : <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mb: 3 }}
              disabled={loading}
            />

            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend">Account Type</FormLabel>
              <RadioGroup
                row
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as 'personal' | 'business')}
              >
                <FormControlLabel 
                  value="personal" 
                  control={<Radio />} 
                  label="Personal" 
                  disabled={loading}
                />
                <FormControlLabel 
                  value="business" 
                  control={<Radio />} 
                  label="Business" 
                  disabled={loading}
                />
              </RadioGroup>
            </FormControl>

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleNext}
              disabled={loading || !name.trim()}
            >
              Next
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/login')}
              disabled={loading}
            >
              Already have an account? Login
            </Button>
          </Box>
        )}

        {activeStep === 1 && (
          <Box>
            <TextField
              fullWidth
              label="Phone Number"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) {
                  setPhone(value);
                }
              }}
              InputProps={{
                startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mb: 3 }}
              disabled={loading}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleNext}
              disabled={loading || phone.length !== 10}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleBack}
              disabled={loading}
            >
              Back
            </Button>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <TextField
              fullWidth
              label="Enter OTP"
              placeholder="6-digit OTP"
              value={otp}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 6) {
                  setOtp(value);
                }
              }}
              InputProps={{
                startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mb: 3 }}
              disabled={loading}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={handleBack}
              disabled={loading}
            >
              Back
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Signup;
