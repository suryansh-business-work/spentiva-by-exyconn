import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
  Paper,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  TrendingUp as TrendingUpIcon,
  Star as StarIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { api } from '../../services/api';

interface SubscriptionPlan {
  name: string;
  messagesPerMonth: number;
  price: number;
  features: string[];
  color: string;
  popular?: boolean;
}

interface UsageData {
  totalMessages: number;
  trackerUsage: { [trackerId: string]: number };
  currentMonth: string;
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    name: 'Free',
    messagesPerMonth: 50,
    price: 0,
    color: '#8892a9',
    features: [
      '50 AI messages per month',
      'Unlimited trackers',
      'Basic analytics',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    messagesPerMonth: 500,
    price: 9.99,
    color: '#845c58',
    popular: true,
    features: [
      '500 AI messages per month',
      'Unlimited trackers',
      'Advanced analytics',
      'Priority support',
      'Export data',
      'Custom categories',
    ],
  },
  {
    name: 'Business',
    messagesPerMonth: 2000,
    price: 29.99,
    color: '#b7bac3',
    features: [
      '2000 AI messages per month',
      'Unlimited trackers',
      'Premium analytics',
      '24/7 support',
      'Advanced export options',
      'Team collaboration',
      'API access',
      'Custom branding',
    ],
  },
];

const Usage = () => {
  const [usageData, setUsageData] = useState<UsageData>({
    totalMessages: 0,
    trackerUsage: {},
    currentMonth: new Date().toISOString().slice(0, 7),
  });
  const [trackers, setTrackers] = useState<any[]>([]);
  const [selectedTracker, setSelectedTracker] = useState<string>('all');
  const [selectedPlan, setSelectedPlan] = useState<string>('Free');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load trackers
      const trackersData = await api.getTrackers();
      setTrackers(trackersData);

      // Load usage data from localStorage
      const storedUsage = localStorage.getItem('usage_data');
      if (storedUsage) {
        setUsageData(JSON.parse(storedUsage));
      }

      // Get selected plan from localStorage
      const storedPlan = localStorage.getItem('subscription_plan');
      if (storedPlan) {
        setSelectedPlan(storedPlan);
      }
    } catch (error) {
      console.error('Error loading usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  const handlePlanUpgrade = (planName: string) => {
    setSelectedPlan(planName);
    localStorage.setItem('subscription_plan', planName);
    alert(`Subscription upgraded to ${planName}! (Demo mode - no payment required)`);
  };

  const currentPlan = SUBSCRIPTION_PLANS.find((plan) => plan.name === selectedPlan) || SUBSCRIPTION_PLANS[0];
  const usagePercentage = (usageData.totalMessages / currentPlan.messagesPerMonth) * 100;

  const filteredMessages =
    selectedTracker === 'all'
      ? usageData.totalMessages
      : usageData.trackerUsage[selectedTracker] || 0;

  const isOverLimit = usageData.totalMessages >= currentPlan.messagesPerMonth;

  return (
    <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a202c' }}>
          Usage & Subscription
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Usage Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Current Plan Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              background: `linear-gradient(135deg, ${currentPlan.color}22 0%, ${currentPlan.color}11 100%)`,
              border: `2px solid ${currentPlan.color}`,
              borderRadius: 2,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {currentPlan.name} Plan
                </Typography>
                {currentPlan.popular && (
                  <Chip
                    icon={<StarIcon />}
                    label="Popular"
                    size="small"
                    sx={{ bgcolor: currentPlan.color, color: 'white' }}
                  />
                )}
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: currentPlan.color, mb: 1 }}>
                {currentPlan.price === 0 ? 'Free' : `$${currentPlan.price}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                per month
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Messages Used Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TrendingUpIcon sx={{ mr: 1, color: '#8892a9' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Messages Used
                </Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700, color: '#1a202c', mb: 1 }}>
                {usageData.totalMessages}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of {currentPlan.messagesPerMonth} messages
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Usage Progress Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Usage Progress
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(usagePercentage, 100)}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  mb: 1,
                  bgcolor: '#e8eaec',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: isOverLimit ? '#f44336' : '#845c58',
                    borderRadius: 6,
                  },
                }}
              />
              <Typography variant="body2" color={isOverLimit ? 'error' : 'text.secondary'}>
                {usagePercentage.toFixed(1)}% used
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alert if over limit */}
      {isOverLimit && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You've reached your monthly message limit. Upgrade your plan to continue using AI features.
        </Alert>
      )}

      {/* Filter by Tracker */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Tracker</InputLabel>
              <Select
                value={selectedTracker}
                onChange={(e) => setSelectedTracker(e.target.value)}
                label="Filter by Tracker"
              >
                <MenuItem value="all">All Trackers</MenuItem>
                {trackers.map((tracker) => (
                  <MenuItem key={tracker.id} value={tracker.id}>
                    {tracker.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Filtered Messages: <span style={{ color: '#845c58' }}>{filteredMessages}</span>
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tracker Usage Breakdown */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
            Usage by Tracker
          </Typography>
          <Grid container spacing={2}>
            {trackers.length === 0 ? (
              <Grid size={{ xs: 12 }}>
                <Typography variant="body2" color="text.secondary" align="center">
                  No trackers found. Create a tracker to start tracking usage.
                </Typography>
              </Grid>
            ) : (
              trackers.map((tracker) => {
                const messages = usageData.trackerUsage[tracker.id] || 0;
                const percentage = (messages / usageData.totalMessages) * 100 || 0;
                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={tracker.id}>
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid #e8eaec',
                        transition: 'all 0.3s',
                        '&:hover': {
                          borderColor: '#845c58',
                          boxShadow: '0 2px 8px rgba(132, 92, 88, 0.1)',
                        },
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                        {tracker.name}
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: '#845c58', mb: 1 }}>
                        {messages}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={percentage}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: '#e8eaec',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: '#8892a9',
                            borderRadius: 3,
                          },
                        }}
                      />
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                        {percentage.toFixed(1)}% of total
                      </Typography>
                    </Paper>
                  </Grid>
                );
              })
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Subscription Plans */}
      <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#1a202c' }}>
        Subscription Plans
      </Typography>
      <Grid container spacing={3}>
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Grid size={{ xs: 12, md: 4 }} key={plan.name}>
            <Card
              sx={{
                position: 'relative',
                height: '100%',
                borderRadius: 2,
                border: selectedPlan === plan.name ? `2px solid ${plan.color}` : '1px solid #e8eaec',
                boxShadow: plan.popular ? '0 8px 24px rgba(132, 92, 88, 0.15)' : 'none',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 32px rgba(132, 92, 88, 0.2)',
                },
              }}
            >
              {plan.popular && (
                <Chip
                  icon={<StarIcon />}
                  label="Most Popular"
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    bgcolor: plan.color,
                    color: 'white',
                    fontWeight: 600,
                  }}
                />
              )}
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                  {plan.name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2 }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: plan.color }}>
                    {plan.price === 0 ? 'Free' : `$${plan.price}`}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ ml: 1 }}>
                    /month
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {plan.messagesPerMonth} AI messages per month
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Stack spacing={1.5} sx={{ mb: 3 }}>
                  {plan.features.map((feature, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleIcon sx={{ fontSize: 18, mr: 1, color: plan.color }} />
                      <Typography variant="body2">{feature}</Typography>
                    </Box>
                  ))}
                </Stack>
                <Button
                  variant={selectedPlan === plan.name ? 'outlined' : 'contained'}
                  fullWidth
                  disabled={selectedPlan === plan.name}
                  onClick={() => handlePlanUpgrade(plan.name)}
                  sx={{
                    bgcolor: selectedPlan === plan.name ? 'transparent' : plan.color,
                    borderColor: plan.color,
                    color: selectedPlan === plan.name ? plan.color : 'white',
                    '&:hover': {
                      bgcolor: selectedPlan === plan.name ? 'transparent' : plan.color,
                      opacity: 0.9,
                    },
                    '&.Mui-disabled': {
                      bgcolor: 'transparent',
                      borderColor: plan.color,
                      color: plan.color,
                    },
                  }}
                >
                  {selectedPlan === plan.name ? 'Current Plan' : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Usage Info */}
      <Paper sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: '#f8f9fa' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
          <InfoIcon sx={{ mr: 1, color: '#8892a9', mt: 0.5 }} />
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              How Usage is Tracked
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Each AI message in the chat interface counts as 1 message toward your monthly limit.
              <br />
              • Usage is tracked per tracker and aggregated for your overall usage.
              <br />
              • Usage resets on the 1st of each month.
              <br />• Unused messages do not roll over to the next month.
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Usage;
