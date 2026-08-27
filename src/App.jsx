import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle, Shield, User, Download, FileText, LogOut, Check, Camera, Search, Filter, Users, Award, Clock } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from './firebase';
import { collection, addDoc, getDocs, doc, updateDoc, onSnapshot, query, where } from 'firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState('register');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [authMode, setAuthMode] = useState('signup');
  const [formData, setFormData] = useState({ name: '', email: '', branch: '', year: '' });
  
  // Real-time Database State
  const [registrations, setRegistrations] = useState([]);

  const [scanInput, setScanInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [useCameraMode, setUseCameraMode] = useState(false);

  // Live Sync with Firebase Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "registrations"), (snapshot) => {
      const regList = snapshot.docs.map(doc => ({
        docId: doc.id,
        ...doc.data()
      }));
      setRegistrations(regList);

      // Logged-in user data update if updated by admin
      if (currentUser) {
        const updatedSelf = regList.find(r => r.id === currentUser.id);
        if (updatedSelf) setCurrentUser(updatedSelf);
      }
    });

    return () => unsub();
  }, [currentUser?.id]);

  // Live Camera Scanner Setup
  useEffect(() => {
    let scanner;
    if (activeTab === 'admin' && useCameraMode) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render(
        async (decodedText) => {
          await markAttendance(decodedText);
          alert(`Attendance Verified for ID: ${decodedText}`);
          scanner.clear();
          setUseCameraMode(false);
        },
        () => {}
      );
    }
    return () => {
      if (scanner) scanner.clear().catch(e => console.error(e));
    };
  }, [activeTab, useCameraMode]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return alert('Fill required fields');

    const newId = `TEDX-${Math.floor(100 + Math.random() * 900)}`;
    const newUser = {
      id: newId,
      name: formData.name,
      email: formData.email,
      branch: formData.branch,
      year: formData.year,
      attended: false,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const docRef = await addDoc(collection(db, "registrations"), newUser);
      const createdUser = { ...newUser, docId: docRef.id };
      setCurrentUser(createdUser);
      setIsLoggedIn(true);
      setActiveTab('dashboard');
    } catch (error) {
      console.error("Error writing document: ", error);
      alert("Registration failed! Check Firebase connection.");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = registrations.find(r => r.email.toLowerCase() === formData.email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setActiveTab('dashboard');
    } else {
      alert('User record not found in database!');
    }
  };

  const markAttendance = async (id) => {
    const cleanId = id.trim().toUpperCase();
    const target = registrations.find(r => r.id === cleanId);
    if (target && target.docId) {
      const docRef = doc(db, "registrations", target.docId);
      await updateDoc(docRef, { attended: true });
    }
  };

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    const found = registrations.find(r => r.id.toUpperCase() === scanInput.trim().toUpperCase());
    if (found) {
      await markAttendance(found.id);
      alert(`Attendance marked for ${found.name} (${found.id})`);
      setScanInput('');
    } else {
      alert('Invalid Ticket ID!');
    }
  };

  // Canvas High Resolution Certificate Generator
  const downloadCertificate = (user) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 850;
    const ctx = canvas.getContext('2d');

    // Canvas Background
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Outer Decorative Border
    ctx.strokeStyle = '#EB0028'; // TED Red
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);

    // Header Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF PARTICIPATION', 600, 150);

    ctx.fillStyle = '#EB0028';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('TEDxIGDTUW 2026', 600, 210);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '22px sans-serif';
    ctx.fillText('This certificate is proudly awarded to', 600, 310);

    // Attendee Name
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'extrabold 52px sans-serif';
    ctx.fillText(user.name.toUpperCase(), 600, 400);

    // Accent line
    ctx.fillStyle = '#EB0028';
    ctx.fillRect(400, 420, 400, 4);

    // Description
    ctx.fillStyle = '#D1D5DB';
    ctx.font = '20px sans-serif';
    ctx.fillText(`For active participation in the annual TEDxIGDTUW flagship event.`, 600, 490);
    ctx.fillText(`Issued on ${user.date || 'August 2026'} • Verified Registration ID: ${user.id}`, 600, 530);

    // Signature Area
    ctx.strokeStyle = '#4B5563';
    ctx.beginPath();
    ctx.moveTo(250, 680); ctx.lineTo(450, 680);
    ctx.moveTo(750, 680); ctx.lineTo(950, 680);
    ctx.stroke();

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '16px sans-serif';
    ctx.fillText('Organising Committee', 350, 710);
    ctx.fillText('Faculty Coordinator', 850, 710);

    // Trigger Download
    const link = document.createElement('a');
    link.download = `${user.name.replace(/\s+/g, '_')}_TEDx_Certificate.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Metrics Logic for Counter Cards
  const totalCount = registrations.length;
  const attendedCount = registrations.filter(r => r.attended).length;
  const pendingCount = totalCount - attendedCount;
  const percentAttended = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

  // Search & Filter Query
  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = filterBranch === 'All' || r.branch.toUpperCase() === filterBranch.toUpperCase();
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('register')}>
            <span className="text-2xl font-black tracking-tight text-red-600">TEDx</span>
            <span className="text-xl font-bold tracking-tight text-white">IGDTUW</span>
          </div>
          <div className="flex gap-3 text-sm font-medium">
            {!isLoggedIn ? (
              <button onClick={() => setActiveTab('register')} className={`px-4 py-2 rounded-lg transition ${activeTab === 'register' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                Registration
              </button>
            ) : (
              <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                My Pass & Certificate
              </button>
            )}
            <button onClick={() => setActiveTab('admin')} className={`px-4 py-2 rounded-lg border border-gray-700 transition flex items-center gap-1.5 ${activeTab === 'admin' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
              <Shield className="w-4 h-4 text-red-500" /> Admin Desk
            </button>
            {isLoggedIn && (
              <button onClick={() => { setIsLoggedIn(false); setCurrentUser(null); setActiveTab('register'); }} className="px-3 py-2 text-gray-400 hover:text-red-400">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-10">
        {/* VIEW 1: REGISTRATION */}
        {activeTab === 'register' && (
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs uppercase tracking-widest text-red-500 font-semibold">Flagship Event 2026</span>
              <h1 className="text-4xl font-extrabold mt-2 text-white leading-tight">Ideas Worth Spreading</h1>
              <p className="text-gray-400 mt-4 leading-relaxed">Register to secure your dynamic QR ticket pass, verify venue check-in, and download official certificates instantly.</p>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
              <div className="flex justify-between border-b border-gray-800 pb-4 mb-6">
                <button onClick={() => setAuthMode('signup')} className={`text-lg font-bold pb-2 ${authMode === 'signup' ? 'text-white border-b-2 border-red-600' : 'text-gray-500'}`}>
                  New Registration
                </button>
                <button onClick={() => setAuthMode('login')} className={`text-lg font-bold pb-2 ${authMode === 'login' ? 'text-white border-b-2 border-red-600' : 'text-gray-500'}`}>
                  Already Registered?
                </button>
              </div>

              {authMode === 'signup' ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Full Name</label>
                    <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Radhika Sharma" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Email</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="radhika@igdtuw.ac.in" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Branch</label>
                      <input type="text" required value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} placeholder="CSE / IT / ECE" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Year</label>
                      <select value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600">
                        <option value="">Select</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition mt-2">
                    Register & Get Entry Pass
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Registered Email</label>
                    <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="radhika@igdtuw.ac.in" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
                  </div>
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition mt-4">
                    View My Pass / Certificate
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: USER DASHBOARD */}
        {activeTab === 'dashboard' && currentUser && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${currentUser.attended ? 'bg-green-950/60 text-green-400 border-green-800' : 'bg-red-950/60 text-red-400 border-red-800'}`}>
                  Status: {currentUser.attended ? 'Attended & Verified' : 'Registered (Pending Check-in)'}
                </span>
                <h2 className="text-3xl font-bold mt-3 text-white">{currentUser.name}</h2>
                <p className="text-gray-400">{currentUser.email} • {currentUser.branch} ({currentUser.year})</p>
              </div>

              <div className="bg-white p-4 rounded-xl flex flex-col items-center text-center shadow-lg">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${currentUser.id}`} alt="Ticket QR" className="w-32 h-32" />
                <span className="text-xs font-mono font-bold text-gray-800 mt-2">{currentUser.id}</span>
                <span className="text-[10px] text-gray-500">Show at event entrance</span>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="text-red-500" /> Official Participation Certificate
              </h3>
              
              {currentUser.attended ? (
                <div className="mt-4 bg-green-950/40 border border-green-800/50 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-400">Check-in Confirmed!</h4>
                    <p className="text-xs text-gray-300 mt-0.5">Your official certificate is generated and ready for download.</p>
                  </div>
                  <button onClick={() => downloadCertificate(currentUser)} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition">
                    <Download className="w-4 h-4" /> Download Certificate
                  </button>
                </div>
              ) : (
                <div className="mt-4 bg-gray-950 border border-gray-800 p-4 rounded-xl text-center text-gray-400 text-sm">
                  ⚠️ Certificate automatically unlocks once your QR code is scanned by the team at the entrance.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: ADMIN DESK & REAL-TIME COUNTER METRICS */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Organiser Dashboard</h2>
                <p className="text-xs text-gray-400">Live Firebase real-time database venue check-in desk.</p>
              </div>
            </div>

            {/* REAL-TIME COUNTER METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase">
                  <Users className="w-4 h-4 text-blue-500" /> Total Registered
                </div>
                <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase">
                  <Award className="w-4 h-4 text-green-500" /> Attended (Checked-in)
                </div>
                <div className="text-2xl font-black text-green-400 mt-1">{attendedCount}</div>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase">
                  <Clock className="w-4 h-4 text-yellow-500" /> Pending Entry
                </div>
                <div className="text-2xl font-black text-yellow-400 mt-1">{pendingCount}</div>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase">
                  Check-in Rate
                </div>
                <div className="text-2xl font-black text-white mt-1">{percentAttended}%</div>
                <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-red-600 h-1.5 rounded-full" style={{ width: `${percentAttended}%` }}></div>
                </div>
              </div>
            </div>

            {/* SCANNER & MANUAL OVERRIDE */}
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl space-y-4">
              <div className="flex gap-4">
                <button onClick={() => setUseCameraMode(false)} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${!useCameraMode ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-400'}`}>
                  Manual ID Entry
                </button>
                <button onClick={() => setUseCameraMode(true)} className={`flex-1 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${useCameraMode ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-400'}`}>
                  <Camera className="w-4 h-4" /> Live Camera Scanner
                </button>
              </div>

              {!useCameraMode ? (
                <form onSubmit={handleScanSubmit} className="flex gap-3">
                  <input type="text" value={scanInput} onChange={e => setScanInput(e.target.value)} placeholder="Enter Ticket ID (e.g. TEDX-101)" className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-600 font-mono text-sm" />
                  <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-xl text-sm transition">
                    Mark Present
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center bg-gray-950 border border-gray-800 rounded-xl p-4">
                  <div id="reader" className="w-full max-w-sm text-white"></div>
                  <p className="text-xs text-gray-500 mt-2">Point attendee QR towards camera</p>
                </div>
              )}
            </div>

            {/* ATTENDEE LIST WITH SEARCH & FILTERS */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden p-4 space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
                  <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search Name/ID..." className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-red-600" />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Filter className="w-4 h-4 text-gray-500" />
                  <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-600">
                    <option value="All">All Branches</option>
                    <option value="CSE">CSE</option>
                    <option value="IT">IT</option>
                    <option value="ECE">ECE</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-gray-950 text-gray-200 border-b border-gray-800 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Ticket ID</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Branch / Year</th>
                      <th className="px-4 py-3">Check-in Status</th>
                      <th className="px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {filteredRegistrations.map(reg => (
                      <tr key={reg.id} className="hover:bg-gray-800/40 transition">
                        <td className="px-4 py-3 font-mono text-white">{reg.id}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white">{reg.name}</div>
                          <div className="text-xs text-gray-500">{reg.email}</div>
                        </td>
                        <td className="px-4 py-3">{reg.branch} ({reg.year})</td>
                        <td className="px-4 py-3">
                          {reg.attended ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-950/60 px-2.5 py-1 rounded-full border border-green-800/40">
                              <Check className="w-3 h-3" /> Checked-in
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 bg-gray-950 px-2.5 py-1 rounded-full border border-gray-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {!reg.attended ? (
                            <button onClick={() => markAttendance(reg.id)} className="text-xs bg-gray-800 hover:bg-red-600 hover:text-white text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700 transition">
                              Mark Present
                            </button>
                          ) : (
                            <button onClick={() => downloadCertificate(reg)} className="text-xs bg-green-950/80 hover:bg-green-900 text-green-300 px-3 py-1.5 rounded-lg border border-green-800/60 flex items-center gap-1 transition">
                              <Download className="w-3 h-3" /> Certificate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}