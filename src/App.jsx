import React, { useState, useEffect } from 'react';
import { QrCode, CheckCircle, Shield, User, Download, FileText, LogOut, Check, Camera, RefreshCw } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function App() {
  const [activeTab, setActiveTab] = useState('register');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [authMode, setAuthMode] = useState('signup');
  const [formData, setFormData] = useState({ name: '', email: '', branch: '', year: '' });
  
  const [registrations, setRegistrations] = useState([
    { id: 'TEDX-101', name: 'Ananya Sharma', email: 'ananya@igdtuw.ac.in', branch: 'CSE', year: '3rd Year', attended: true, status: 'Registered' },
    { id: 'TEDX-102', name: 'Priya Singh', email: 'priya@igdtuw.ac.in', branch: 'IT', year: '2nd Year', attended: false, status: 'Registered' }
  ]);

  const [scanInput, setScanInput] = useState('');
  const [useCameraMode, setUseCameraMode] = useState(false);

  // Live Camera Scanner Setup
  useEffect(() => {
    let scanner;
    if (activeTab === 'admin' && useCameraMode) {
      scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render(
        (decodedText) => {
          markAttendance(decodedText);
          alert(`QR Scanned Successfully! Attendance marked for: ${decodedText}`);
          scanner.clear();
          setUseCameraMode(false);
        },
        (error) => {}
      );
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(e => console.error(e));
      }
    };
  }, [activeTab, useCameraMode]);

  const handleRegister = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return alert('Please fill required fields');
    
    const newId = `TEDX-${Math.floor(100 + Math.random() * 900)}`;
    const newUser = {
      id: newId,
      ...formData,
      attended: false,
      status: 'Registered'
    };

    setRegistrations(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setIsLoggedIn(true);
    setActiveTab('dashboard');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = registrations.find(r => r.email.toLowerCase() === formData.email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setActiveTab('dashboard');
    } else {
      alert('User not found. Please Sign Up!');
    }
  };

  const markAttendance = (id) => {
    const cleanId = id.trim().toUpperCase();
    setRegistrations(prev => prev.map(reg => 
      reg.id === cleanId ? { ...reg, attended: true } : reg
    ));
    if (currentUser && currentUser.id === cleanId) {
      setCurrentUser(prev => ({ ...prev, attended: true }));
    }
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    const found = registrations.find(r => r.id.toUpperCase() === scanInput.trim().toUpperCase());
    if (found) {
      markAttendance(found.id);
      alert(`Attendance marked for ${found.name} (${found.id})!`);
      setScanInput('');
    } else {
      alert('Invalid Ticket ID!');
    }
  };

  const downloadCertificate = (user) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#E50914';
    ctx.lineWidth = 10;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF PARTICIPATION', 400, 120);

    ctx.fillStyle = '#E50914';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('TEDxIGDTUW 2026', 400, 170);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '18px sans-serif';
    ctx.fillText('This is proudly presented to', 400, 250);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(user.name.toUpperCase(), 400, 310);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '16px sans-serif';
    ctx.fillText(`For attending TEDxIGDTUW Annual Flagship Event. Ticket ID: ${user.id}`, 400, 370);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'italic 16px sans-serif';
    ctx.fillText('TEDx Organising Team', 400, 480);

    const link = document.createElement('a');
    link.download = `${user.name}_TEDx_Certificate.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

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
              <button 
                onClick={() => setActiveTab('register')} 
                className={`px-4 py-2 rounded-lg transition ${activeTab === 'register' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Registration Portal
              </button>
            ) : (
              <button 
                onClick={() => setActiveTab('dashboard')} 
                className={`px-4 py-2 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                My Pass & Certificate
              </button>
            )}
            <button 
              onClick={() => setActiveTab('admin')} 
              className={`px-4 py-2 rounded-lg border border-gray-700 transition flex items-center gap-1.5 ${activeTab === 'admin' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Shield className="w-4 h-4 text-red-500" /> Admin Desk
            </button>
            {isLoggedIn && (
              <button 
                onClick={() => { setIsLoggedIn(false); setCurrentUser(null); setActiveTab('register'); }} 
                className="px-3 py-2 text-gray-400 hover:text-red-400"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {activeTab === 'register' && (
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <span className="text-xs uppercase tracking-widest text-red-500 font-semibold">Flagship Event 2026</span>
              <h1 className="text-4xl font-extrabold mt-2 text-white leading-tight">Join the Movement of Ideas Worth Spreading</h1>
              <p className="text-gray-400 mt-4 leading-relaxed">Register now to get your entry pass, attend the event, and receive your official TEDx participation certificate automatically upon check-in.</p>
              
              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-5 h-5 text-red-500" /> Dynamic QR Entry Pass
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-5 h-5 text-red-500" /> Instant QR-based Attendance
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <CheckCircle className="w-5 h-5 text-red-500" /> Auto-Generated Verifiable Certificate
                </div>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
              <div className="flex justify-between border-b border-gray-800 pb-4 mb-6">
                <button 
                  onClick={() => setAuthMode('signup')}
                  className={`text-lg font-bold pb-2 relative ${authMode === 'signup' ? 'text-white border-b-2 border-red-600' : 'text-gray-500'}`}
                >
                  New Registration
                </button>
                <button 
                  onClick={() => setAuthMode('login')}
                  className={`text-lg font-bold pb-2 relative ${authMode === 'login' ? 'text-white border-b-2 border-red-600' : 'text-gray-500'}`}
                >
                  Already Registered?
                </button>
              </div>

              {authMode === 'signup' ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g. Radhika Sharma"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Email</label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="radhika@igdtuw.ac.in"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Branch</label>
                      <input 
                        type="text" 
                        required 
                        value={formData.branch} 
                        onChange={e => setFormData({...formData, branch: e.target.value})}
                        placeholder="CSE / IT"
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Year</label>
                      <select 
                        value={formData.year} 
                        onChange={e => setFormData({...formData, year: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600"
                      >
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
                    <input 
                      type="email" 
                      required 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="radhika@igdtuw.ac.in"
                      className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600"
                    />
                  </div>
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition mt-4">
                    View My Ticket / Certificate
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && currentUser && (
          <div className="space-y-6">
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${currentUser.attended ? 'bg-green-950/60 text-green-400 border-green-800' : 'bg-red-950/60 text-red-400 border-red-800'}`}>
                  Status: {currentUser.attended ? 'Attended & Verified' : 'Registered (Pending Entry)'}
                </span>
                <h2 className="text-3xl font-bold mt-3 text-white">{currentUser.name}</h2>
                <p className="text-gray-400">{currentUser.email} • {currentUser.branch} ({currentUser.year})</p>
              </div>

              <div className="bg-white p-4 rounded-xl flex flex-col items-center text-center shadow-lg">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${currentUser.id}`} 
                  alt="Ticket QR" 
                  className="w-32 h-32"
                />
                <span className="text-xs font-mono font-bold text-gray-800 mt-2">{currentUser.id}</span>
                <span className="text-[10px] text-gray-500">Show this QR at entry desk</span>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="text-red-500" /> Event Certificate
              </h3>
              
              {currentUser.attended ? (
                <div className="mt-4 bg-green-950/40 border border-green-800/50 p-4 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-green-400">Attendance Confirmed!</h4>
                    <p className="text-xs text-gray-300 mt-0.5">Your certificate is ready for official download.</p>
                  </div>
                  <button 
                    onClick={() => downloadCertificate(currentUser)}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition"
                  >
                    <Download className="w-4 h-4" /> Download Certificate
                  </button>
                </div>
              ) : (
                <div className="mt-4 bg-gray-950 border border-gray-800 p-4 rounded-xl text-center text-gray-400 text-sm">
                  ⚠️ Certificate will automatically unlock once your QR code is scanned by the team at the event venue.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">Organiser Attendance Portal</h2>
                <p className="text-xs text-gray-400">Scan QR via Camera or Enter Ticket ID manually.</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl text-xs text-gray-300">
                Total: <strong className="text-white">{registrations.length}</strong> | Present: <strong className="text-green-400">{registrations.filter(r => r.attended).length}</strong>
              </div>
            </div>

            {/* Attendance Mode Switcher */}
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-2xl space-y-4">
              <div className="flex gap-4">
                <button 
                  onClick={() => setUseCameraMode(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${!useCameraMode ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-400'}`}
                >
                  Manual ID Entry (Quick)
                </button>
                <button 
                  onClick={() => setUseCameraMode(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${useCameraMode ? 'bg-red-600 border-red-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-400'}`}
                >
                  <Camera className="w-4 h-4" /> Live Webcam QR Scanner
                </button>
              </div>

              {!useCameraMode ? (
                <form onSubmit={handleScanSubmit} className="flex gap-3">
                  <input 
                    type="text" 
                    value={scanInput} 
                    onChange={e => setScanInput(e.target.value)}
                    placeholder="Scan or Enter Ticket ID (e.g. TEDX-101)" 
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-red-600 font-mono text-sm"
                  />
                  <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-2 rounded-xl text-sm transition">
                    Mark Attendance
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center justify-center bg-gray-950 border border-gray-800 rounded-xl p-4">
                  <div id="reader" className="w-full max-w-sm text-white"></div>
                  <p className="text-xs text-gray-500 mt-2">Point the attendee's QR code towards the camera</p>
                </div>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-sm text-gray-400">
                <thead className="bg-gray-950 text-gray-200 border-b border-gray-800 text-xs uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-3">Ticket ID</th>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Branch / Year</th>
                    <th className="px-6 py-3">Attendance</th>
                    <th className="px-6 py-3">Certificate Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {registrations.map(reg => (
                    <tr key={reg.id} className="hover:bg-gray-800/40 transition">
                      <td className="px-6 py-4 font-mono text-white">{reg.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{reg.name}</div>
                        <div className="text-xs text-gray-500">{reg.email}</div>
                      </td>
                      <td className="px-6 py-4">{reg.branch} ({reg.year})</td>
                      <td className="px-6 py-4">
                        {reg.attended ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-950/60 px-2.5 py-1 rounded-full border border-green-800/40">
                            <Check className="w-3 h-3" /> Present
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500 bg-gray-950 px-2.5 py-1 rounded-full border border-gray-800">
                            Absent
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {!reg.attended ? (
                          <button 
                            onClick={() => markAttendance(reg.id)} 
                            className="text-xs bg-gray-800 hover:bg-red-600 hover:text-white text-gray-200 px-3 py-1.5 rounded-lg border border-gray-700 transition"
                          >
                            Mark Present
                          </button>
                        ) : (
                          <button 
                            onClick={() => downloadCertificate(reg)}
                            className="text-xs bg-green-950/80 hover:bg-green-900 text-green-300 px-3 py-1.5 rounded-lg border border-green-800/60 flex items-center gap-1 transition"
                          >
                            <Download className="w-3 h-3" /> Get PDF
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}