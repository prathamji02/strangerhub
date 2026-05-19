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
    const [registrationRequests, setRegistrationRequests] = useState([]);
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

    // Coin Management State
    const [earningEnabled, setEarningEnabled] = useState(true);
    const [earningMessage, setEarningMessage] = useState('');
    const [femaleCoinsAmount, setFemaleCoinsAmount] = useState(1);
    const [femaleConversionMinutes, setFemaleConversionMinutes] = useState(1);
    const [femaleConversionSeconds, setFemaleConversionSeconds] = useState(0);
    const [maleCoinsAmount, setMaleCoinsAmount] = useState(1);
    const [maleConversionMinutes, setMaleConversionMinutes] = useState(2);
    const [maleConversionSeconds, setMaleConversionSeconds] = useState(0);
    const [redemptionRequests, setRedemptionRequests] = useState([]);
    const [approveModal, setApproveModal] = useState({ isOpen: false, request: null, rejectMode: false });
    const [rejectReason, setRejectReason] = useState('');
    const [transferRefId, setTransferRefId] = useState('');
    
    // Login Bonus Claim State
    const [loginBonusClaims, setLoginBonusClaims] = useState([]);
    const [rejectBonusModal, setRejectBonusModal] = useState({ isOpen: false, claim: null });
    const [rejectBonusReason, setRejectBonusReason] = useState('');
    const [bonusApproveModal, setBonusApproveModal] = useState({ isOpen: false, claim: null });
    const [bonusApproveRemark, setBonusApproveRemark] = useState('');

    const fetchData = async (type) => {
        setSelectedItem(null);
        setLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (type === 'coins') {
                // Fetch coin earning config
                const configRes = await api.get('/admin/earning-config', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEarningEnabled(configRes.data.isEarningEnabled);
                setEarningMessage(configRes.data.disabilityMessage || '');
                
                // Convert seconds to minutes and seconds for display
                const femaleSeconds = configRes.data.femaleConversionTimeSeconds || 60;
                setFemaleCoinsAmount(configRes.data.femaleCoinsAmount || 1);
                setFemaleConversionMinutes(Math.floor(femaleSeconds / 60));
                setFemaleConversionSeconds(femaleSeconds % 60);
                
                const maleSeconds = configRes.data.maleConversionTimeSeconds || 120;
                setMaleCoinsAmount(configRes.data.maleCoinsAmount || 1);
                setMaleConversionMinutes(Math.floor(maleSeconds / 60));
                setMaleConversionSeconds(maleSeconds % 60);

                // Fetch redemption requests
                const requestsRes = await api.get('/admin/coin-requests?page=1&limit=100', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRedemptionRequests(requestsRes.data.requests || requestsRes.data);

                // Fetch login bonus claims
                const bonusRes = await api.get('/admin/login-bonus-claims?status=PENDING&page=1&limit=100', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLoginBonusClaims(bonusRes.data.claims || []);
            } else if (type === 'registrations') {
                const reqRes = await api.get('/admin/registration-requests?status=PENDING', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRegistrationRequests(reqRes.data);
            } else {
                const { data } = await api.get(`/admin/${type}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (type === 'reports') setReports(data);
                if (type === 'users') setUsers(data);
            }
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

    const handleApproveRegistration = async (id) => {
        const token = localStorage.getItem('authToken');
        await toast.promise(
            api.post(`/admin/registration-requests/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: 'Approving request...',
                success: 'Request approved successfully.',
                error: 'Failed to approve request.',
            }
        );
        fetchData('registrations');
    };

    const handleRejectRegistration = async (id, remarks) => {
        const token = localStorage.getItem('authToken');
        await toast.promise(
            api.post(`/admin/registration-requests/${id}/reject`, { remarks }, { headers: { Authorization: `Bearer ${token}` } }),
            {
                loading: 'Rejecting request...',
                success: 'Request rejected.',
                error: 'Failed to reject request.',
            }
        );
        setModal({ type: null, data: null });
        fetchData('registrations');
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

    const handleToggleEarning = async () => {
        const token = localStorage.getItem('authToken');
        const femaleConversionTimeSeconds = (femaleConversionMinutes * 60) + femaleConversionSeconds;
        const maleConversionTimeSeconds = (maleConversionMinutes * 60) + maleConversionSeconds;
        
        await toast.promise(
            api.post('/admin/earning-config', 
                { 
                    isEarningEnabled: !earningEnabled,
                    disabilityMessage: earningMessage,
                    femaleCoinsAmount: femaleCoinsAmount,
                    femaleConversionTimeSeconds: femaleConversionTimeSeconds,
                    maleCoinsAmount: maleCoinsAmount,
                    maleConversionTimeSeconds: maleConversionTimeSeconds
                },
                { headers: { Authorization: `Bearer ${token}` } }
            ),
            {
                loading: 'Updating earning config...',
                success: `Earning ${!earningEnabled ? 'enabled' : 'disabled'}.`,
                error: 'Failed to update config.',
            }
        );
        fetchData('coins');
    };

    const handleApproveRedemption = async () => {
        const token = localStorage.getItem('authToken');
        await toast.promise(
            api.post(`/admin/approve-coin-request/${approveModal.request?.id}`, 
                { transactionReference: transferRefId || 'ADMIN_APPROVED' },
                { headers: { Authorization: `Bearer ${token}` } }
            ),
            {
                loading: 'Approving redemption...',
                success: 'Redemption approved and coins transferred.',
                error: 'Failed to approve redemption.',
            }
        );
        setTransferRefId('');
        setApproveModal({ isOpen: false, request: null, rejectMode: false });
        fetchData('coins');
    };

    const handleRejectRedemption = async (requestId) => {
        const token = localStorage.getItem('authToken');
        await toast.promise(
            api.post(`/admin/reject-coin-request/${requestId}`,
                { rejectionReason: rejectReason || 'Rejected by admin' },
                { headers: { Authorization: `Bearer ${token}` } }
            ),
            {
                loading: 'Rejecting redemption...',
                success: 'Redemption rejected.',
                error: 'Failed to reject redemption.',
            }
        );
        setRejectReason('');
        setApproveModal({ isOpen: false, request: null });
        fetchData('coins');
    };

    const handleApproveLoginBonus = async () => {
        const token = localStorage.getItem('authToken');
        await toast.promise(
            api.post(`/admin/login-bonus-claims/${bonusApproveModal.claim?.id}/approve`, 
                { remarks: bonusApproveRemark || 'Login bonus claim approved' }, 
                { headers: { Authorization: `Bearer ${token}` } }
            ),
            {
                loading: 'Approving login bonus...',
                success: 'Login bonus approved.',
                error: 'Failed to approve bonus.',
            }
        );
        setBonusApproveRemark('');
        setBonusApproveModal({ isOpen: false, claim: null });
        fetchData('coins');
    };

    const handleRejectLoginBonus = async (claimId) => {
        const token = localStorage.getItem('authToken');
        await toast.promise(
            api.post(`/admin/login-bonus-claims/${claimId}/reject`,
                { rejectionReason: rejectBonusReason || 'Rejected by admin' },
                { headers: { Authorization: `Bearer ${token}` } }
            ),
            {
                loading: 'Rejecting login bonus...',
                success: 'Login bonus rejected.',
                error: 'Failed to reject bonus.',
            }
        );
        setRejectBonusReason('');
        setRejectBonusModal({ isOpen: false, claim: null });
        fetchData('coins');
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

                <div className="flex border-b border-gray-700 mb-4 overflow-x-auto">
                    <button onClick={() => setAdminView('reports')} className={`whitespace-nowrap py-2 px-4 ${adminView === 'reports' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>Reports & Logs</button>
                    <button onClick={() => setAdminView('users')} className={`whitespace-nowrap py-2 px-4 ${adminView === 'users' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>Users</button>
                    <button onClick={() => setAdminView('coins')} className={`whitespace-nowrap py-2 px-4 ${adminView === 'coins' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>Coin Management</button>
                    <button onClick={() => setAdminView('registrations')} className={`whitespace-nowrap py-2 px-4 ${adminView === 'registrations' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>Registrations</button>
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

                {adminView === 'registrations' && !loading && (
                    <div className="bg-gray-800 rounded-lg shadow-lg overflow-x-auto p-4">
                        <h2 className="text-xl font-bold mb-4">Pending Registration Requests</h2>
                        {registrationRequests.length === 0 ? (
                            <p className="text-gray-400">No pending registrations.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {registrationRequests.map(req => (
                                    <div key={req.id} className="bg-gray-700 p-4 rounded-lg flex flex-col gap-2">
                                        <div className="flex justify-between">
                                            <span className="font-bold">{req.name}</span>
                                            <span className="text-sm text-gray-400">{req.enrollment_no}</span>
                                        </div>
                                        <p className="text-sm text-gray-300">Email: {req.email}</p>
                                        <p className="text-sm text-gray-300">Phone: {req.phone_no}</p>
                                        <p className="text-sm text-gray-300">College: {req.college}</p>
                                        <p className="text-sm text-gray-300">Gender: {req.gender}</p>
                                        {req.upiId && <p className="text-sm text-gray-300">UPI: {req.upiId}</p>}
                                        <div className="mt-2 mb-2">
                                            <a href={req.idCardPhotoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline text-sm flex items-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
                                                View ID Photo
                                            </a>
                                        </div>
                                        <div className="flex gap-2 mt-auto pt-2 border-t border-gray-600">
                                            <button onClick={() => handleApproveRegistration(req.id)} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded">Approve</button>
                                            <button onClick={() => setModal({ type: 'rejectRegistration', data: req })} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded">Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {adminView === 'coins' && !loading && (
                    <div className="space-y-6">
                        {/* Earning Config Section */}
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <h2 className="text-2xl font-bold mb-4">Earning Configuration</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                                    <div>
                                        <p className="font-bold">Earning Status</p>
                                        <p className="text-sm text-gray-400">{earningEnabled ? 'Enabled' : 'Disabled'}</p>
                                    </div>
                                    <button
                                        onClick={handleToggleEarning}
                                        className={`px-6 py-2 rounded font-bold transition-colors ${earningEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                                    >
                                        {earningEnabled ? 'Disable' : 'Enable'}
                                    </button>
                                </div>

                                {!earningEnabled && (
                                    <div className="p-3 bg-yellow-900/30 border border-yellow-600 rounded">
                                        <p className="text-yellow-200 font-bold">Status Message:</p>
                                        <p className="text-yellow-100 text-sm">{earningMessage}</p>
                                    </div>
                                )}

                                {/* Gender-based Rate Configuration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 border-t border-gray-700 pt-4">
                                    {/* Female Users */}
                                    <div className="p-4 bg-pink-900/20 border border-pink-700/30 rounded-lg">
                                        <label className="block text-pink-400 font-bold mb-3">👩 Female Users</label>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1">Coins</p>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={femaleCoinsAmount}
                                                    onChange={(e) => setFemaleCoinsAmount(parseInt(e.target.value) || 1)}
                                                    className="w-full p-2 bg-gray-700 rounded text-white text-sm"
                                                    placeholder="e.g., 2"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1">Minutes</p>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={femaleConversionMinutes}
                                                    onChange={(e) => setFemaleConversionMinutes(parseInt(e.target.value) || 0)}
                                                    className="w-full p-2 bg-gray-700 rounded text-white text-sm"
                                                    placeholder="e.g., 1"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1">Seconds</p>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="59"
                                                    value={femaleConversionSeconds}
                                                    onChange={(e) => setFemaleConversionSeconds(Math.min(59, parseInt(e.target.value) || 0))}
                                                    className="w-full p-2 bg-gray-700 rounded text-white text-sm"
                                                    placeholder="e.g., 30"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Rate: {femaleCoinsAmount} coin{femaleCoinsAmount !== 1 ? 's' : ''} per {femaleConversionMinutes}m {femaleConversionSeconds}s
                                            </p>
                                        </div>
                                    </div>

                                    {/* Male/Other Users */}
                                    <div className="p-4 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                                        <label className="block text-blue-400 font-bold mb-3">👨 Male/Other Users</label>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1">Coins</p>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={maleCoinsAmount}
                                                    onChange={(e) => setMaleCoinsAmount(parseInt(e.target.value) || 1)}
                                                    className="w-full p-2 bg-gray-700 rounded text-white text-sm"
                                                    placeholder="e.g., 1"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1">Minutes</p>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={maleConversionMinutes}
                                                    onChange={(e) => setMaleConversionMinutes(parseInt(e.target.value) || 0)}
                                                    className="w-full p-2 bg-gray-700 rounded text-white text-sm"
                                                    placeholder="e.g., 2"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-sm mb-1">Seconds</p>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="59"
                                                    value={maleConversionSeconds}
                                                    onChange={(e) => setMaleConversionSeconds(Math.min(59, parseInt(e.target.value) || 0))}
                                                    className="w-full p-2 bg-gray-700 rounded text-white text-sm"
                                                    placeholder="e.g., 0"
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Rate: {maleCoinsAmount} coin{maleCoinsAmount !== 1 ? 's' : ''} per {maleConversionMinutes}m {maleConversionSeconds}s
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleToggleEarning}
                                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded mt-4"
                                >
                                    Save Earning Rates
                                </button>
                            </div>
                        </div>

                        {/* Redemption Requests Section */}
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <h2 className="text-2xl font-bold mb-4">Coin Redemption Requests ({redemptionRequests.length})</h2>
                            {redemptionRequests.length === 0 ? (
                                <p className="text-gray-400">No redemption requests.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-700">
                                                <th className="text-left p-3">User</th>
                                                <th className="text-left p-3">Amount</th>
                                                <th className="text-left p-3">Status</th>
                                                <th className="text-left p-3">Requested</th>
                                                <th className="text-center p-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {redemptionRequests.map(request => (
                                                <tr key={request.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                    <td className="p-3">{request.user?.fake_name || 'Unknown'}</td>
                                                    <td className="p-3 font-bold text-green-400">{request.requestedCoins} coins</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                                                            request.status === 'PENDING' ? 'bg-yellow-900 text-yellow-200' :
                                                            request.status === 'APPROVED' ? 'bg-green-900 text-green-200' :
                                                            request.status === 'REJECTED' ? 'bg-red-900 text-red-200' :
                                                            'bg-gray-700 text-gray-300'
                                                        }`}>{request.status}</span>
                                                    </td>
                                                    <td className="p-3 text-xs text-gray-400">{new Date(request.createdAt).toLocaleDateString()}</td>
                                                    <td className="p-3 text-center">
                                                        {request.status === 'PENDING' && (
                                                            <div className="flex gap-2 justify-center">
                                                                <button
                                                                    onClick={() => setApproveModal({ isOpen: true, request, rejectMode: false })}
                                                                    className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-xs font-bold"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => setApproveModal({ isOpen: true, request, rejectMode: true })}
                                                                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-xs font-bold"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Login Bonus Claims Section */}
                        <div className="bg-gray-800 p-6 rounded-lg">
                            <h2 className="text-2xl font-bold mb-4">Login Bonus Claims ({loginBonusClaims.length})</h2>
                            {loginBonusClaims.length === 0 ? (
                                <p className="text-gray-400">No pending login bonus claims.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-700">
                                                <th className="text-left p-3">User</th>
                                                <th className="text-left p-3">Payment Method</th>
                                                <th className="text-left p-3">Bonus</th>
                                                <th className="text-left p-3">Requested</th>
                                                <th className="text-center p-3">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loginBonusClaims.map(claim => (
                                                <tr key={claim.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                                    <td className="p-3">
                                                        <div className="font-bold">{claim.userName || 'Unknown'}</div>
                                                        <div className="text-xs text-gray-400">{claim.enrollmentNo}</div>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="font-medium text-pink-400">{claim.paymentMethod?.replace('_', ' ')}</div>
                                                        <div className="text-xs text-gray-300">{claim.paymentDetails?.masked}</div>
                                                    </td>
                                                    <td className="p-3 font-bold text-green-400">{claim.bonusAmount} coins</td>
                                                    <td className="p-3 text-xs text-gray-400">{new Date(claim.claimedAt).toLocaleDateString()}</td>
                                                    <td className="p-3 text-center">
                                                        {claim.status === 'PENDING' && (
                                                            <div className="flex gap-2 justify-center">
                                                                <button
                                                                    onClick={() => setBonusApproveModal({ isOpen: true, claim })}
                                                                    className="px-3 py-1 rounded bg-green-600 hover:bg-green-700 text-xs font-bold"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => setRejectBonusModal({ isOpen: true, claim })}
                                                                    className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-xs font-bold"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
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

            <Modal isOpen={approveModal.isOpen} onClose={() => setApproveModal({ isOpen: false, request: null, rejectMode: false })}>
                <h2 className={`text-2xl font-bold mb-4 ${approveModal.rejectMode ? 'text-red-500' : 'text-green-500'}`}>
                    {approveModal.rejectMode ? 'Reject Redemption Request' : 'Approve Redemption Request'}
                </h2>
                <p className="mb-4 text-sm text-gray-300">
                    {approveModal.rejectMode 
                        ? "Provide a reason for rejecting this redemption request." 
                        : "Provide the Transaction Reference ID or Remarks for this successful transfer."}
                </p>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    if (approveModal.rejectMode) handleRejectRedemption(approveModal.request.id);
                    else handleApproveRedemption();
                }}>
                    {approveModal.rejectMode ? (
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Rejection reason (optional)..."
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded mb-4 h-24 resize-none"
                        />
                    ) : (
                        <textarea
                            value={transferRefId}
                            onChange={(e) => setTransferRefId(e.target.value)}
                            placeholder="E.g., UPI Ref No: 1234567890"
                            className="w-full p-2 bg-gray-700 border border-gray-600 rounded mb-4 h-24 resize-none"
                            required
                        />
                    )}
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setApproveModal({ isOpen: false, request: null, rejectMode: false })} className="flex-1 p-2 rounded bg-gray-600 hover:bg-gray-500 font-bold text-white">Cancel</button>
                        <button type="submit" className={`flex-1 p-2 rounded font-bold text-white shadow-lg ${approveModal.rejectMode ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 'bg-green-600 hover:bg-green-700 shadow-green-500/30'}`}>
                            {approveModal.rejectMode ? 'Confirm Rejection' : 'Confirm Approval'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={rejectBonusModal.isOpen} onClose={() => setRejectBonusModal({ isOpen: false, claim: null })}>
                <h2 className="text-2xl font-bold mb-4 text-pink-500">Reject Login Bonus</h2>
                <p className="mb-4 text-sm text-gray-300">Provide a remark for rejecting the login bonus claim of <b>{rejectBonusModal.claim?.userName}</b>. This remark will be shown to the user.</p>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleRejectLoginBonus(rejectBonusModal.claim?.id);
                }}>
                    <textarea
                        value={rejectBonusReason}
                        onChange={(e) => setRejectBonusReason(e.target.value)}
                        placeholder="E.g., Invalid UPI ID provided."
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg mb-4 h-24 resize-none text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none"
                        required
                    />
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setRejectBonusModal({ isOpen: false, claim: null })} className="flex-1 p-2 rounded bg-gray-700 hover:bg-gray-600 font-bold text-white">Cancel</button>
                        <button type="submit" className="flex-1 p-2 rounded bg-red-600 hover:bg-red-700 font-bold text-white shadow-lg shadow-red-500/30">Confirm Rejection</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={bonusApproveModal.isOpen} onClose={() => setBonusApproveModal({ isOpen: false, claim: null })}>
                <h2 className="text-2xl font-bold mb-4 text-green-500">Approve Login Bonus</h2>
                <p className="mb-4 text-sm text-gray-300">Provide an optional remark or transaction reference for the approval of <b>{bonusApproveModal.claim?.userName}</b>'s claim.</p>
                <form onSubmit={(e) => {
                    e.preventDefault();
                    handleApproveLoginBonus();
                }}>
                    <textarea
                        value={bonusApproveRemark}
                        onChange={(e) => setBonusApproveRemark(e.target.value)}
                        placeholder="E.g., Transferred via UPI Ref #123456"
                        className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg mb-4 h-24 resize-none text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
                    />
                    <div className="flex gap-3">
                        <button type="button" onClick={() => setBonusApproveModal({ isOpen: false, claim: null })} className="flex-1 p-2 rounded bg-gray-700 hover:bg-gray-600 font-bold text-white">Cancel</button>
                        <button type="submit" className="flex-1 p-2 rounded bg-green-600 hover:bg-green-700 font-bold text-white shadow-lg shadow-green-500/30">Confirm Approval</button>
                    </div>
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
                <h2 className="text-xl font-bold mb-4">Edit User</h2>
                {modal.data && (
                    <form onSubmit={handleEditUser} className="flex flex-col gap-4">
                        <input value={modal.data.name} onChange={e => setModal({ ...modal, data: { ...modal.data, name: e.target.value } })} placeholder="Full Name" className="p-2 bg-gray-700 rounded text-white" />
                        <input value={modal.data.enrollment_no} onChange={e => setModal({ ...modal, data: { ...modal.data, enrollment_no: e.target.value } })} placeholder="Enrollment No" className="p-2 bg-gray-700 rounded text-white" />
                        <input value={modal.data.fake_name || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, fake_name: e.target.value } })} placeholder="Username" className="p-2 bg-gray-700 rounded text-white" />
                        <input value={modal.data.email} onChange={e => setModal({ ...modal, data: { ...modal.data, email: e.target.value } })} placeholder="Email" type="email" className="p-2 bg-gray-700 rounded text-white" />
                        <input value={modal.data.phone_no} onChange={e => setModal({ ...modal, data: { ...modal.data, phone_no: e.target.value } })} placeholder="Phone No" className="p-2 bg-gray-700 rounded text-white" />
                        <input value={modal.data.gender} onChange={e => setModal({ ...modal, data: { ...modal.data, gender: e.target.value } })} placeholder="Gender" className="p-2 bg-gray-700 rounded text-white" />
                        <input value={modal.data.college || ''} onChange={e => setModal({ ...modal, data: { ...modal.data, college: e.target.value } })} placeholder="College" className="p-2 bg-gray-700 rounded text-white" />
                        <button type="submit" className="p-2 rounded bg-blue-600 font-bold hover:bg-blue-700 text-white">Save Changes</button>
                    </form>
                )}
            </Modal>

            <Modal isOpen={modal.type === 'rejectRegistration'} onClose={() => setModal({ type: null, data: null })}>
                <h2 className="text-xl font-bold mb-4">Reject Registration Request</h2>
                {modal.data && (
                    <form onSubmit={(e) => { e.preventDefault(); handleRejectRegistration(modal.data.id, rejectReason); }} className="flex flex-col gap-4">
                        <p className="text-sm text-gray-300">Rejecting request for {modal.data.name}</p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
                            rows="4"
                            placeholder="Enter rejection reason (e.g. ID card photo is blurry)..."
                            required
                        />
                        <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition-colors">
                            Confirm Rejection
                        </button>
                    </form>
                )}
            </Modal>
        </div>
    );
}