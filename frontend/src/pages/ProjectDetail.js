import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Tabs,
  Tab,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { projectService, dodService } from '../services/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PeopleIcon from '@mui/icons-material/People';
import AssignmentIcon from '@mui/icons-material/Assignment';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [dods, setDods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Dialog states
  const [dodDialogOpen, setDodDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [selectedDodId, setSelectedDodId] = useState(null);

  const dodForm = useForm();
  const itemForm = useForm();
  const participantForm = useForm();

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const response = await projectService.getProjectDoDs(id);
      setDods(response.data.dods || []);
      // Note: We should also fetch project details separately in a real app
    } catch (err) {
      setError('Failed to fetch project data');
      console.error('Error fetching project data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDoD = async (data) => {
    try {
      await dodService.createDoD(data.title, data.description, parseInt(id));
      setDodDialogOpen(false);
      dodForm.reset();
      fetchProjectData();
    } catch (err) {
      setError('Failed to create DoD');
    }
  };

  const handleAddItem = async (data) => {
    try {
      await dodService.addDoDItem(
        selectedDodId,
        data.title,
        data.description,
        data.isRequired,
        data.order
      );
      setItemDialogOpen(false);
      setSelectedDodId(null);
      itemForm.reset();
      fetchProjectData();
    } catch (err) {
      setError('Failed to add DoD item');
    }
  };

  const handleAddParticipant = async (data) => {
    try {
      await projectService.addParticipant(id, data.email, data.role);
      setParticipantDialogOpen(false);
      participantForm.reset();
      // Note: Would need to refresh participant data in a real app
    } catch (err) {
      setError('Failed to add participant');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/projects')}
        sx={{ mb: 2 }}
      >
        Back to Projects
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Project Details
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Manage Definition of Done for this project
        </Typography>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Definition of Done" icon={<AssignmentIcon />} />
          <Tab label="Participants" icon={<PeopleIcon />} />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">
              Definition of Done ({dods.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDodDialogOpen(true)}
            >
              New DoD
            </Button>
          </Box>

          {dods.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 6 }}>
              <CardContent>
                <AssignmentIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Definition of Done yet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Create your first DoD to start defining completion criteria
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setDodDialogOpen(true)}
                >
                  Create DoD
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {dods.map((dod) => (
                <Grid item xs={12} md={6} key={dod.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6">
                          {dod.title}
                        </Typography>
                        <Chip
                          label={dod.is_active ? 'Active' : 'Inactive'}
                          color={dod.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </Box>

                      {dod.description && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          {dod.description}
                        </Typography>
                      )}

                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Items ({dod.items?.length || 0}):
                      </Typography>

                      {dod.items && dod.items.length > 0 ? (
                        <List dense>
                          {dod.items.map((item) => (
                            <ListItem key={item.id} sx={{ py: 0.5 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                {item.is_required ? (
                                  <CheckCircleIcon color="primary" fontSize="small" />
                                ) : (
                                  <RadioButtonUncheckedIcon color="action" fontSize="small" />
                                )}
                              </ListItemIcon>
                              <ListItemText
                                primary={item.title}
                                secondary={item.description}
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography variant="body2" color="textSecondary" sx={{ fontStyle: 'italic' }}>
                          No items yet
                        </Typography>
                      )}

                      <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                        Created by: {dod.creator?.username || 'Unknown'}
                      </Typography>
                    </CardContent>

                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedDodId(dod.id);
                          setItemDialogOpen(true);
                        }}
                      >
                        Add Item
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}

      {tabValue === 1 && (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">
              Participants
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setParticipantDialogOpen(true)}
            >
              Add Participant
            </Button>
          </Box>

          <Card>
            <CardContent>
              <Typography variant="body1">
                Participant management will be implemented here.
              </Typography>
            </CardContent>
          </Card>
        </>
      )}

      {/* Create DoD Dialog */}
      <Dialog open={dodDialogOpen} onClose={() => setDodDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={dodForm.handleSubmit(handleCreateDoD)}>
          <DialogTitle>Create New Definition of Done</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              margin="normal"
              {...dodForm.register('title', { required: 'Title is required' })}
              error={!!dodForm.formState.errors.title}
              helperText={dodForm.formState.errors.title?.message}
            />
            <TextField
              fullWidth
              label="Description"
              margin="normal"
              multiline
              rows={3}
              {...dodForm.register('description')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDodDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Create</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={itemDialogOpen} onClose={() => setItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={itemForm.handleSubmit(handleAddItem)}>
          <DialogTitle>Add DoD Item</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              margin="normal"
              {...itemForm.register('title', { required: 'Title is required' })}
              error={!!itemForm.formState.errors.title}
              helperText={itemForm.formState.errors.title?.message}
            />
            <TextField
              fullWidth
              label="Description"
              margin="normal"
              multiline
              rows={2}
              {...itemForm.register('description')}
            />
            <TextField
              fullWidth
              label="Order"
              type="number"
              margin="normal"
              {...itemForm.register('order', { valueAsNumber: true })}
              defaultValue={0}
            />
            <FormControlLabel
              control={
                <Checkbox
                  {...itemForm.register('isRequired')}
                  defaultChecked={true}
                />
              }
              label="Required item"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add Item</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add Participant Dialog */}
      <Dialog open={participantDialogOpen} onClose={() => setParticipantDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={participantForm.handleSubmit(handleAddParticipant)}>
          <DialogTitle>Add Participant</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              {...participantForm.register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                }
              })}
              error={!!participantForm.formState.errors.email}
              helperText={participantForm.formState.errors.email?.message}
            />
            <TextField
              fullWidth
              select
              label="Role"
              margin="normal"
              SelectProps={{ native: true }}
              {...participantForm.register('role', { required: 'Role is required' })}
              error={!!participantForm.formState.errors.role}
              helperText={participantForm.formState.errors.role?.message}
            >
              <option value="">Select role</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setParticipantDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Add Participant</Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default ProjectDetail;