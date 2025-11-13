import React, { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser, moveUser, sendPasswordEmail } from '../services/usersApi';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    is_admin: false,
    send_email: false
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersList = await getUsers();
      setUsers(usersList);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    try {
      if (editingUser) {
        // Update existing user
        const updateData = {
          email: formData.email || null,
          is_admin: formData.is_admin,
          send_email: formData.send_email
        };
        
        // Don't send username if it's admin (cannot be changed)
        if (editingUser.username !== 'admin') {
          updateData.username = formData.username;
        }
        
        if (formData.password) {
          updateData.password = formData.password;
        }

        await updateUser(editingUser.id, updateData);
        setMessage({ type: 'success', text: 'User updated successfully!' });
      } else {
        // Create new user
        if (!formData.password) {
          setMessage({ type: 'error', text: 'Password is required for new users' });
          return;
        }

        await createUser({
          username: formData.username,
          email: formData.email || null,
          password: formData.password,
          is_admin: formData.is_admin,
          send_email: formData.send_email
        });
        setMessage({ type: 'success', text: 'User created successfully!' });
      }

      // Send email if requested
      if (formData.send_email && formData.email) {
        try {
          if (editingUser && formData.password) {
            await sendPasswordEmail(editingUser.id, formData.password);
          } else if (!editingUser) {
            // For new users, we need to get the created user ID
            const updatedUsers = await getUsers();
            const newUser = updatedUsers.find(u => u.username === formData.username);
            if (newUser) {
              await sendPasswordEmail(newUser.id, formData.password);
            }
          }
        } catch (emailError) {
          console.error('Failed to send email:', emailError);
          setMessage({ 
            type: 'warning', 
            text: `User ${editingUser ? 'updated' : 'created'} but failed to send email: ${emailError.message}` 
          });
        }
      }

      resetForm();
      loadUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      is_admin: user.is_admin === 1,
      send_email: false
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      await deleteUser(id);
      setMessage({ type: 'success', text: 'User deleted successfully!' });
      loadUsers();
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleMove = async (id, direction) => {
    try {
      const updatedUsers = await moveUser(id, direction);
      setUsers(updatedUsers);
      setMessage({ type: 'success', text: 'User moved successfully!' });
      setTimeout(() => setMessage(null), 2000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const handleSendPassword = async (user) => {
    if (!user.email) {
      setMessage({ type: 'error', text: 'User does not have an email address' });
      return;
    }

    const password = prompt('Enter the password to send to the user:');
    if (!password) {
      return;
    }

    try {
      await sendPasswordEmail(user.id, password);
      setMessage({ type: 'success', text: 'Password email sent successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message });
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      is_admin: false,
      send_email: false
    });
    setEditingUser(null);
    setShowAddForm(false);
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">User Management</h2>
        {!showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            + Add User
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded ${
          message.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700' 
            : message.type === 'warning'
            ? 'bg-yellow-100 border border-yellow-400 text-yellow-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {showAddForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {editingUser ? 'Edit User' : 'Add New User'}
            </h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={editingUser && editingUser.username === 'admin'}
                className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  editingUser && editingUser.username === 'admin' ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
              />
              {editingUser && editingUser.username === 'admin' && (
                <p className="mt-1 text-sm text-gray-500 italic">
                  Admin username cannot be changed
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {editingUser ? '(leave empty to keep current)' : '*'}
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!editingUser}
                minLength={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="is_admin"
                id="is_admin"
                checked={formData.is_admin}
                onChange={handleInputChange}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="is_admin" className="text-sm font-medium text-gray-700">
                Admin (has access to settings)
              </label>
            </div>

            {formData.email && (
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="send_email"
                  id="send_email"
                  checked={formData.send_email}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="send_email" className="text-sm font-medium text-gray-700">
                  Send password to email
                </label>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user, index) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleMove(user.id, 'up')}
                        disabled={index === 0}
                        className={`p-1 rounded ${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMove(user.id, 'down')}
                        disabled={index === users.length - 1}
                        className={`p-1 rounded ${index === users.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-200'}`}
                        title="Move down"
                      >
                        ↓
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_admin === 1 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.is_admin === 1 ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                      {user.email && (
                        <button
                          onClick={() => handleSendPassword(user)}
                          className="text-green-600 hover:text-green-900"
                        >
                          Send Password
                        </button>
                      )}
                      {user.username !== 'admin' && (
                        <button
                          onClick={() => handleDelete(user.id, user.username)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                      {user.username === 'admin' && (
                        <span className="text-gray-400 text-xs italic" title="Admin user cannot be deleted">
                          Protected
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;

