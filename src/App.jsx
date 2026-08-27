import React, { useState, useEffect } from 'react';
import { Shield, Download, FileText, LogOut, Check, Camera, Search, Filter, Users, Award, Clock, Mic, UserPlus, Send, Mail } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { db } from './firebase';
import { collection, addDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import * as XLSX from 'xlsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('register');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [authMode, setAuthMode] = useState('signup');
  const [formData, setFormData] = useState({ name: '', email: '', branch: '', year: '' });
  
  // Speaker & Recruitment Form States
  const [speakerData, setSpeakerData] = useState({ name: '', email: '', talkTitle: '', bio: '', linkedin: '' });
  const [recruitmentData, setRecruitmentData] = useState({ name: '', email: '', branch: '', year: '', domain: 'Technical', whyJoin: '' });

  // Database Collections States
  const [registrations, setRegistrations] = useState([]);
  const [speakerApps, setSpeakerApps] = useState([]);
  const [recruitApps, setRecruitApps] = useState([]);

  const [scanInput, setScanInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBranch, setFilterBranch] = useState('All');
  const [useCameraMode, setUseCameraMode] = useState(false);

  // Firestore Real-time Listeners
  useEffect(() => {
    const unsubRegs = onSnapshot(collection(db, "registrations"), (snapshot) => {
      const regList = snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() }));
      setRegistrations(regList);
      if (currentUser) {
        const updatedSelf = regList.find(r => r.id === currentUser.id);
        if (updatedSelf) setCurrentUser(updatedSelf);
      }
    });

    const unsubSpeakers = onSnapshot(collection(db, "speaker_applications"), (snapshot) => {
      setSpeakerApps(snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() })));
    });

    const unsubRecruits = onSnapshot(collection(db, "recruitment_applications"), (snapshot) => {
      setRecruitApps(snapshot.docs.map(doc => ({ docId: doc.id, ...doc.data() })));
    });

    return () => {
      unsubRegs();
      unsubSpeakers();
      unsubRecruits();
    };
  }, [currentUser?.id]);

  // Scanner Logic
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

  // Form Submissions
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
      setCurrentUser({ ...newUser, docId: docRef.id });
      setIsLoggedIn(true);
      setActiveTab('dashboard');
      alert(`Registration Successful! Ticket ID: ${newId}`);
    } catch (error) {
      alert("Registration failed! Check Firebase connection.");
    }
  };

  const handleSpeakerSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "speaker_applications"), { ...speakerData, appliedAt: new Date().toISOString() });
      alert("Speaker Application Submitted Successfully!");
      setSpeakerData({ name: '', email: '', talkTitle: '', bio: '', linkedin: '' });
    } catch (err) { alert("Submission failed!"); }
  };

  const handleRecruitmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "recruitment_applications"), { ...recruitmentData, appliedAt: new Date().toISOString() });
      alert("Recruitment Application Submitted Successfully!");
      setRecruitmentData({ name: '', email: '', branch: '', year: '', domain: 'Technical', whyJoin: '' });
    } catch (err) { alert("Submission failed!"); }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = registrations.find(r => r.email.toLowerCase() === formData.email.toLowerCase());
    if (user) {
      setCurrentUser(user);
      setIsLoggedIn(true);
      setActiveTab('dashboard');
    } else {
      alert('User record not found!');
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

  // EXCEL / CSV EXPORT FEATURE
  const exportToExcel = () => {
    const dataToExport = registrations.map(r => ({
      'Ticket ID': r.id,
      'Full Name': r.name,
      'Email': r.email,
      'Branch': r.branch,
      'Year': r.year,
      'Attended / Checked In': r.attended ? 'YES' : 'NO',
      'Registration Date': r.date || 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendees");
    XLSX.writeFile(workbook, `TEDxIGDTUW_Attendees_List.xlsx`);
  };

  // Certificate Download Logic
  const downloadCertificate = (user) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200; canvas.height = 850;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#090D16'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#EB0028'; ctx.lineWidth = 14; ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);
    ctx.strokeStyle = '#374151'; ctx.lineWidth = 2; ctx.strokeRect(45, 45, canvas.width - 90, canvas.height - 90);

    ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF PARTICIPATION', 600, 150);

    ctx.fillStyle = '#EB0028'; ctx.font = 'bold 30px sans-serif';
    ctx.fillText('TEDxIGDTUW 2026', 600, 210);

    ctx.fillStyle = '#9CA3AF'; ctx.font = '22px sans-serif';
    ctx.fillText('This certificate is proudly awarded to', 600, 310);

    ctx.fillStyle = '#FFFFFF'; ctx.font = 'extrabold 52px sans-serif';
    ctx.fillText(user.name.toUpperCase(), 600, 400);

    ctx.fillStyle = '#EB0028'; ctx.fillRect(400, 420, 400, 4);

    ctx.fillStyle = '#D1D5DB'; ctx.font = '20px sans-serif';
    ctx.fillText(`For active participation in the annual TEDxIGDTUW flagship event.`, 600, 490);
    ctx.fillText(`Issued on ${user.date || 'August 2026'} • Verified Registration ID: ${user.id}`, 600, 530);

    const link = document.createElement('a');
    link.download = `${user.name.replace(/\s+/g, '_')}_TEDx_Certificate.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const totalCount = registrations.length;
  const attendedCount = registrations.filter(r => r.attended).length;
  const pendingCount = totalCount - attendedCount;
  const percentAttended = totalCount > 0 ? Math.round((attendedCount / totalCount) * 100) : 0;

  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBranch = filterBranch === 'All' || r.branch.toUpperCase() === filterBranch.toUpperCase();
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      {/* NAVBAR */}
      <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('register')}>
            <span className="text-2xl font-black tracking-tight text-red-600">TEDx</span>
            <span className="text-xl font-bold tracking-tight text-white">IGDTUW</span>
          </div>
          <div className="flex gap-2 text-sm font-medium overflow-x-auto py-2">
            {!isLoggedIn ? (
              <button onClick={() => setActiveTab('register')} className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${activeTab === 'register' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                Registration
              </button>
            ) : (
              <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                My Pass & Certificate
              </button>
            )}
            <button onClick={() => setActiveTab('speakers')} className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${activeTab === 'speakers' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              Nominate Speaker
            </button>
            <button onClick={() => setActiveTab('recruitments')} className={`px-3 py-1.5 rounded-lg transition whitespace-nowrap ${activeTab === 'recruitments' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              Join Team
            </button>
            <button onClick={() => setActiveTab('admin')} className={`px-3 py-1.5 rounded-lg border border-gray-700 transition flex items-center gap-1.5 whitespace-nowrap ${activeTab === 'admin' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}>
              <Shield className="w-4 h-4 text-red-500" /> Admin Desk
            </button>
            {isLoggedIn && (
              <button onClick={() => { setIsLoggedIn(false); setCurrentUser(null); setActiveTab('register'); }} className="px-3 py-1.5 text-gray-400 hover:text-red-400">
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

        {/* VIEW 2: SPEAKER APPLICATIONS */}
        {activeTab === 'speakers' && (
          <div className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Mic className="w-8 h-8 text-red-500" />
              <div>
                <h2 className="text-2xl font-extrabold text-white">Call for Speakers</h2>
                <p className="text-xs text-gray-400">Apply or nominate a speaker for TEDxIGDTUW 2026</p>
              </div>
            </div>

            <form onSubmit={handleSpeakerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Speaker Full Name</label>
                <input type="text" required value={speakerData.name} onChange={e => setSpeakerData({...speakerData, name: e.target.value})} placeholder="Dr. Jane Doe" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Contact Email</label>
                <input type="email" required value={speakerData.email} onChange={e => setSpeakerData({...speakerData, email: e.target.value})} placeholder="speaker@domain.com" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Proposed Talk Title / Topic</label>
                <input type="text" required value={speakerData.talkTitle} onChange={e => setSpeakerData({...speakerData, talkTitle: e.target.value})} placeholder="e.g. The Future of AI in Healthcare" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Short Bio & Past Experience</label>
                <textarea required rows={3} value={speakerData.bio} onChange={e => setSpeakerData({...speakerData, bio: e.target.value})} placeholder="Tell us about yourself..." className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">LinkedIn Profile URL</label>
                <input type="url" value={speakerData.linkedin} onChange={e => setSpeakerData({...speakerData, linkedin: e.target.value})} placeholder="https://linkedin.com/in/username" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
              </div>
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Submit Speaker Nomination
              </button>
            </form>
          </div>
        )}

        {/* VIEW 3: RECRUITMENTS */}
        {activeTab === 'recruitments' && (
          <div className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="w-8 h-8 text-red-500" />
              <div>
                <h2 className="text-2xl font-extrabold text-white">Join Society Team</h2>
                <p className="text-xs text-gray-400">Apply to become an organizing committee member for TEDxIGDTUW</p>
              </div>
            </div>

            <form onSubmit={handleRecruitmentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Full Name</label>
                <input type="text" required value={recruitmentData.name} onChange={e => setRecruitmentData({...recruitmentData, name: e.target.value})} placeholder="Student Name" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">College Email</label>
                <input type="email" required value={recruitmentData.email} onChange={e => setRecruitmentData({...recruitmentData, email: e.target.value})} placeholder="student@igdtuw.ac.in" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Branch</label>
                  <input type="text" required value={recruitmentData.branch} onChange={e => setRecruitmentData({...recruitmentData, branch: e.target.value})} placeholder="CSE / IT" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Domain</label>
                  <select value={recruitmentData.domain} onChange={e => setRecruitmentData({...recruitmentData, domain: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600">
                    <option value="Technical">Technical & Web</option>
                    <option value="Graphic Design">Graphic Design & Video</option>
                    <option value="Public Relations">Public Relations & Marketing</option>
                    <option value="Logistics">Sponsorship & Logistics</option>
                    <option value="Curation">Speaker Curation</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Why do you want to join TEDxIGDTUW?</label>
                <textarea required rows={3} value={recruitmentData.whyJoin} onChange={e => setRecruitmentData({...recruitmentData, whyJoin: e.target.value})} placeholder="Share your motivation..." className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
              </div>
              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> Submit Application
              </button>
            </form>
          </div>
        )}

        {/* VIEW 4: USER DASHBOARD */}
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

        {/* VIEW 5: ADMIN DESK */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-white">Organiser Dashboard</h2>
                <p className="text-xs text-gray-400">Live venue management, speaker nominations & recruitments.</p>
              </div>

              {/* EXCEL EXPORT BUTTON */}
              <button onClick={exportToExcel} className="bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-green-600 flex items-center gap-2 transition">
                <Download className="w-4 h-4" /> Export All Data to Excel (.xlsx)
              </button>
            </div>

            {/* METRICS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase">
                  <Users className="w-4 h-4 text-blue-500" /> Total Registered
                </div>
                <div className="text-2xl font-black text-white mt-1">{totalCount}</div>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase">
                  <Award className="w-4 h-4 text-green-500" /> Attended
                </div>
                <div className="text-2xl font-black text-green-400 mt-1">{attendedCount}</div>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase">
                  <Mic className="w-4 h-4 text-purple-500" /> Speaker Applicants
                </div>
                <div className="text-2xl font-black text-purple-400 mt-1">{speakerApps.length}</div>
              </div>

              <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold uppercase">
                  <UserPlus className="w-4 h-4 text-yellow-500" /> Recruits Applied
                </div>
                <div className="text-2xl font-black text-yellow-400 mt-1">{recruitApps.length}</div>
              </div>
            </div>

            {/* ATTENDEE SCANNER */}
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
                </div>
              )}
            </div>

            {/* ATTENDEE TABLE */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden p-4 space-y-4">
              <h3 className="font-bold text-white text-lg">Event Attendees</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                  <thead className="bg-gray-950 text-gray-200 border-b border-gray-800 text-xs uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-3">Ticket ID</th>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Branch / Year</th>
                      <th className="px-4 py-3">Status</th>
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
                            <span className="text-xs text-green-400 bg-green-950/60 px-2.5 py-1 rounded-full border border-green-800/40">Checked-in</span>
                          ) : (
                            <span className="text-xs text-gray-500 bg-gray-950 px-2.5 py-1 rounded-full border border-gray-800">Pending</span>
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