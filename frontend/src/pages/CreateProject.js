import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { projectService } from '../services/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const CreateProject = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      const response = await projectService.createProject(data.name, data.description);
      const project = response.data.project;
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        sx={{ mb: 2 }}
      >
        Back
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Create New Project
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Set up a new project to manage your Definition of Done
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <TextField
            fullWidth
            label="Project Name"
            margin="normal"
            placeholder="Enter project name"
            {...register('name', {
              required: 'Project name is required',
              minLength: {
                value: 3,
                message: 'Project name must be at least 3 characters',
              },
              maxLength: {
                value: 100,
                message: 'Project name must be less than 100 characters',
              },
            })}
            error={!!errors.name}
            helperText={errors.name?.message}
          />

          <TextField
            fullWidth
            label="Description"
            margin="normal"
            multiline
            rows={4}
            placeholder="Describe your project (optional)"
            {...register('description', {
              maxLength: {
                value: 500,
                message: 'Description must be less than 500 characters',
              },
            })}
            error={!!errors.description}
            helperText={errors.description?.message || 'Optional: Provide a brief description of your project'}
          />

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ flexGrow: 1 }}
            >
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Help Section */}
      <Paper elevation={1} sx={{ p: 3, mt: 3, bgcolor: 'background.default' }}>
        <Typography variant="h6" gutterBottom>
          💡 Getting Started
        </Typography>
        <Typography variant="body2" color="textSecondary">
          After creating your project, you can:
        </Typography>
        <Box component="ul" sx={{ mt: 1, pl: 2 }}>
          <Typography component="li" variant="body2" color="textSecondary">
            Add team members as participants
          </Typography>
          <Typography component="li" variant="body2" color="textSecondary">
            Create multiple Definition of Done templates
          </Typography>
          <Typography component="li" variant="body2" color="textSecondary">
            Customize DoD items for different types of work
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateProject;