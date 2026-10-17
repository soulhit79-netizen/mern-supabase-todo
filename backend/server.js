require('dotenv').config();
const express = require('express');
const cors = require('cors');
const supabase = require('./supabaseClient');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// -------------------------------------------------------------
// Health Check & Credentials Verification Route
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  const isConfigured = 
    Boolean(process.env.SUPABASE_URL) && 
    Boolean(process.env.SUPABASE_KEY) && 
    !process.env.SUPABASE_URL.includes('your_supabase');

  res.json({
    status: 'ok',
    message: 'Backend server is running',
    supabaseConfigured: isConfigured,
  });
});

// -------------------------------------------------------------
// [R] READ: Fetch all Todos
// Route: GET /api/todos
// -------------------------------------------------------------
app.get('/api/todos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error (Fetch):', error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json(data);
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Server error while fetching todos' });
  }
});

// -------------------------------------------------------------
// [C] CREATE: Add a new Todo
// Route: POST /api/todos
// Body: { title: string }
// -------------------------------------------------------------
app.post('/api/todos', async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data, error } = await supabase
      .from('todos')
      .insert([
        { 
          title: title.trim(), 
          is_completed: false 
        }
      ])
      .select();

    if (error) {
      console.error('Supabase Error (Create):', error.message);
      return res.status(500).json({ error: error.message });
    }

    // Return the newly created item
    res.status(201).json(data[0]);
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Server error while creating todo' });
  }
});

// -------------------------------------------------------------
// [U] UPDATE: Update a Todo (Toggle completed or update title)
// Route: PUT /api/todos/:id
// Body: { title?: string, is_completed?: boolean }
// -------------------------------------------------------------
app.put('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, is_completed } = req.body;

    const updates = {};
    if (typeof title === 'string') updates.title = title.trim();
    if (typeof is_completed === 'boolean') updates.is_completed = is_completed;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase Error (Update):', error.message);
      return res.status(500).json({ error: error.message });
    }

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(data[0]);
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Server error while updating todo' });
  }
});

// -------------------------------------------------------------
// [D] DELETE: Remove a Todo
// Route: DELETE /api/todos/:id
// -------------------------------------------------------------
app.delete('/api/todos/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase Error (Delete):', error.message);
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Todo deleted successfully', id });
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).json({ error: 'Server error while deleting todo' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

