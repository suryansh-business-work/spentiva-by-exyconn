import React, { useState } from 'react';
import {
  Container,
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
  Card,
  CardContent,
  Divider,
  Fade,
  Grow,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
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
  const [isEditing, setIsEditing] = useState(false);

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
      return `http://localhost:8002${user.profilePhoto}`;
    }
    return undefined;
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#333', py: 4 }}>
      <Container maxWidth="lg">
        <Fade in={true} timeout={500}>
          <Box>
            {/* Header Section */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  fontWeight: 800, 
                  color: '#fff', 
                  mb: 1,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                My Profile
              </Typography>
              <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Manage your personal information and preferences
              </Typography>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '350px 1fr' }, gap: 3 }}>
              {/* Left Card - Profile Photo */}
              <Grow in={true} timeout={600}>
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: 4,
                    background: '#fff',
                    overflow: 'visible',
                  }}
                >
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Box sx={{ position: 'relative', display: 'inline-block', mb: 3 }}>
                      <Box
                        sx={{
                          position: 'relative',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: -8,
                            left: -8,
                            right: -8,
                            bottom: -8,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            opacity: 0.2,
                          },
                        }}
                      >
                        <Avatar
                          src={getPhotoUrl()}
                          sx={{ 
                            width: 140, 
                            height: 140,
                            border: '4px solid #fff',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                            fontSize: '3em',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          }}
                        >
                          {user?.name.charAt(0).toUpperCase()}
                        </Avatar>
                      </Box>
                      <IconButton
                        component="label"
                        sx={{
                          position: 'absolute',
                          bottom: 8,
                          right: 8,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          width: 44,
                          height: 44,
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                          '&:hover': { 
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s',
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

                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: '#1a1a1a' }}>
                      {user?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
                      {user?.phone}
                    </Typography>

                    {photoFile && (
                      <Grow in={true}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={handleUploadPhoto}
                          disabled={loading}
                          sx={{
                            mb: 2,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 1.5,
                            borderRadius: 2,
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                            '&:hover': {
                              boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                            },
                          }}
                        >
                          {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Upload Photo'}
                        </Button>
                      </Grow>
                    )}

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ textAlign: 'left' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: user?.accountType === 'business' 
                              ? 'rgba(102, 126, 234, 0.1)'
                              : 'rgba(16, 185, 129, 0.1)',
                          }}
                        >
                          {user?.accountType === 'business' ? (
                            <BusinessIcon sx={{ color: '#667eea' }} />
                          ) : (
                            <PersonIcon sx={{ color: '#10b981' }} />
                          )}
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Account Type
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user?.accountType === 'business' ? 'Business' : 'Personal'}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: user?.phoneVerified 
                              ? 'rgba(16, 185, 129, 0.1)'
                              : 'rgba(239, 68, 68, 0.1)',
                          }}
                        >
                          {user?.phoneVerified ? (
                            <CheckCircleIcon sx={{ color: '#10b981' }} />
                          ) : (
                            <CancelIcon sx={{ color: '#ef4444' }} />
                          )}
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                            Phone Status
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user?.phoneVerified ? 'Verified' : 'Not Verified'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grow>

              {/* Right Card - Profile Details */}
              <Grow in={true} timeout={800}>
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: 4,
                    background: '#fff',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a1a1a' }}>
                        Profile Information
                      </Typography>
                      <Button
                        startIcon={<EditIcon />}
                        onClick={() => setIsEditing(!isEditing)}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 600,
                          color: '#667eea',
                          '&:hover': {
                            background: 'rgba(102, 126, 234, 0.1)',
                          },
                        }}
                      >
                        {isEditing ? 'Cancel' : 'Edit'}
                      </Button>
                    </Box>

                    {message && (
                      <Alert 
                        severity="success" 
                        sx={{ mb: 3, borderRadius: 2 }} 
                        onClose={() => setMessage('')}
                      >
                        {message}
                      </Alert>
                    )}

                    {error && (
                      <Alert 
                        severity="error" 
                        sx={{ mb: 3, borderRadius: 2 }} 
                        onClose={() => setError('')}
                      >
                        {error}
                      </Alert>
                    )}

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {/* Name Field */}
                      <Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary', 
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            mb: 1,
                            display: 'block',
                          }}
                        >
                          Full Name
                        </Typography>
                        <TextField
                          fullWidth
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={!isEditing || loading}
                          InputProps={{
                            startAdornment: (
                              <PersonIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              background: isEditing ? '#fff' : 'rgba(0,0,0,0.02)',
                            },
                          }}
                        />
                      </Box>

                      {/* Phone Field */}
                      <Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary', 
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            mb: 1,
                            display: 'block',
                          }}
                        >
                          Phone Number
                        </Typography>
                        <TextField
                          fullWidth
                          value={user?.phone || ''}
                          disabled
                          InputProps={{
                            startAdornment: (
                              <PhoneIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            ),
                            endAdornment: user?.phoneVerified ? (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label="Verified"
                                size="small"
                                sx={{
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  color: '#10b981',
                                  fontWeight: 600,
                                  border: 'none',
                                }}
                              />
                            ) : (
                              <Chip
                                icon={<CancelIcon />}
                                label="Not Verified"
                                size="small"
                                sx={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  color: '#ef4444',
                                  fontWeight: 600,
                                  border: 'none',
                                }}
                              />
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              background: 'rgba(0,0,0,0.02)',
                            },
                          }}
                        />
                      </Box>

                      {/* Email Field */}
                      <Box>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary', 
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            mb: 1,
                            display: 'block',
                          }}
                        >
                          Email Address
                        </Typography>
                        <TextField
                          fullWidth
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={!isEditing || loading}
                          placeholder="Add your email"
                          InputProps={{
                            startAdornment: (
                              <EmailIcon sx={{ color: 'text.secondary', mr: 1 }} />
                            ),
                            endAdornment: user?.emailVerified ? (
                              <Chip
                                icon={<CheckCircleIcon />}
                                label="Verified"
                                size="small"
                                sx={{
                                  background: 'rgba(16, 185, 129, 0.1)',
                                  color: '#10b981',
                                  fontWeight: 600,
                                  border: 'none',
                                }}
                              />
                            ) : email && isEditing ? (
                              <Button
                                size="small"
                                onClick={handleSendEmailOTP}
                                disabled={loading}
                                sx={{
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  color: '#667eea',
                                }}
                              >
                                Verify
                              </Button>
                            ) : null,
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              background: isEditing ? '#fff' : 'rgba(0,0,0,0.02)',
                            },
                          }}
                        />
                      </Box>

                      {isEditing && (
                        <Grow in={true}>
                          <Button
                            fullWidth
                            variant="contained"
                            size="large"
                            onClick={handleUpdateProfile}
                            disabled={loading || !name.trim()}
                            sx={{
                              mt: 2,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              textTransform: 'none',
                            fontWeight: 600,
                            py: 1.5,
                            fontSize: '1em',
                            borderRadius: 2,
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                              '&:hover': {
                                boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
                                transform: 'translateY(-2px)',
                              },
                              transition: 'all 0.2s',
                            }}
                          >
                            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Save Changes'}
                          </Button>
                        </Grow>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grow>
            </Box>
          </Box>
        </Fade>
      </Container>

      {/* Email Verification Dialog */}
      <Dialog 
        open={emailDialogOpen} 
        onClose={() => !loading && setEmailDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            minWidth: { xs: '90%', sm: 400 },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Verify Email Address
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {devOtp && (
            <Alert 
              severity="info" 
              sx={{ mb: 2, borderRadius: 2 }}
              icon={<CheckCircleIcon />}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Development OTP: {devOtp}
              </Typography>
            </Alert>
          )}
          <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
            Enter the 6-digit verification code sent to <strong>{emailToVerify}</strong>
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
            inputProps={{
              maxLength: 6,
              style: { 
                textAlign: 'center', 
                fontSize: '1.5em', 
                letterSpacing: '0.5em',
                fontWeight: 700,
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setEmailDialogOpen(false)} 
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.secondary',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleVerifyEmail}
            variant="contained"
            disabled={loading || emailOtp.length !== 6}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(102, 126, 234, 0.4)',
              },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Verify Email'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
