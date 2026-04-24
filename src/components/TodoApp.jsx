import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  PlusIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  PencilIcon,
  SparklesIcon,
  StarIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const API_URL = import.meta.env.VITE_API_URL || 'https://todolist-backend-4q3m.onrender.com/api';

// Your Razorpay Test Keys
const RAZORPAY_KEY_ID = 'rzp_test_SfeLWvcdE4fPbT';

export default function TodoApp({ user, setUser }) {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(user?.isPremium || false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [upgrading, setUpgrading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch(`${API_URL}/todos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setTodos(data);
    } catch (error) {
      toast.error('Error loading todos');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/todos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTodo, priority, completed: false })
      });
      
      if (!response.ok) throw new Error('Failed to add');
      const todo = await response.json();
      setTodos([todo, ...todos]);
      setNewTodo('');
      toast.success('Task added!');
    } catch (error) {
      toast.error('Error adding task');
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ completed: !completed })
      });
      
      if (!response.ok) throw new Error('Failed to update');
      setTodos(todos.map(todo => 
        todo._id === id ? { ...todo, completed: !completed } : todo
      ));
      toast.success('Task updated');
    } catch (error) {
      toast.error('Error updating task');
    }
  };

  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error('Failed to delete');
      setTodos(todos.filter(todo => todo._id !== id));
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Error deleting task');
    }
  };

  const updateTodo = async (id) => {
    if (!editText.trim()) {
      setEditingId(null);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/todos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: editText })
      });
      
      if (!response.ok) throw new Error('Failed to update');
      setTodos(todos.map(todo => 
        todo._id === id ? { ...todo, title: editText } : todo
      ));
      setEditingId(null);
      setEditText('');
      toast.success('Task updated');
    } catch (error) {
      toast.error('Error updating task');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleUpgrade = async () => {
    setUpgrading(true);
    try {
      // Create order on your backend
      const response = await fetch(`${API_URL}/premium/create-order`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to create order');
      }
      
      const { order } = await response.json();
      
      // Configure Razorpay checkout
      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Task Clarity Premium',
        description: 'Unlock unlimited tasks & priority support',
        order_id: order.id,
        handler: async (response) => {
          try {
            // Verify payment on your backend
            const verifyResponse = await fetch(`${API_URL}/premium/verify`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            
            if (verifyResponse.ok) {
              const data = await verifyResponse.json();
              setIsPremium(true);
              // Update user data in localStorage
              const updatedUser = { ...user, isPremium: true };
              localStorage.setItem('user', JSON.stringify(updatedUser));
              setUser(updatedUser);
              toast.success('Welcome to Premium! 🎉 You now have unlimited access.');
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            toast.error('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
            setUpgrading(false);
          }
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const priorityColors = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-white">Task Clarity</h1>
              <p className="text-blue-100">Welcome back, {user.name}</p>
            </div>
            <div className="flex gap-3">
              {!isPremium && (
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {upgrading ? (
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                  ) : (
                    <SparklesIcon className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">{upgrading ? 'Processing...' : 'Upgrade'}</span>
                </button>
              )}
              {isPremium && (
                <div className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-lg">
                  <StarIcon className="w-5 h-5" />
                  <span>Premium</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-white transition"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Add Todo Form */}
          <form onSubmit={addTodo} className="p-6 border-b">
            <div className="flex gap-3">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="What needs to be done?"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition flex items-center gap-2"
              >
                <PlusIcon className="w-5 h-5" />
                Add
              </button>
            </div>
          </form>

          {/* Filters */}
          <div className="flex gap-2 p-4 border-b bg-gray-50">
            {['all', 'active', 'completed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1 rounded-lg capitalize transition ${
                  filter === f 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Todo List */}
          <div className="divide-y max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading tasks...</div>
            ) : filteredTodos.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No tasks found. Add one above!</div>
            ) : (
              filteredTodos.map(todo => (
                <div key={todo._id} className="p-4 hover:bg-gray-50 transition group">
                  {editingId === todo._id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 px-3 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => updateTodo(todo._id)}
                        className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleTodo(todo._id, todo.completed)}
                        className={`flex-shrink-0 w-6 h-6 rounded-full border-2 transition ${
                          todo.completed 
                            ? 'bg-green-500 border-green-500 flex items-center justify-center' 
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {todo.completed && <CheckCircleIcon className="w-5 h-5 text-white" />}
                      </button>
                      
                      <div className="flex-1">
                        <p className={`${todo.completed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {todo.title}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[todo.priority]}`}>
                          {todo.priority}
                        </span>
                      </div>
                      
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button
                          onClick={() => {
                            setEditingId(todo._id);
                            setEditText(todo.title);
                          }}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <PencilIcon className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => deleteTodo(todo._id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Stats */}
          <div className="p-4 bg-gray-50 text-sm text-gray-600 flex justify-between">
            <span>{todos.filter(t => !t.completed).length} tasks remaining</span>
            <span>{todos.filter(t => t.completed).length} completed</span>
            {isPremium && (
              <span className="text-yellow-600 flex items-center gap-1">
                <StarIcon className="w-4 h-4" />
                Premium Member
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}