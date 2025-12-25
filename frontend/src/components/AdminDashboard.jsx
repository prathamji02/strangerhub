import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const api = axios.create({ baseURL: API_URL });

function Modal({ isOpen, onClose, children }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md relative">
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white text-2xl">&times;</button>
                {children}
            </div>
        </div>
    );
}

export default function AdminDashboard({ onBack }) {
    const [adminView, setAdminView] = useState('reports');
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [userChats, setUserChats] = useState([]);
    const [file, setFile] = useState(null);
    const [uploadMessage, setUploadMessage] = useState('');
    const [newUser, setNewUser] = useState({ enrollment_no: '', name: '', email: '', phone_no: '', gender: '', college: '' });
    const [registerMessage, setRegisterMessage] = useState('');
    const [modal, setModal] = useState({ type: null, data: null });
    const [freezeDuration, setFreezeDuration] = useState(7);
    const [messageContent, setMessageContent] = useState('');

    const fetchData = async (type) => {
        setSelectedItem(null);
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const { data } = await api.get(`/admin/${type}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (type === 'reports') setReports(data);
            if (type === 'users') setUsers(data);
        } catch (error) {
            console.error(`Failed to fetch ${type}`, error);
            toast.error(`Failed to fetch ${type}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(adminView);
    }, [adminView]);

    const handleBanUser = async (userId, fakeName, currentStatus) => {
        const action = currentStatus === 'BANNED' ? 'Unban' : 'Ban';
        const confirmationMessage = `Are you sure you want to ${action.toLowerCase()} ${fakeName}?`;

        toast((t) => (
            <div className="flex flex-col gap-2">
                <p>{confirmationMessage}</p>
                <div className="flex gap-2">
                    <button
                        className={`w-full ${action === 'Ban' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'} text-white font-bold py-1 px-2 rounded`}
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const token = localStorage.getItem('authToken');
                            await toast.promise(
                                api.post('/admin/ban', { userId }, { headers: { Authorization: `Bearer ${token}` } }),
                                {
                                    loading: `${action}ning user...`,
                                    success: `${fakeName} has been ${action.toLowerCase()}ned.`,
                                    error: `Failed to ${action.toLowerCase()} user.`,
                                }
                            );
                            setSelectedItem(null);
                            fetchData(adminView);
                        }}
                    >
                        Confirm {action}
                    </button>
                    <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded" onClick={() => toast.dismiss(t.id)}>Cancel</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const handleDeleteLog = async (reportId) => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p>Delete this log permanently?</p>
                <div className="flex gap-2">
                    <button
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const token = localStorage.getItem('authToken');
                            await toast.promise(
                                api.delete(`/admin/reports/${reportId}`, { headers: { Authorization: `Bearer ${token}` } }),
                                {
                                    loading: 'Deleting log...',
                                    success: 'Log has been deleted.',
                                    error: 'Failed to delete log.',
                                }
                            );
                            fetchData('reports');
                        }}
                    >
                        Confirm
                    </button>
                    <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded" onClick={() => toast.dismiss(t.id)}>Cancel</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    const handleFreezeUser = async (e) => {
        e.preventDefault();
        const { userId, fakeName } = modal.data;
        const token = localStorage.getItem('authToken');
        await toast.promise(
            api.post('/admin/freeze', { userId, durationInDays: freezeDuration }, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: 'Updating freeze status...',
                success: `Freeze status updated for ${fakeName}.`,
                error: 'Failed to update status.',
            }
        );
        setModal({ type: null, data: null });
        fetchData('users');
    };

    const handleSendMessageToUser = async (e) => {
        e.preventDefault();
        const { userId, fakeName } = modal.data;
        const token = localStorage.getItem('authToken');
        await toast.promise(
            api.post('/admin/message', { targetUserId: userId, content: messageContent }, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: `Sending message to ${fakeName}...`,
                success: `Message sent.`,
                error: 'Failed to send message.',
            }
        );
        setMessageContent('');
        setModal({ type: null, data: null });
    };

    const handleRegisterUser = async (e) => {
        e.preventDefault();
        setRegisterMessage('Registering...');
        try {
            const token = localStorage.getItem('authToken');
            const { data } = await api.post('/admin/register', newUser, { headers: { Authorization: `Bearer ${token}` } });
            setRegisterMessage(data.message);
            toast.success(data.message);
            setNewUser({ enrollment_no: '', name: '', email: '', phone_no: '', gender: '', college: '' });
            fetchData('users');
        } catch (error) {
            const err = error.response?.data?.error || 'Registration failed.';
            setRegisterMessage(err);
            toast.error(err);
        }
    };

    const handleViewUserChats = async (user) => {
        setSelectedItem(user);
        setUserChats([]);
        try {
            const token = localStorage.getItem('authToken');
            const { data } = await api.get(`/admin/chats/${user.id}`, { headers: { Authorization: `Bearer ${token}` } });
            setUserChats(data);
        } catch (error) {
            console.error("Failed to fetch user chats", error);
            toast.error("Failed to fetch user chats");
        }
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        if (!file) {
            setUploadMessage('Please select a file first.');
            return;
        }
        const formData = new FormData();
        formData.append('userFile', file);
        try {
            const token = localStorage.getItem('authToken');
            setUploadMessage('Uploading...');
            const { data } = await api.post('/admin/users/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` }
            });
            setUploadMessage(data.message);
            toast.success(data.message);
            fetchData('users');
        } catch (error) {
            const err = error.response?.data?.error || 'File upload failed.';
            setUploadMessage(err);
            toast.error(err);
        }
    };

    const handleEditUser = async (e) => {
        e.preventDefault();
        const { id, name, enrollment_no, email, phone_no, gender, college, fake_name } = modal.data;
        try {
            const token = localStorage.getItem('authToken');
            const { data } = await api.put(`/admin/users/${id}`, { name, enrollment_no, email, phone_no, gender, college, fake_name }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success(data.message);
            setModal({ type: null, data: null });
            fetchData('users');
        } catch (error) {
            const err = error.response?.data?.error || 'Failed to update user.';
            toast.error(err);
        }
    };

    const handleDeleteUser = async (user) => {
        toast((t) => (
            <div className="flex flex-col gap-2">
                <p>Delete user <b>{user.name}</b> permanently?</p>
                <div className="flex gap-2">
                    <button
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const token = localStorage.getItem('authToken');
                            await toast.promise(
                                api.delete(`/admin/users/${user.id}`, { headers: { Authorization: `Bearer ${token}` } }),
                                {
                                    loading: 'Deleting user...',
                                    success: 'User deleted successfully.',
                                    error: 'Failed to delete user.',
                                }
                            );
                            fetchData('users');
                        }}
                    >
                        Confirm Delete
                    </button>
                    <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded" onClick={() => toast.dismiss(t.id)}>Cancel</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    if (selectedItem) {
        return (
            <div className="bg-gray-900 text-white min-h-screen p-4 pt-8">
                <div className="w-full max-w-2xl mx-auto">
                    <button onClick={() => setSelectedItem(null)} className="mb-4 text-blue-400 hover:underline">&larr; Back to List</button>
                    {adminView === 'reports' ? (
                        <>
                            <h1 className="text-3xl font-bold mb-4">Report Details</h1>
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <p><strong>Reporter:</strong> {selectedItem.reporter?.fake_name || 'System'}</p>
                                <p><strong>Reported User:</strong> {selectedItem.reported?.fake_name || 'N/A'}</p>
                                <p><strong>Reason:</strong> {selectedItem.reason || 'N/A'}</p>
                                <p><strong>Type:</strong> {selectedItem.logType}</p>
                                <p><strong>Date:</strong> {new Date(selectedItem.createdAt).toLocaleString()}</p>
                                <h2 className="text-xl font-bold mt-4 mb-2">Chat History</h2>
                                <div className="bg-gray-700 p-3 rounded h-80 overflow-y-auto">
                                    {Array.isArray(selectedItem.chatHistory) && selectedItem.chatHistory.map((msg, i) => (
                                        <p key={i} className="mb-1"><strong>{msg.sender}:</strong> {msg.text}</p>
                                    ))}
                                </div>
                                {selectedItem.reported && (
                                    <button onClick={() => handleBanUser(selectedItem.reportedId, selectedItem.reported.fake_name, selectedItem.reported.status)} className="w-full mt-4 p-3 rounded bg-red-700 font-bold hover:bg-red-800">
                                        Ban {selectedItem.reported.fake_name}
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold mb-4">User Details</h1>
                            <div className="bg-gray-800 p-4 rounded-lg">
                                <p><strong>Username:</strong> {selectedItem.fake_name}</p>
                                <p><strong>Full Name:</strong> {selectedItem.name}</p>
                                <p><strong>Enrollment No:</strong> {selectedItem.enrollment_no}</p>
                                <p><strong>Status:</strong> {selectedItem.status}</p>
                                <p><strong>Email:</strong> {selectedItem.email}</p>
                                <p><strong>Phone No:</strong> {selectedItem.phone_no}</p>
                                <p><strong>Gender:</strong> {selectedItem.gender}</p>
                                <p><strong>College:</strong> {selectedItem.college || 'N/A'}</p>
                                <h2 className="text-xl font-bold mt-4 mb-2">Friend List ({userChats.length})</h2>
                                <div className="bg-gray-700 p-3 rounded h-48 overflow-y-auto">
                                    {userChats.length > 0 ? (
                                        <ul>{userChats.map(chat => <li key={chat.id}>{chat.participants[0]?.fake_name}</li>)}</ul>
                                    ) : <p>No saved chats.</p>}
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button onClick={() => setModal({ type: 'edit', data: selectedItem })} className="flex-1 p-3 rounded bg-blue-600 font-bold hover:bg-blue-700">Edit</button>
                                    <button onClick={() => handleDeleteUser(selectedItem)} className="flex-1 p-3 rounded bg-red-900 font-bold hover:bg-red-950">Delete</button>
                                    <button onClick={() => handleBanUser(selectedItem.id, selectedItem.fake_name, selectedItem.status)} className="flex-1 p-3 rounded bg-red-700 font-bold hover:bg-red-800">
                                        {selectedItem.status === 'BANNED' ? 'Unban' : 'Ban'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gray-900 text-white min-h-screen p-4 pt-8">
            <div className="w-full max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-bold">Admin Dashboard</h1>
                    <div>
                        <button onClick={() => fetchData(adminView)} className="mr-4 px-4 py-2 rounded bg-gray-600 hover:bg-gray-700">Refresh Data</button>
                        <button onClick={onBack} className="text-blue-400 hover:underline">Back to Home &rarr;</button>
                    </div>
                </div>

                <div className="flex border-b border-gray-700 mb-4">
                    <button onClick={() => setAdminView('reports')} className={`py-2 px-4 ${adminView === 'reports' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>Reports & Logs</button>
                    <button onClick={() => setAdminView('users')} className={`py-2 px-4 ${adminView === 'users' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>Users</button>
                </div>

                {loading && <p>Loading...</p>}

                {adminView === 'reports' && !loading && (
                    <div className="bg-gray-800 rounded-lg shadow-lg">
                        <ul className="divide-y divide-gray-700">
                            {reports.map(report => (
                                <li key={report.id} className="p-4 hover:bg-gray-700">
                                    <div className="flex justify-between items-center">
                                        <div onClick={() => setSelectedItem(report)} className="flex-grow cursor-pointer">
                                            <p><strong>{report.reporter?.fake_name || 'System'}</strong> &rarr; <strong>{report.reported?.fake_name || 'N/A'}</strong></p>
                                            <p className="text-sm text-gray-400">{report.reason || 'No review given.'}</p>
                                        </div>
                                        <div className="text-right flex items-center gap-4">
                                            <div>
                                                <p className={`text-sm font-bold ${report.logType === 'USER_REPORT' ? 'text-yellow-400' : 'text-gray-500'}`}>{report.logType}</p>
                                                <p className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <button onClick={() => handleDeleteLog(report.id)} className="p-2 rounded-full bg-red-800 hover:bg-red-700">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.22-2.365.468a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {adminView === 'users' && !loading && (
                    <div>
                        <div className="bg-gray-800 p-4 rounded-lg mb-6">
                            <h2 className="text-xl font-bold mb-2">Upload User Data (.xlsx)</h2>
                            <form onSubmit={handleFileUpload} className="flex gap-4 items-center">
                                <input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".xlsx, .xls" className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                <button type="submit" className="px-4 py-2 rounded bg-blue-600 font-bold hover:bg-blue-700">Upload</button>
                            </form>
                            {uploadMessage && <p className="mt-2 text-sm">{uploadMessage}</p>}
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg mb-6">
                            <h2 className="text-xl font-bold mb-4">Register New User</h2>
                            <form onSubmit={handleRegisterUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input value={newUser.enrollment_no} onChange={e => setNewUser({ ...newUser, enrollment_no: e.target.value })} placeholder="Enrollment No" className="p-2 bg-gray-700 rounded" required />
                                <input value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="Full Name" className="p-2 bg-gray-700 rounded" required />
                                <input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="Email" type="email" className="p-2 bg-gray-700 rounded" required />
                                <input value={newUser.phone_no} onChange={e => setNewUser({ ...newUser, phone_no: e.target.value })} placeholder="Phone No" className="p-2 bg-gray-700 rounded" required />
                                <input value={newUser.gender} onChange={e => setNewUser({ ...newUser, gender: e.target.value })} placeholder="Gender" className="p-2 bg-gray-700 rounded" required />
                                <select
                                    value={newUser.college || ''}
                                    onChange={e => setNewUser({ ...newUser, college: e.target.value })}
                                    className="p-2 bg-gray-700 rounded text-white"
                                    required
                                >
                                    <option value="" disabled>Select College</option>
                                    <option value="MAIT">MAIT</option>
                                    <option value="MSIT">MSIT</option>
                                    <option value="BVCOE">BVCOE</option>
                                    <option value="GTBIT">GTBIT</option>
                                    <option value="ADGITM">ADGITM</option>
                                    <option value="BPIT">BPIT</option>
                                    <option value="OTHERS">Others</option>
                                </select>
                                <button type="submit" className="p-2 rounded bg-green-600 font-bold hover:bg-green-700">Register User</button>
                            </form>
                            {registerMessage && <p className="mt-2 text-sm">{registerMessage}</p>}
                        </div>
                        <div className="bg-gray-800 rounded-lg shadow-lg overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-700">
                                <thead className="bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Full Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Username</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rating</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-700">
                                    {users.map(user => (
                                        <tr key={user.id} className="hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium">{user.name}</div>
                                                <div className="text-xs text-gray-400">{user.enrollment_no}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{user.fake_name || 'Not Set'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.status === 'BANNED' ? 'bg-red-900 text-red-300' :
                                                    user.status === 'FROZEN' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'
                                                    }`}>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                                ★ {user.averageRating.toFixed(1)} ({user.ratingCount})
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-4">
                                                <button onClick={() => handleViewUserChats(user)} className="text-indigo-400 hover:text-indigo-600">View</button>
                                                <button onClick={() => setModal({ type: 'edit', data: user })} className="text-yellow-400 hover:text-yellow-600">Edit</button>
                                                <button onClick={() => setModal({ type: 'freeze', data: { userId: user.id, fakeName: user.fake_name || user.name } })} className="text-blue-400 hover:text-blue-600">Freeze</button>
                                                <button onClick={() => handleDeleteUser(user)} className="text-red-900 hover:text-red-700">Delete</button>
                                                <button onClick={() => handleBanUser(user.id, user.fake_name || user.name, user.status)} className={`${user.status === 'BANNED' ? 'text-yellow-400 hover:text-yellow-600' : 'text-red-400 hover:text-red-600'}`}>{user.status === 'BANNED' ? 'Unban' : 'Ban'}</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={modal.type === 'freeze'} onClose={() => setModal({ type: null, data: null })}>
                <h2 className="text-2xl font-bold mb-4">Freeze User</h2>
                <p className="mb-4">Select the duration to freeze <b>{modal.data?.fakeName}</b>.</p>
                <form onSubmit={handleFreezeUser}>
                    <select value={freezeDuration} onChange={e => setFreezeDuration(e.target.value)} className="w-full p-2 bg-gray-700 rounded mb-4">
                        <option value="7">7 Days</option>
                        <option value="30">1 Month</option>
                        <option value="90">3 Months</option>
                    </select>
                    <button type="submit" className="w-full p-2 rounded bg-blue-600 hover:bg-blue-700 font-bold">Confirm Freeze</button>
                </form>
            </Modal>

            <Modal isOpen={modal.type === 'message'} onClose={() => setModal({ type: null, data: null })}>
                <h2 className="text-2xl font-bold mb-4">Message User</h2>
                <p className="mb-4">Send a direct message to <b>{modal.data?.fakeName}</b>.</p>
                <form onSubmit={handleSendMessageToUser}>
                    <textarea value={messageContent} onChange={e => setMessageContent(e.target.value)} required className="w-full p-2 bg-gray-700 rounded mb-4 h-32 resize-none" placeholder="Your message..."></textarea>
                    <button type="submit" className="w-full p-2 rounded bg-green-600 hover:bg-green-700 font-bold">Send Message</button>
                </form>
            </Modal>

            <Modal isOpen={modal.type === 'edit'} onClose={() => setModal({ type: null, data: null })}>
                <h2 className="text-2xl font-bold mb-4">Edit User</h2>
                <form onSubmit={handleEditUser} className="space-y-3">
                    <input value={modal.data?.name || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} placeholder="Full Name" className="w-full p-2 bg-gray-700 rounded" required />
                    <input value={modal.data?.fake_name || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, fake_name: e.target.value } })} placeholder="Username" className="w-full p-2 bg-gray-700 rounded" />
                    <input value={modal.data?.enrollment_no || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, enrollment_no: e.target.value } })} placeholder="Enrollment No" className="w-full p-2 bg-gray-700 rounded" required />
                    <input value={modal.data?.email || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, email: e.target.value } })} placeholder="Email" className="w-full p-2 bg-gray-700 rounded" required />
                    <input value={modal.data?.phone_no || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, phone_no: e.target.value } })} placeholder="Phone No" className="w-full p-2 bg-gray-700 rounded" required />
                    <input value={modal.data?.gender || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, gender: e.target.value } })} placeholder="Gender" className="w-full p-2 bg-gray-700 rounded" required />
                    <input value={modal.data?.college || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, college: e.target.value } })} placeholder="College" className="w-full p-2 bg-gray-700 rounded" />
                    <button type="submit" className="w-full p-2 rounded bg-blue-600 hover:bg-blue-700 font-bold">Save Changes</button>
                </form>
            </Modal>
        </div>
    );
}