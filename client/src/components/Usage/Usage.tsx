import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Stack,
  Divider,
  Paper,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Refresh as RefreshIcon,
  MessageOutlined as MessageIcon,
  TokenOutlined as TokenIcon,
  PersonOutline as PersonIcon,
  SmartToy as AIIcon,
  TrendingUp as TrendingUpIcon,
  ShowChart as ShowChartIcon,
  ListAlt as ListAltIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';

interface UsageData {
  overall: {
    totalMessages: number;
    totalTokens: number;
    userMessages: number;
    aiMessages: number;
  };
  byTracker: Array<{
    trackerId: string;
    trackerName: string;
    trackerType: string;
    isDeleted: boolean;
    deletedAt?: string;
    messageCount: number;
    tokenCount: number;
  }>;
  recentActivity: Array<{
    date: string;
    messageCount: number;
    tokenCount: number;
  }>;
}

interface TrackerUsageData {
  tracker: {
    trackerId: string;
    trackerName: string;
    trackerType: string;
    isDeleted: boolean;
    deletedAt?: string;
  };
  usage: {
    totalMessages: number;
    totalTokens: number;
    userMessages: number;
    aiMessages: number;
  };
  dailyUsage: Array<{
    date: string;
    messageCount: number;
    tokenCount: number;
  }>;
  messages: Array<{
    _id: string;
    role: 'user' | 'assistant';
    content: string;
    tokenCount: number;
    timestamp: Date;
  }>;
}

interface Tracker {
  _id: string;
  name: string;
  type: string;
}

const Usage = () => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [selectedTracker, setSelectedTracker] = useState<string>('all');
  const [trackerUsageData, setTrackerUsageData] = useState<TrackerUsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    loadData();
    loadTrackers();
  }, []);

  useEffect(() => {
    if (selectedTracker && selectedTracker !== 'all') {
      loadTrackerUsage(selectedTracker);
    } else {
      setTrackerUsageData(null);
    }
  }, [selectedTracker]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getOverallUsage();
      console.log('Usage data received:', data);
      
      // Ensure data has the proper structure
      if (!data || !data.overall) {
        console.warn('Invalid data structure received:', data);
        setUsageData({
          overall: {
            totalMessages: 0,
            totalTokens: 0,
            userMessages: 0,
            aiMessages: 0,
          },
          byTracker: [],
          recentActivity: [],
        });
      } else {
        setUsageData(data);
      }
    } catch (err: any) {
      console.error('Error loading usage data:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.error || err.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  const loadTrackers = async () => {
    try {
      const trackersData = await api.getTrackers();
      setTrackers(trackersData);
    } catch (err: any) {
      console.error('Error loading trackers:', err);
    }
  };

  const loadTrackerUsage = async (trackerId: string) => {
    setTrackerLoading(true);
    setError(null);
    try {
      console.log('Loading tracker usage for:', trackerId);
      const data = await api.getTrackerUsage(trackerId);
      console.log('Tracker usage data received:', data);
      setTrackerUsageData(data);
    } catch (err: any) {
      console.error('Error loading tracker usage:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load tracker usage';
      setError(errorMsg);
      setTrackerUsageData(null);
    } finally {
      setTrackerLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
    loadTrackers();
    if (selectedTracker && selectedTracker !== 'all') {
      loadTrackerUsage(selectedTracker);
    }
  };

  const handleTrackerChange = (event: any) => {
    setSelectedTracker(event.target.value);
    setCurrentTab(0); // Reset to Usage tab when tracker changes
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <IconButton onClick={handleRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Container>
    );
  }

  // If no usage data, show empty state
  if (!usageData) {
    return (
      <Container maxWidth="xl" sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a202c' }}>
            Usage Statistics
          </Typography>
          <Tooltip title="Refresh data">
            <IconButton onClick={handleRefresh} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          No usage data available yet. Start using AI chat in your trackers to see statistics here.
        </Alert>

        {/* Show empty state cards */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a202c' }}>
            Overall Usage
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                borderRadius: 3, 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'white' }}>
                    <MessageIcon sx={{ mr: 1, fontSize: '1.5em' }} />
                    <Typography variant="body1" sx={{ opacity: 0.95, fontSize: '0.95em', fontWeight: 500 }}>
                      Total Messages
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>
                    0
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                borderRadius: 3, 
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'white' }}>
                    <TokenIcon sx={{ mr: 1, fontSize: '1.5em' }} />
                    <Typography variant="body1" sx={{ opacity: 0.95, fontSize: '0.95em', fontWeight: 500 }}>
                      Total Tokens
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>
                    0
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                borderRadius: 3, 
                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'white' }}>
                    <PersonIcon sx={{ mr: 1, fontSize: '1.5em' }} />
                    <Typography variant="body1" sx={{ opacity: 0.95, fontSize: '0.95em', fontWeight: 500 }}>
                      User Messages
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>
                    0
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Card sx={{ 
                borderRadius: 3, 
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'white' }}>
                    <AIIcon sx={{ mr: 1, fontSize: '1.5em' }} />
                    <Typography variant="body1" sx={{ opacity: 0.95, fontSize: '0.95em', fontWeight: 500 }}>
                      AI Messages
                    </Typography>
                  </Box>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>
                    0
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a202c' }}>
          Usage Statistics
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={handleRefresh} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Overall Usage Stats - Always Visible */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1a202c' }}>
          Overall Usage
        </Typography>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'white' }}>
                  <MessageIcon sx={{ mr: 1, fontSize: '1.5em' }} />
                  <Typography variant="body1" sx={{ opacity: 0.95, fontSize: '0.95em', fontWeight: 500 }}>
                    Total Messages
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>
                  {usageData.overall.totalMessages.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'white' }}>
                  <TokenIcon sx={{ mr: 1, fontSize: '1.5em' }} />
                  <Typography variant="body1" sx={{ opacity: 0.95, fontSize: '0.95em', fontWeight: 500 }}>
                    Total Tokens
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>
                  {usageData.overall.totalTokens.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'white' }}>
                  <PersonIcon sx={{ mr: 1, fontSize: '1.5em' }} />
                  <Typography variant="body1" sx={{ opacity: 0.95, fontSize: '0.95em', fontWeight: 500 }}>
                    User Messages
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>
                  {usageData.overall.userMessages.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
            }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, color: 'white' }}>
                  <AIIcon sx={{ mr: 1, fontSize: '1.5em' }} />
                  <Typography variant="body1" sx={{ opacity: 0.95, fontSize: '0.95em', fontWeight: 500 }}>
                    AI Messages
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: 'white' }}>
                  {usageData.overall.aiMessages.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Tracker Dropdown */}
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth sx={{ maxWidth: 400 }}>
          <InputLabel id="tracker-select-label">Select Tracker</InputLabel>
          <Select
            labelId="tracker-select-label"
            id="tracker-select"
            value={selectedTracker || 'all'}
            label="Select Tracker"
            onChange={handleTrackerChange}
          >
            <MenuItem value="all">All Trackers</MenuItem>
            {trackers.map((tracker) => (
              <MenuItem key={tracker._id} value={tracker._id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography>{tracker.name}</Typography>
                  <Chip 
                    label={tracker.type} 
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '0.7em',
                      textTransform: 'capitalize',
                      bgcolor: tracker.type === 'business' ? 'rgba(102, 126, 234, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: tracker.type === 'business' ? '#667eea' : '#10b981',
                    }}
                  />
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Tabs */}
      <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={currentTab} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                fontSize: '0.95em',
                fontWeight: 500,
                textTransform: 'none',
                minHeight: 56,
              },
            }}
          >
            <Tab 
              icon={<TrendingUpIcon />} 
              iconPosition="start" 
              label="Usage" 
            />
            <Tab 
              icon={<ShowChartIcon />} 
              iconPosition="start" 
              label="Graphs" 
            />
            <Tab 
              icon={<ListAltIcon />} 
              iconPosition="start" 
              label="Logs" 
            />
          </Tabs>
        </Box>

        <CardContent sx={{ p: 3 }}>
          {/* Usage Tab */}
          {currentTab === 0 && (
            <Box>
              {selectedTracker === 'all' ? (
                // Show all trackers usage
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    Usage by Tracker
                  </Typography>
                  {usageData.byTracker.length === 0 ? (
                    <Alert severity="info">
                      No usage data available. Start using AI chat in your trackers to see statistics here.
                    </Alert>
                  ) : (
                    <Grid container spacing={3}>
                      {usageData.byTracker.map((tracker) => {
                        const totalMessages = usageData.overall.totalMessages;
                        const percentage = totalMessages > 0 ? (tracker.messageCount / totalMessages) * 100 : 0;
                        return (
                          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tracker.trackerId}>
                            <Paper
                              sx={{
                                p: 3,
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: '#e8eaec',
                                transition: 'all 0.3s',
                                '&:hover': {
                                  borderColor: tracker.trackerType === 'business' ? '#667eea' : '#10b981',
                                  boxShadow: `0 4px 16px ${tracker.trackerType === 'business' ? 'rgba(102, 126, 234, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                                  transform: 'translateY(-2px)',
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1a202c', fontSize: '1.05em' }}>
                                  {tracker.trackerName}
                                </Typography>
                                <Chip
                                  label={tracker.trackerType}
                                  size="small"
                                  sx={{
                                    fontSize: '0.7em',
                                    height: 24,
                                    textTransform: 'capitalize',
                                    bgcolor: tracker.trackerType === 'business' ? 'rgba(102, 126, 234, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                    color: tracker.trackerType === 'business' ? '#667eea' : '#10b981',
                                    fontWeight: 600,
                                  }}
                                />
                              </Box>

                              <Stack spacing={2}>
                                <Box>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9em' }}>
                                      Messages
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1em' }}>
                                      {tracker.messageCount}
                                    </Typography>
                                  </Box>
                                  <LinearProgress
                                    variant="determinate"
                                    value={percentage}
                                    sx={{
                                      height: 8,
                                      borderRadius: 4,
                                      bgcolor: '#e8eaec',
                                      '& .MuiLinearProgress-bar': {
                                        bgcolor: tracker.trackerType === 'business' ? '#667eea' : '#10b981',
                                        borderRadius: 4,
                                      },
                                    }}
                                  />
                                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                                    {percentage.toFixed(1)}% of total
                                  </Typography>
                                </Box>

                                <Divider />

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9em' }}>
                                    Tokens
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1em' }}>
                                    {tracker.tokenCount.toLocaleString()}
                                  </Typography>
                                </Box>

                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.9em' }}>
                                    Token Count
                                  </Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '1em' }}>
                                    {tracker.tokenCount.toLocaleString()}
                                  </Typography>
                                </Box>
                                {tracker.isDeleted && (
                                  <Box sx={{ mt: 1 }}>
                                    <Chip 
                                      label="Deleted" 
                                      size="small"
                                      color="error"
                                      sx={{ fontSize: '0.7em' }}
                                    />
                                  </Box>
                                )}
                              </Stack>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </Box>
              ) : trackerLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              ) : trackerUsageData ? (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {trackerUsageData.tracker.trackerName} - Detailed Usage
                    </Typography>
                    {trackerUsageData.tracker.isDeleted && (
                      <Chip 
                        label="Deleted Tracker" 
                        color="error"
                        size="small"
                      />
                    )}
                  </Box>
                      
                      <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid size={{ xs: 6, md: 3 }}>
                          <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.85em' }}>
                              Total Messages
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#667eea' }}>
                              {trackerUsageData.usage.totalMessages}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                          <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.85em' }}>
                              Total Tokens
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#10b981' }}>
                              {trackerUsageData.usage.totalTokens.toLocaleString()}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                          <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.85em' }}>
                              User Messages
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#3b82f6' }}>
                              {trackerUsageData.usage.userMessages}
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid size={{ xs: 6, md: 3 }}>
                          <Paper sx={{ p: 2.5, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontSize: '0.85em' }}>
                              AI Messages
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: '#f59e0b' }}>
                              {trackerUsageData.usage.aiMessages}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      {/* Daily Usage */}
                      {trackerUsageData.dailyUsage && trackerUsageData.dailyUsage.length > 0 && (
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                            Daily Activity (Last 30 Days)
                          </Typography>
                          <Stack spacing={1}>
                            {trackerUsageData.dailyUsage.slice(0, 10).map((day, index) => (
                              <Box
                                key={index}
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  p: 2,
                                  borderRadius: 2,
                                  bgcolor: index % 2 === 0 ? '#f8f9fa' : 'transparent',
                                }}
                              >
                                <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 100, fontSize: '0.95em' }}>
                                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 4 }}>
                                  <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.8em' }}>
                                      Messages
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                      {day.messageCount}
                                    </Typography>
                                  </Box>
                                  <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.8em' }}>
                                      Tokens
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                      {day.tokenCount.toLocaleString()}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}
                    </Box>
                  ) : (
                    <Alert severity="info">
                      No usage data available for this tracker yet
                    </Alert>
                  )
              }
            </Box>
          )}

          {/* Graphs Tab */}
          {currentTab === 1 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                Graph visualizations coming soon! This will show usage trends, comparisons, and analytics.
              </Alert>
              {selectedTracker === 'all' ? (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Overall Usage Trends
                  </Typography>
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <ShowChartIcon sx={{ fontSize: 64, color: '#8892a9', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Interactive charts and graphs will be displayed here
                    </Typography>
                  </Paper>
                </Box>
              ) : trackerUsageData && (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    {trackerUsageData.tracker.trackerName} - Message Logs
                  </Typography>
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa', borderRadius: 2 }}>
                    <ShowChartIcon sx={{ fontSize: 64, color: '#8892a9', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Tracker-specific charts and analytics will be displayed here
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Box>
          )}

          {/* Logs Tab */}
          {currentTab === 2 && (
            <Box>
              {selectedTracker === 'all' ? (
                <Alert severity="warning">
                  Please select a specific tracker to view message logs
                </Alert>
              ) : trackerUsageData && trackerUsageData.messages && trackerUsageData.messages.length > 0 ? (
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
                    {trackerUsageData.tracker.trackerName} - Message Logs
                  </Typography>
                  <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e8eaec' }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.9em' }}>Timestamp</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.9em' }}>Role</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.9em' }}>Message</TableCell>
                          <TableCell sx={{ fontWeight: 600, fontSize: '0.9em' }} align="right">Tokens</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {trackerUsageData.messages.slice(0, 50).map((message) => (
                          <TableRow 
                            key={message._id}
                            sx={{ 
                              '&:hover': { bgcolor: '#f8f9fa' },
                              '& td': { fontSize: '0.9em' }
                            }}
                          >
                            <TableCell sx={{ minWidth: 150 }}>
                              {new Date(message.timestamp).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={message.role}
                                size="small"
                                sx={{
                                  bgcolor: message.role === 'user' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                  color: message.role === 'user' ? '#3b82f6' : '#f59e0b',
                                  fontWeight: 600,
                                  fontSize: '0.75em',
                                  textTransform: 'capitalize',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ maxWidth: 400 }}>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}
                              >
                                {message.content}
                              </Typography>
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>
                              {message.tokenCount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  {trackerUsageData.messages.length > 50 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
                      Showing first 50 messages of {trackerUsageData.messages.length} total
                    </Typography>
                  )}
                </Box>
              ) : (
                <Alert severity="info">
                  No message logs available for this tracker
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Container>
  );
};

export default Usage;
