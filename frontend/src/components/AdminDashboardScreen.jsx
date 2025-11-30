import React, { useState, useEffect } from 'react';

export default function AdminDashboardScreen({ setView, api }) {
    const [adminView, setAdminView] = useState('reports'); // reports, users
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null);
    const [userChats, setUserChats] = useState([]);
    const [file, setFile] = useState(null);
    const [uploadMessage, setUploadMessage] = useState('');
    const [newUser, setNewUser] = useState({ enrollment_no: '', name: '', email: '', phone_no: '', gender: '' });
    const [registerMessage, setRegisterMessage] = useState('');

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
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData(adminView);
    }, [adminView]);

    const handleBanUser = async (userId, fakeName) => {
        if (window.confirm(`Are you sure you want to ban ${fakeName}? This action is permanent.`)) {
            try {
                const token = localStorage.getItem('authToken');
                await api.post('/admin/ban', { userId }, { headers: { Authorization: `Bearer ${token}` }});
                alert(`${fakeName} has been banned.`);
                setSelectedItem(null);
                fetchData(adminView); 
            } catch (error) {
                alert('Failed to ban user.');
            }
        }
    };
    
    const handleFreezeUser = async (userId, fakeName) => {
        if (window.confirm(`Are you sure you want to toggle the freeze status for ${fakeName}?`)) {
            try {
                const token = localStorage.getItem('authToken');
                await api.post('/admin/freeze', { userId }, { headers: { Authorization: `Bearer ${token}` }});
                alert(`Freeze status toggled for ${fakeName}.`);
                fetchData('users'); 
            } catch (error) {
                alert('Failed to toggle freeze status.');
            }
        }
    };
    
    const handleRegisterUser = async (e) => {
        e.preventDefault();
        setRegisterMessage('Registering...');
        try {
            const token = localStorage.getItem('authToken');
            const { data } = await api.post('/admin/register', newUser, { headers: { Authorization: `Bearer ${token}` }});
            setRegisterMessage(data.message);
            setNewUser({ enrollment_no: '', name: '', email: '', phone_no: '', gender: '' });
            fetchData('users');
        } catch (error) {
            setRegisterMessage(error.response?.data?.error || 'Registration failed.');
        }
    };

    const handleViewUserChats = async (user) => {
        setSelectedItem(user);
        setUserChats([]);
        try {
            const token = localStorage.getItem('authToken');
            const { data } = await api.get(`/admin/chats/${user.id}`, { headers: { Authorization: `Bearer ${token}` }});
            setUserChats(data);
        } catch (error) {
            console.error("Failed to fetch user chats", error);
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
            fetchData('users');
        } catch (error) {
            setUploadMessage(error.response?.data?.error || 'File upload failed.');
        }
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
                                    <button onClick={() => handleBanUser(selectedItem.reportedId, selectedItem.reported.fake_name)} className="w-full mt-4 p-3 rounded bg-red-700 font-bold hover:bg-red-800">
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
                                <h2 className="text-xl font-bold mt-4 mb-2">Friend List ({userChats.length})</h2>
                                <div className="bg-gray-700 p-3 rounded h-48 overflow-y-auto">
                                    {userChats.length > 0 ? (
                                        <ul>{userChats.map(chat => <li key={chat.id}>{chat.participants[0]?.fake_name}</li>)}</ul>
                                    ) : <p>No saved chats.</p>}
                                </div>
                                <button onClick={() => handleBanUser(selectedItem.id, selectedItem.fake_name)} className="w-full mt-4 p-3 rounded bg-red-700 font-bold hover:bg-red-800">
                                    Ban {selectedItem.fake_name}
                                </button>
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
                <button onClick={() => setView('home')} className="mb-4 text-blue-400 hover:underline">&larr; Back to Home</button>
                <h1 className="text-4xl font-bold mb-6">Admin Dashboard</h1>
                
                <div className="flex border-b border-gray-700 mb-4">
                    <button onClick={() => setAdminView('reports')} className={`py-2 px-4 ${adminView === 'reports' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>Reports & Logs</button>
                    <button onClick={() => setAdminView('users')} className={`py-2 px-4 ${adminView === 'users' ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>Users</button>
                </div>

                {loading && <p>Loading...</p>}

                {adminView === 'reports' && !loading && (
                    <div className="bg-gray-800 rounded-lg shadow-lg">
                        <ul className="divide-y divide-gray-700">
                            {reports.map(report => (
                                <li key={report.id} onClick={() => setSelectedItem(report)} className="p-4 hover:bg-gray-700 cursor-pointer">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p><strong>{report.reporter?.fake_name || 'System'}</strong> reported <strong>{report.reported?.fake_name || 'N/A'}</strong></p>
                                            <p className="text-sm text-gray-400">{report.reason || 'No review given.'}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className={`text-sm font-bold ${report.logType === 'USER_REPORT' ? 'text-yellow-400' : 'text-gray-500'}`}>{report.logType}</p>
                                          <p className="text-xs text-gray-400">{new Date(report.createdAt).toLocaleDateString()}</p>
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
                            <input type="file" onChange={(e) => setFile(e.target.files[0])} accept=".xlsx, .xls" className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                            <button type="submit" className="px-4 py-2 rounded bg-blue-600 font-bold hover:bg-blue-700">Upload</button>
                        </form>
                        {uploadMessage && <p className="mt-2 text-sm">{uploadMessage}</p>}
                    </div>
                     <div className="bg-gray-800 p-4 rounded-lg mb-6">
                        <h2 className="text-xl font-bold mb-4">Register New User</h2>
                        <form onSubmit={handleRegisterUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input value={newUser.enrollment_no} onChange={e => setNewUser({...newUser, enrollment_no: e.target.value})} placeholder="Enrollment No" className="p-2 bg-gray-700 rounded" required/>
                            <input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="Full Name" className="p-2 bg-gray-700 rounded" required/>
                            <input value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} placeholder="Email" type="email" className="p-2 bg-gray-700 rounded" required/>
                            <input value={newUser.phone_no} onChange={e => setNewUser({...newUser, phone_no: e.target.value})} placeholder="Phone No" className="p-2 bg-gray-700 rounded" required/>
                            <input value={newUser.gender} onChange={e => setNewUser({...newUser, gender: e.target.value})} placeholder="Gender" className="p-2 bg-gray-700 rounded" required/>
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
                                           <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                               user.status === 'BANNED' ? 'bg-red-900 text-red-300' : 
                                               user.status === 'FROZEN' ? 'bg-blue-900 text-blue-300' : 'bg-green-900 text-green-300'
                                           }`}>
                                               {user.status}
                                           </span>
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                           ★ {user.averageRating.toFixed(1)} ({user.ratingCount})
                                       </td>
                                       <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                           <button onClick={() => handleViewUserChats(user)} className="text-indigo-400 hover:text-indigo-600">View</button>
                                           <button onClick={() => handleFreezeUser(user.id, user.fake_name || user.name)} className="text-blue-400 hover:text-blue-600">Freeze/Unfreeze</button>
                                           <button onClick={() => handleBanUser(user.id, user.fake_name || user.name)} className="text-red-400 hover:text-red-600">Ban</button>
                                       </td>
                                   </tr>
                               ))} 
                            </tbody>
                        </table>
                    </div>
                  </div>
                )}
            </div>
        </div>
    );
}
