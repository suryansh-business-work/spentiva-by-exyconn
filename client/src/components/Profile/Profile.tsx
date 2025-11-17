import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Profile: React.FC = () => {
  const { user, updateUser, token } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Email verification dialog
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [emailToVerify, setEmailToVerify] = useState('');
  const [devOtp, setDevOtp] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size should be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('photo', photoFile);

      const response = await axios.post('/api/auth/profile-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      if (user) {
        updateUser({
          ...user,
          profilePhoto: response.data.photoUrl,
        });
      }

      setMessage('Profile photo updated successfully');
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.put(
        '/api/auth/profile',
        { name, email: email || undefined },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      updateUser(response.data.user);
      setMessage('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmailOTP = async () => {
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        '/api/auth/send-email-otp',
        { email },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDevOtp(response.data.devOtp);
      setEmailToVerify(email);
      setEmailDialogOpen(true);
      setMessage('OTP sent to your email');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!emailOtp || emailOtp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        '/api/auth/verify-email-otp',
        { email: emailToVerify, otp: emailOtp },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      updateUser(response.data.user);
      setEmailDialogOpen(false);
      setEmailOtp('');
      setDevOtp('');
      setMessage('Email verified successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to verify email');
    } finally {
      setLoading(false);
    }
  };

  const getPhotoUrl = () => {
    if (photoPreview) return photoPreview;
    if (user?.profilePhoto) {
      return `http://localhost:5000${user.profilePhoto}`;
    }
    return undefined;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#667eea', mb: 3 }}>
          My Profile
        </Typography>

        {message && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setMessage('')}>
            {message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Profile Photo Section */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={getPhotoUrl()}
              sx={{ width: 120, height: 120, mb: 2 }}
            >
              {user?.name.charAt(0).toUpperCase()}
            </Avatar>
            <IconButton
              component="label"
              sx={{
                position: 'absolute',
                bottom: 10,
                right: -10,
                backgroundColor: '#667eea',
                color: 'white',
                '&:hover': { backgroundColor: '#764ba2' },
              }}
            >
              <PhotoCameraIcon />
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handlePhotoChange}
              />
            </IconButton>
          </Box>

          {photoFile && (
            <Button
              variant="contained"
              onClick={handleUploadPhoto}
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Upload Photo'}
            </Button>
          )}
        </Box>

        {/* Profile Details */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 3 }}
            disabled={loading}
          />

          <TextField
            fullWidth
            label="Phone Number"
            value={user?.phone || ''}
            disabled
            sx={{ mb: 3 }}
            InputProps={{
              endAdornment: user?.phoneVerified ? (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Verified"
                  color="success"
                  size="small"
                />
              ) : (
                <Chip
                  icon={<CancelIcon />}
                  label="Not Verified"
                  color="error"
                  size="small"
                />
              ),
            }}
          />

          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            disabled={loading}
            InputProps={{
              endAdornment: user?.emailVerified ? (
                <Chip
                  icon={<CheckCircleIcon />}
                  label="Verified"
                  color="success"
                  size="small"
                />
              ) : email ? (
                <Button
                  size="small"
                  onClick={handleSendEmailOTP}
                  disabled={loading}
                >
                  Verify
                </Button>
              ) : null,
            }}
          />

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Chip
              label={user?.accountType === 'business' ? 'Business Account' : 'Personal Account'}
              color="primary"
            />
          </Box>

          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleUpdateProfile}
            disabled={loading || !name.trim()}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </Box>
      </Paper>

      {/* Email Verification Dialog */}
      <Dialog open={emailDialogOpen} onClose={() => !loading && setEmailDialogOpen(false)}>
        <DialogTitle>Verify Email</DialogTitle>
        <DialogContent>
          {devOtp && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Development OTP: {devOtp}
            </Alert>
          )}
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter the 6-digit OTP sent to {emailToVerify}
          </Typography>
          <TextField
            fullWidth
            label="Enter OTP"
            value={emailOtp}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '');
              if (value.length <= 6) {
                setEmailOtp(value);
              }
            }}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEmailDialogOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleVerifyEmail}
            variant="contained"
            disabled={loading || emailOtp.length !== 6}
          >
            {loading ? <CircularProgress size={24} /> : 'Verify'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
