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
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../../contexts/AuthContext';
import Logo from '../Logo/Logo';
import axios from 'axios';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const steps = ['Enter Phone Number', 'Verify OTP'];

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
      setActiveStep(1);
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
      });

      login(response.data.token, response.data.user);
      navigate('/trackers');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveStep(0);
    setOtp('');
    setError('');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Logo width={180} height={50} />
        </Box>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#667eea' }}>
            Login
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your phone number to continue
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

        {activeStep === 0 ? (
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
              onClick={handleSendOTP}
              disabled={loading || phone.length !== 10}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Send OTP'}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={() => navigate('/signup')}
              disabled={loading}
            >
              Don't have an account? Sign Up
            </Button>
          </Box>
        ) : (
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Verify OTP'}
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

        <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block' }}>
            Spentiva
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            By Exyconn
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
