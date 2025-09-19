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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  ListItemSecondaryAction,
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
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [dods, setDods] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [userRole, setUserRole] = useState(null);
  
  // Dialog states
  const [dodDialogOpen, setDodDialogOpen] = useState(false);
  const [editDodDialogOpen, setEditDodDialogOpen] = useState(false);
  const [deleteDodDialog, setDeleteDodDialog] = useState({ open: false, dod: null });
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editItemDialogOpen, setEditItemDialogOpen] = useState(false);
  const [deleteItemDialog, setDeleteItemDialog] = useState({ open: false, item: null });
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [deleteParticipantDialog, setDeleteParticipantDialog] = useState({ open: false, participant: null });
  
  // State for editing
  const [selectedDodId, setSelectedDodId] = useState(null);
  const [editingDod, setEditingDod] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingParticipant, setDeletingParticipant] = useState(false);
  const [deletingDod, setDeletingDod] = useState(false);
  const [deletingItem, setDeletingItem] = useState(false);

  // Menu states
  const [dodMenuAnchor, setDodMenuAnchor] = useState({});
  const [itemMenuAnchor, setItemMenuAnchor] = useState({});

  const dodForm = useForm();
  const editDodForm = useForm();
  const itemForm = useForm();
  const editItemForm = useForm();
  const participantForm = useForm();

  useEffect(() => {
    fetchProjectData();
    fetchProjectDetails();
    fetchParticipants();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      const response = await projectService.getProjectDoDs(id);
      setDods(response.data.dods || []);
    } catch (err) {
      setError('Failed to fetch project data');
      console.error('Error fetching project data:', err);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      const response = await projectService.getProject(id);
      setProject(response.data.project);
    } catch (err) {
      console.error('Error fetching project details:', err);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await projectService.getParticipants(id);
      setParticipants(response.data.participants || []);
      
      // Déterminer le rôle de l'utilisateur actuel
      const currentUserParticipant = response.data.participants?.find(p => p.user?.id === user?.id);
      if (currentUserParticipant) {
        setUserRole(currentUserParticipant.role);
      } else if (project && project.owner?.id === user?.id) {
        setUserRole('owner');
      }
    } catch (err) {
      console.error('Error fetching participants:', err);
    } finally {
      setLoading(false);
    }
  };

  // DoD Management Functions
  const handleCreateDoD = async (data) => {
    try {
      await dodService.createDoD(data.title, data.description, parseInt(id));
      setDodDialogOpen(false);
      dodForm.reset();
      fetchProjectData();
      setError('');
    } catch (err) {
      setError('Failed to create DoD');
    }
  };

  const handleEditDoD = async (data) => {
    try {
      await dodService.updateDoD(editingDod.id, data.title, data.description);
      setEditDodDialogOpen(false);
      setEditingDod(null);
      editDodForm.reset();
      fetchProjectData();
      setError('');
    } catch (err) {
      setError('Failed to update DoD');
    }
  };

  const handleDeleteDoD = async () => {
    if (!deleteDodDialog.dod) return;

    setDeletingDod(true);
    try {
      await dodService.deleteDoD(deleteDodDialog.dod.id);
      setDeleteDodDialog({ open: false, dod: null });
      fetchProjectData();
      setError('');
    } catch (err) {
      setError('Failed to delete DoD');
    } finally {
      setDeletingDod(false);
    }
  };

  // Item Management Functions
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
      setError('');
    } catch (err) {
      setError('Failed to add DoD item');
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItemDialog.item) return;
  
    console.log('=== DELETE ITEM DEBUG ===');
    console.log('Item to delete:', deleteItemDialog.item);
    
    setDeletingItem(true);
    try {
      // Try to get dod_id from the item, or find it from the parent DoD
      let dodId = deleteItemDialog.item.dod_id;
      
      if (!dodId) {
        // Find the parent DoD that contains this item
        const parentDod = dods.find(d => 
          d.items && d.items.some(item => item.id === deleteItemDialog.item.id)
        );
        dodId = parentDod?.id;
        console.log('Found parent DoD ID:', dodId);
      }
      
      if (!dodId) {
        throw new Error('Could not find parent DoD for this item');
      }
      
      console.log('Using DoD ID:', dodId, 'Item ID:', deleteItemDialog.item.id);
      
      await dodService.deleteDoDItem(dodId, deleteItemDialog.item.id);
      setDeleteItemDialog({ open: false, item: null });
      fetchProjectData();
      setError('');
    } catch (err) {
      console.error('Delete error:', err.response?.data || err);
      setError('Failed to delete DoD item');
    } finally {
      setDeletingItem(false);
    }
  };
  
  // Also fix the handleEditItem function:
  const handleEditItem = async (data) => {
    try {
      // Get the correct DoD ID
      let dodId = editingItem.dod_id;
      
      if (!dodId) {
        const parentDod = dods.find(d => 
          d.items && d.items.some(item => item.id === editingItem.id)
        );
        dodId = parentDod?.id;
      }
      
      if (!dodId) {
        throw new Error('Could not find parent DoD for this item');
      }
      
      await dodService.updateDoDItem(
        dodId,
        editingItem.id,      
        data.title,
        data.description,
        data.isRequired,
        data.order
      );
      
      setEditItemDialogOpen(false);
      setEditingItem(null);
      editItemForm.reset();
      fetchProjectData();
      setError('');
    } catch (err) {
      console.error('Update error:', err);
      setError('Failed to update DoD item');
    }
  };

  // Participant Management Functions
  const handleAddParticipant = async (data) => {
    try {
      await projectService.addParticipant(id, data.email, data.role);
      setParticipantDialogOpen(false);
      participantForm.reset();
      fetchParticipants();
      setError('');
    } catch (err) {
      setError('Failed to add participant');
    }
  };

  const handleDeleteParticipant = async () => {
    if (!deleteParticipantDialog.participant) return;

    setDeletingParticipant(true);
    try {
      await projectService.removeParticipant(id, deleteParticipantDialog.participant.id);
      setDeleteParticipantDialog({ open: false, participant: null });
      fetchParticipants();
      setError('');
    } catch (err) {
      setError('Failed to remove participant');
    } finally {
      setDeletingParticipant(false);
    }
  };

  // Menu Handlers
  const handleDodMenuClick = (event, dodId) => {
    setDodMenuAnchor({ ...dodMenuAnchor, [dodId]: event.currentTarget });
  };

  const handleDodMenuClose = (dodId) => {
    setDodMenuAnchor({ ...dodMenuAnchor, [dodId]: null });
  };

  const handleItemMenuClick = (event, itemId) => {
    setItemMenuAnchor({ ...itemMenuAnchor, [itemId]: event.currentTarget });
  };

  const handleItemMenuClose = (itemId) => {
    setItemMenuAnchor({ ...itemMenuAnchor, [itemId]: null });
  };

  // Dialog Handlers
  const openEditDodDialog = (dod) => {
    setEditingDod(dod);
    editDodForm.setValue('title', dod.title);
    editDodForm.setValue('description', dod.description || '');
    setEditDodDialogOpen(true);
    handleDodMenuClose(dod.id);
  };

  const openEditItemDialog = (item) => {
    console.log('Edit item - full object:', item);  
    console.log('Edit item - dod_id:', item.dod_id); 

    setEditingItem(item);
    editItemForm.setValue('title', item.title);
    editItemForm.setValue('description', item.description || '');
    editItemForm.setValue('isRequired', item.is_required);
    editItemForm.setValue('order', item.order);
    setEditItemDialogOpen(true);
    handleItemMenuClose(item.id);
  };

  // Permission Functions
  const canManageParticipants = () => {
    return userRole === 'owner' || userRole === 'editor';
  };

  const canAddParticipants = () => {
    return userRole !== 'viewer';
  };

  const canRemoveParticipant = (participant) => {
    return canManageParticipants() && 
           participant.user?.id !== user?.id && 
           participant.role !== 'owner';
  };

  const canEditDoD = () => {
    return userRole === 'owner' || userRole === 'editor';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return 'error';
      case 'editor': return 'primary';
      case 'viewer': return 'default';
      default: return 'default';
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
          {project?.name || 'Project Details'}
        </Typography>
        <Typography variant="body1" color="textSecondary">
          {project?.description || 'Manage Definition of Done for this project'}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Chip
            label={`Your Role: ${userRole || 'Unknown'}`}
            color={getRoleColor(userRole)}
            size="small"
            variant="outlined"
          />
        </Box>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Definition of Done" icon={<AssignmentIcon />} />
          <Tab label={`Participants (${participants.length})`} icon={<PeopleIcon />} />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5">
              Definition of Done ({dods.length})
            </Typography>
            {canEditDoD() && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setDodDialogOpen(true)}
              >
                New DoD
              </Button>
            )}
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
                {canEditDoD() && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setDodDialogOpen(true)}
                  >
                    Create DoD
                  </Button>
                )}
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip
                            label={dod.is_active ? 'Active' : 'Inactive'}
                            color={dod.is_active ? 'success' : 'default'}
                            size="small"
                          />
                          {canEditDoD() && (
                            <IconButton
                              size="small"
                              onClick={(e) => handleDodMenuClick(e, dod.id)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          )}
                          <Menu
                            anchorEl={dodMenuAnchor[dod.id]}
                            open={Boolean(dodMenuAnchor[dod.id])}
                            onClose={() => handleDodMenuClose(dod.id)}
                          >
                            <MenuItem onClick={() => openEditDodDialog(dod)}>
                              <EditIcon sx={{ mr: 1 }} fontSize="small" />
                              Edit DoD
                            </MenuItem>
                            <MenuItem 
                              onClick={() => {
                                setDeleteDodDialog({ open: true, dod });
                                handleDodMenuClose(dod.id);
                              }}
                              sx={{ color: 'error.main' }}
                            >
                              <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                              Delete DoD
                            </MenuItem>
                          </Menu>
                        </Box>
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
                              {canEditDoD() && (
                                <ListItemSecondaryAction>
                                  <IconButton
                                    size="small"
                                    onClick={(e) => handleItemMenuClick(e, item.id)}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                  <Menu
                                    anchorEl={itemMenuAnchor[item.id]}
                                    open={Boolean(itemMenuAnchor[item.id])}
                                    onClose={() => handleItemMenuClose(item.id)}
                                  >
                                    <MenuItem onClick={() => openEditItemDialog(item)}>
                                      <EditIcon sx={{ mr: 1 }} fontSize="small" />
                                      Edit
                                    </MenuItem>
                                    <MenuItem 
                                      onClick={() => {
                                        setDeleteItemDialog({ open: true, item });
                                        handleItemMenuClose(item.id);
                                      }}
                                      sx={{ color: 'error.main' }}
                                    >
                                      <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
                                      Delete
                                    </MenuItem>
                                  </Menu>
                                </ListItemSecondaryAction>
                              )}
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
                      {canEditDoD() && (
                        <Button
                          size="small"
                          onClick={() => {
                            setSelectedDodId(dod.id);
                            setItemDialogOpen(true);
                          }}
                        >
                          Add Item
                        </Button>
                      )}
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
              Participants ({participants.length})
            </Typography>
            {canAddParticipants() && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setParticipantDialogOpen(true)}
              >
                Add Participant
              </Button>
            )}
          </Box>

          {participants.length === 0 ? (
            <Card sx={{ textAlign: 'center', py: 6 }}>
              <CardContent>
                <PeopleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No participants yet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Add team members to collaborate on this project
                </Typography>
                {canAddParticipants() && (
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setParticipantDialogOpen(true)}
                  >
                    Add Participant
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Joined</TableCell>
                    {canManageParticipants() && <TableCell>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                          {participant.user?.username || 'Unknown'}
                        </Box>
                      </TableCell>
                      <TableCell>{participant.user?.email || 'Unknown'}</TableCell>
                      <TableCell>
                        <Chip
                          label={participant.role}
                          color={getRoleColor(participant.role)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(participant.created_at).toLocaleDateString()}
                      </TableCell>
                      {canManageParticipants() && (
                        <TableCell>
                          {canRemoveParticipant(participant) && (
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteParticipantDialog({ 
                                open: true, 
                                participant 
                              })}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
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

      {/* Edit DoD Dialog */}
      <Dialog open={editDodDialogOpen} onClose={() => setEditDodDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={editDodForm.handleSubmit(handleEditDoD)}>
          <DialogTitle>Edit Definition of Done</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              margin="normal"
              {...editDodForm.register('title', { required: 'Title is required' })}
              error={!!editDodForm.formState.errors.title}
              helperText={editDodForm.formState.errors.title?.message}
            />
            <TextField
              fullWidth
              label="Description"
              margin="normal"
              multiline
              rows={3}
              {...editDodForm.register('description')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDodDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Update</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete DoD Dialog */}
      <Dialog
        open={deleteDodDialog.open}
        onClose={() => setDeleteDodDialog({ open: false, dod: null })}
      >
        <DialogTitle>Delete Definition of Done</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteDodDialog.dod?.title}"? 
            This will also delete all associated items and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDodDialog({ open: false, dod: null })} disabled={deletingDod}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteDoD}
            color="error"
            variant="contained"
            disabled={deletingDod}
            startIcon={deletingDod ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deletingDod ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
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
                  checked={itemForm.watch('isRequired') == true} // Par défaut true
                  onChange={(e) => itemForm.setValue('isRequired', e.target.checked)}
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

      {/* Edit Item Dialog */}
      <Dialog open={editItemDialogOpen} onClose={() => setEditItemDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={editItemForm.handleSubmit(handleEditItem)}>
          <DialogTitle>Edit DoD Item</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              margin="normal"
              {...editItemForm.register('title', { required: 'Title is required' })}
              error={!!editItemForm.formState.errors.title}
              helperText={editItemForm.formState.errors.title?.message}
            />
            <TextField
              fullWidth
              label="Description"
              margin="normal"
              multiline
              rows={2}
              {...editItemForm.register('description')}
            />
            <TextField
              fullWidth
              label="Order"
              type="number"
              margin="normal"
              {...editItemForm.register('order', { valueAsNumber: true })}
            />
            <FormControlLabel
              control={
                <Checkbox 
                  {...editItemForm.register('isRequired')}
                  checked={editItemForm.watch('isRequired')} // ← Ajoutez cette ligne
                />
              }
              label="Required item"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditItemDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">Update</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Item Dialog */}
      <Dialog
        open={deleteItemDialog.open}
        onClose={() => setDeleteItemDialog({ open: false, item: null })}
      >
        <DialogTitle>Delete DoD Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deleteItemDialog.item?.title}"?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteItemDialog({ open: false, item: null })} disabled={deletingItem}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteItem}
            color="error"
            variant="contained"
            disabled={deletingItem}
            startIcon={deletingItem ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deletingItem ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
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

      {/* Delete Participant Dialog */}
      <Dialog
        open={deleteParticipantDialog.open}
        onClose={() => setDeleteParticipantDialog({ open: false, participant: null })}
      >
        <DialogTitle>Remove Participant</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove {deleteParticipantDialog.participant?.user?.username} from this project?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteParticipantDialog({ open: false, participant: null })} disabled={deletingParticipant}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteParticipant}
            color="error"
            variant="contained"
            disabled={deletingParticipant}
            startIcon={deletingParticipant ? <CircularProgress size={16} /> : <DeleteIcon />}
          >
            {deletingParticipant ? 'Removing...' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProjectDetail;