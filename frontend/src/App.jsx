import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  Plus, 
  Save, 
  X, 
  RefreshCw, 
  Database, 
  Layers, 
  AlertCircle,
  Check
} from 'lucide-react';
import './App.css';

const API_BASE = '/api';

export default function App() {
  const [todos, setTodos] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'completed'
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState({ online: false, configured: false });
  const [notification, setNotification] = useState(null);

  // Helper to show temporary notification toasts
  const notify = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // 1. Health check to detect backend & Supabase configuration
  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) {
        const data = await res.json();
        setServerStatus({
          online: true,
          configured: Boolean(data.supabaseConfigured),
        });
      } else {
        setServerStatus({ online: false, configured: false });
      }
    } catch {
      setServerStatus({ online: false, configured: false });
    }
  };

  // -------------------------------------------------------------
  // [R] READ: Fetch all Todos (GET /api/todos)
  // -------------------------------------------------------------
  const fetchTodos = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/todos`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch todos');
      }
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error(err);
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchTodos();
  }, []);

  // -------------------------------------------------------------
  // [C] CREATE: Add new Todo (POST /api/todos)
  // -------------------------------------------------------------
  const handleAddTodo = async (e) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;

    try {
      setActionLoading(true);
      const res = await fetch(`${API_BASE}/todos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create todo');

      setTodos((prev) => [data, ...prev]);
      setNewTitle('');
      notify('Todo created successfully [C - POST]', 'success');
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // -------------------------------------------------------------
  // [U] UPDATE: Toggle Todo Completion (PUT /api/todos/:id)
  // -------------------------------------------------------------
  const handleToggleComplete = async (todo) => {
    try {
      const updatedStatus = !todo.is_completed;
      const res = await fetch(`${API_BASE}/todos/${todo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_completed: updatedStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      setTodos((prev) =>
        prev.map((item) => (item.id === todo.id ? data : item))
      );
      notify(`Todo marked as ${updatedStatus ? 'completed' : 'pending'} [U - PUT]`, 'success');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // -------------------------------------------------------------
  // [U] UPDATE: Edit Todo Title (PUT /api/todos/:id)
  // -------------------------------------------------------------
  const startEditing = (todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleSaveEdit = async (id) => {
    const trimmed = editTitle.trim();
    if (!trimmed) {
      notify('Title cannot be empty', 'error');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmed }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update title');

      setTodos((prev) =>
        prev.map((item) => (item.id === id ? data : item))
      );
      setEditingId(null);
      setEditTitle('');
      notify('Todo title updated [U - PUT]', 'success');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // -------------------------------------------------------------
  // [D] DELETE: Remove Todo (DELETE /api/todos/:id)
  // -------------------------------------------------------------
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/todos/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete todo');

      setTodos((prev) => prev.filter((item) => item.id !== id));
      notify('Todo deleted [D - DELETE]', 'success');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  // Filtered todos based on active tab
  const filteredTodos = todos.filter((todo) => {
    if (filter === 'active') return !todo.is_completed;
    if (filter === 'completed') return todo.is_completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.is_completed).length;
  const completedCount = todos.filter((t) => t.is_completed).length;

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.type === 'error' ? (
            <AlertCircle size={18} />
          ) : (
            <Check size={18} />
          )}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Main Card */}
      <div className="todo-card">
        {/* Header */}
        <header className="card-header">
          <div className="header-title-row">
            <div className="logo-group">
              <span className="logo-icon"><Layers size={22} /></span>
              <div>
                <h1>Minimal Todo</h1>
                <p className="subtitle">MERN + Supabase CRUD Demo</p>
              </div>
            </div>
            <button 
              className="icon-button" 
              onClick={() => { checkHealth(); fetchTodos(); }} 
              title="Refresh Todos [R - GET]"
            >
              <RefreshCw size={17} className={loading ? 'spin' : ''} />
            </button>
          </div>

          {/* Supabase Status Alert */}
          {!serverStatus.configured && (
            <div className="status-banner warning">
              <Database size={16} />
              <div className="status-banner-text">
                <strong>Supabase Setup Needed:</strong>
                <span> Add your credentials to <code>backend/.env</code> and run <code>supabase_setup.sql</code> in your Supabase SQL Editor.</span>
              </div>
            </div>
          )}

          {serverStatus.configured && (
            <div className="status-banner success">
              <CheckCircle2 size={16} />
              <span>Connected to Supabase PostgreSQL</span>
            </div>
          )}

          {/* CRUD Legend Pills */}
          <div className="crud-legend">
            <span className="crud-pill c" title="Create with POST"><strong>C</strong>reate</span>
            <span className="crud-pill r" title="Read with GET"><strong>R</strong>ead</span>
            <span className="crud-pill u" title="Update with PUT"><strong>U</strong>pdate</span>
            <span className="crud-pill d" title="Delete with DELETE"><strong>D</strong>elete</span>
          </div>
        </header>

        {/* Input Form [C - CREATE] */}
        <form onSubmit={handleAddTodo} className="todo-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="What needs to be done? (Press Enter to Add)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              disabled={actionLoading}
              autoFocus
            />
            <button
              type="submit"
              className="submit-button"
              disabled={actionLoading || !newTitle.trim()}
              title="Create Todo [POST /api/todos]"
            >
              <Plus size={18} />
              <span>Add</span>
            </button>
          </div>
        </form>

        {/* Filter Tabs */}
        <div className="filter-bar">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({todos.length})
            </button>
            <button
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active ({activeCount})
            </button>
            <button
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Done ({completedCount})
            </button>
          </div>
        </div>

        {/* Todo List [R - READ] */}
        <div className="todo-list-container">
          {loading && todos.length === 0 ? (
            <div className="state-message">
              <RefreshCw size={24} className="spin" />
              <p>Fetching todos from Supabase...</p>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="state-message empty">
              <p>No tasks found in this view.</p>
              <small>Add a task above to perform your first CREATE operation!</small>
            </div>
          ) : (
            <ul className="todo-list">
              {filteredTodos.map((todo) => {
                const isEditing = editingId === todo.id;

                return (
                  <li 
                    key={todo.id} 
                    className={`todo-item ${todo.is_completed ? 'completed' : ''}`}
                  >
                    {isEditing ? (
                      /* In-line Edit Mode [U - UPDATE] */
                      <div className="edit-mode-container">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(todo.id);
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          autoFocus
                          className="edit-input"
                        />
                        <div className="edit-actions">
                          <button
                            className="action-btn save"
                            onClick={() => handleSaveEdit(todo.id)}
                            title="Save changes"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            className="action-btn cancel"
                            onClick={cancelEditing}
                            title="Cancel editing"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Normal Display Mode */
                      <>
                        <button
                          className="toggle-status-btn"
                          onClick={() => handleToggleComplete(todo)}
                          title={todo.is_completed ? 'Mark as pending [U]' : 'Mark as complete [U]'}
                        >
                          {todo.is_completed ? (
                            <CheckCircle2 size={20} className="check-icon completed" />
                          ) : (
                            <Circle size={20} className="check-icon" />
                          )}
                        </button>

                        <span 
                          className="todo-text"
                          onDoubleClick={() => startEditing(todo)}
                          title="Double-click to edit title"
                        >
                          {todo.title}
                        </span>

                        <div className="item-actions">
                          <button
                            className="action-btn edit"
                            onClick={() => startEditing(todo)}
                            title="Edit task [U - UPDATE]"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(todo.id)}
                            title="Delete task [D - DELETE]"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer Summary */}
        <footer className="card-footer">
          <span>
            {activeCount} {activeCount === 1 ? 'task' : 'tasks'} remaining
          </span>
          <span className="tech-badge">Supabase DB</span>
        </footer>
      </div>
    </div>
  );
}
