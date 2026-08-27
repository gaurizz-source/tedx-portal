import React, { useState } from 'react';
import { 
  Ticket, Calendar, Search, UserPlus, Mic, X,
  Send, QrCode, AlertCircle, Shield, Check, Clock, UserCheck,
  TrendingUp, Award, Download, ScanLine, Camera, Rocket, Users
} from 'lucide-react';
import { db } from './firebase'; 
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState('tickets');
  
  // Auth & Pass State
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedEventForPass, setSelectedEventForPass] = useState(null);
  const [authMode, setAuthMode] = useState('signup'); 

  // Auth Form State
  const [authForm, setAuthForm] = useState({ name: '', email: '', branch: '', year: '1st Year' });
  const [searchEmail, setSearchEmail] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  // Application Form State (Speaker, New Applicant & Internal Progression)
  const [applicantType, setApplicantType] = useState('speaker'); // 'speaker', 'new', or 'internal'
  const [recruitmentData, setRecruitmentData] = useState({ 
    name: '', 
    email: '', 
    branch: '', 
    year: '1st Year', 
    // Speaker Specific
    speakerTopic: '', 
    speakerBio: '', 
    // New Team Specific
    targetDepartment: 'Curation', 
    whyJoin: '', 
    portfolioUrl: '',
    // Internal Progression Specific
    currentRole: '', 
    targetRole: 'Executive Director', 
    pastContributions: '', 
    futureVision: '' 
  });

  // Admin Portal State
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [scanInputId, setScanInputId] = useState('');
  const [showCameraScanner, setShowCameraScanner] = useState(false);

  // Sample Upcoming Events
  const upcomingEvents = [
    {
      id: 1,
      title: "TEDxIGDTUW 2026 Main Conference",
      category: "CONFERENCE",
      society: "TEDxIGDTUW",
      date: "2026-10-24",
      appliedCount: 142,
      tagColor: "bg-red-600",
      image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80",
      desc: "Flagship event featuring visionary speakers, impactful talks, and networking."
    },
    {
      id: 2,
      title: "Public Speaking & Curation Workshop",
      category: "WORKSHOP",
      society: "TEDx Mentors",
      date: "2026-09-15",
      appliedCount: 88,
      tagColor: "bg-blue-600",
      image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=800&q=80",
      desc: "Learn storytelling, stage presence, and talk curation techniques."
    },
    {
      id: 3,
      title: "Idea Pitching 2026 — 24-Hour Challenge",
      category: "HACKATHON",
      society: "TEDx Tech",
      date: "2026-09-28",
      appliedCount: 64,
      tagColor: "bg-purple-600",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
      desc: "Pitch innovative social ideas to TEDx curators & win VIP passes."
    }
  ];

  const handleGetPassClick = (eventItem) => {
    setSelectedEventForPass(eventItem);
    if (isLoggedIn && currentUser) {
      alert(`Pass registered successfully for ${eventItem.title}!`);
      setActiveTab('dashboard');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleSignUpAndRegister = async (e) => {
    e.preventDefault();
    if (!authForm.name || !authForm.email) return alert('Please fill all required fields');

    const newId = `TEDX-${Math.floor(100 + Math.random() * 900)}`;
    const newUser = {
      id: newId,
      name: authForm.name,
      email: authForm.email,
      branch: authForm.branch,
      year: authForm.year,
      attended: false,
      date: new Date().toISOString().split('T')[0],
      eventName: selectedEventForPass?.title || "TEDxIGDTUW 2026 Main Conference"
    };

    try {
      const docRef = await addDoc(collection(db, "registrations"), newUser);
      setCurrentUser({ ...newUser, docId: docRef.id });
      setIsLoggedIn(true);
      setShowAuthModal(false);
      setActiveTab('dashboard');
      alert(`Registration Successful! Ticket ID: ${newId}`);
    } catch (error) {
      alert("Registration failed! Check Firebase connection.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const querySnapshot = await getDocs(collection(db, "registrations"));
      let found = false;
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.email.toLowerCase() === searchEmail.toLowerCase()) {
          setCurrentUser({ ...data, docId: docSnap.id });
          setIsLoggedIn(true);
          setShowAuthModal(false);
          setActiveTab('dashboard');
          found = true;
        }
      });
      if (!found) alert("No pass found registered with this email!");
    } catch (err) {
      alert("Error logging in!");
    }
  };

  const handleRecruitmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "recruitment_applications"), { 
        ...recruitmentData, 
        applicantType: applicantType,
        appliedAt: new Date().toISOString() 
      });
      alert("Application Submitted Successfully!");
      setRecruitmentData({ 
        name: '', email: '', branch: '', year: '1st Year',
        speakerTopic: '', speakerBio: '', 
        targetDepartment: 'Curation', whyJoin: '', portfolioUrl: '',
        currentRole: '', targetRole: 'Executive Director', pastContributions: '', futureVision: ''
      });
    } catch (err) { 
      alert("Submission failed!"); 
    }
  };

  const fetchAdminData = async () => {
    try {
      const regSnap = await getDocs(collection(db, "registrations"));
      setRegistrations(regSnap.docs.map(doc => ({ ...doc.data(), docId: doc.id })));
      const appSnap = await getDocs(collection(db, "recruitment_applications"));
      setApplications(appSnap.docs.map(doc => ({ ...doc.data(), docId: doc.id })));
    } catch (err) { 
      console.error(err); 
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminPasscode === 'tedx2026admin') {
      setAdminAuth(true);
      fetchAdminData();
    } else {
      alert("Invalid Admin Passcode!");
    }
  };

  const toggleAttendance = async (docId, currentStatus) => {
    try {
      const docRef = doc(db, "registrations", docId);
      await updateDoc(docRef, { attended: !currentStatus });
      setRegistrations(prev => prev.map(item => item.docId === docId ? { ...item, attended: !currentStatus } : item));
    } catch (err) { alert("Failed to update status"); }
  };

  const handleQuickScan = async (targetId) => {
    const searchId = targetId || scanInputId;
    if (!searchId) return;

    const foundUser = registrations.find(r => r.id?.toLowerCase() === searchId.trim().toLowerCase());
    if (foundUser) {
      if (foundUser.attended) {
        alert(`Attendee ${foundUser.name} (${foundUser.id}) is ALREADY marked Present!`);
      } else {
        await toggleAttendance(foundUser.docId, false);
        alert(`SUCCESS: ${foundUser.name} (${foundUser.id}) checked in successfully!`);
      }
      setScanInputId('');
    } else {
      alert(`ERROR: Pass ID "${searchId}" not found in system database!`);
    }
  };

  const handleDownloadCertificate = (name, eventName) => {
    alert(`Generating & Downloading Participation Certificate for ${name} (${eventName})...`);
  };

  // CSV Export Functionality (Registrations)
  const exportRegistrationsCSV = () => {
    if (registrations.length === 0) {
      alert("No attendee data available to export!");
      return;
    }
    const headers = ["Ticket ID", "Name", "Email", "Branch", "Year", "Event Name", "Attended Status", "Registration Date"];
    const rows = registrations.map(r => [
      `"${r.id || ''}"`,
      `"${r.name || ''}"`,
      `"${r.email || ''}"`,
      `"${r.branch || ''}"`,
      `"${r.year || ''}"`,
      `"${(r.eventName || '').replace(/"/g, '""')}"`,
      `"${r.attended ? 'Present' : 'Absent'}"`,
      `"${r.date || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `TEDx_Attendees_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV Export Functionality (Recruitments & Internal Progression)
  const exportApplicationsCSV = () => {
    if (applications.length === 0) {
      alert("No application data available to export!");
      return;
    }
    const headers = ["Applicant Type", "Name", "Email", "Branch", "Year", "Speaker Topic / Dept / Current Role", "Bio / Why Join / Past Contributions", "Vision / Portfolio", "Applied At"];
    const rows = applications.map(a => [
      `"${a.applicantType || ''}"`,
      `"${a.name || ''}"`,
      `"${a.email || ''}"`,
      `"${a.branch || ''}"`,
      `"${a.year || ''}"`,
      `"${a.speakerTopic || a.targetDepartment || a.currentRole || ''}"`,
      `"${(a.speakerBio || a.whyJoin || a.pastContributions || '').replace(/"/g, '""')}"`,
      `"${(a.futureVision || a.portfolioUrl || '').replace(/"/g, '""')}"`,
      `"${a.appliedAt || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `TEDx_Applications_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analytics Calculations
  const totalRegistrations = registrations.length;
  const totalAttended = registrations.filter(r => r.attended).length;
  const attendanceRate = totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0;

  const filteredRegistrations = registrations.filter(r => 
    r.name?.toLowerCase().includes(adminSearchTerm.toLowerCase()) || 
    r.id?.toLowerCase().includes(adminSearchTerm.toLowerCase()) ||
    r.email?.toLowerCase().includes(adminSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0d0f12] text-gray-100 font-sans selection:bg-red-600 selection:text-white">
      {/* NAVBAR */}
      <header className="border-b border-gray-800 bg-[#0d0f12]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 text-white font-black text-xl w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30">
              X
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white">TEDx<span className="text-red-500">IGDTUW</span></span>
              <p className="text-[10px] text-emerald-400 font-medium tracking-wider uppercase">Opportunity Hub</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-2 bg-gray-900/80 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${activeTab === 'tickets' ? 'bg-emerald-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              Explore Events
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${activeTab === 'dashboard' ? 'bg-emerald-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              My Pass / Dashboard
            </button>
            <button
              onClick={() => setActiveTab('recruitments')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${activeTab === 'recruitments' ? 'bg-emerald-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              Speakers & Team Roles
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${activeTab === 'admin' ? 'bg-emerald-500 text-gray-950 font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              Admin Portal
            </button>
          </nav>

          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-xl border border-gray-800 text-xs">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-white">{currentUser?.name?.split(' ')[0]}</span>
                <button onClick={() => { setIsLoggedIn(false); setCurrentUser(null); }} className="text-red-400 ml-2 hover:underline text-[10px]">Logout</button>
              </div>
            ) : (
              <button 
                onClick={() => { setSelectedEventForPass(upcomingEvents[0]); setShowAuthModal(true); }}
                className="bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-extrabold text-xs px-4 py-2 rounded-xl transition"
              >
                Sign Up / Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* VIEW 1: HOME & EVENTS GRID */}
        {activeTab === 'tickets' && (
          <div className="space-y-8">
            <div className="relative rounded-3xl overflow-hidden border border-emerald-900/40 bg-gradient-to-r from-emerald-950 via-gray-900 to-black p-8 md:p-12 shadow-2xl">
              <div className="max-w-3xl space-y-4 relative z-10">
                <span className="inline-block bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  ✦ OFFICIAL STUDENT HUB
                </span>
                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                  Discover and Excel in Campus <span className="text-emerald-400">Opportunities</span>
                </h1>
                <p className="text-gray-400 text-sm leading-relaxed max-w-2xl">
                  Access flagship conferences, curation workshops, speaker sessions, and core team recruitments curated specifically by TEDxIGDTUW.
                </p>
              </div>

              <div className="mt-8 bg-gray-950/90 border border-gray-800 p-2.5 rounded-2xl flex flex-col md:flex-row gap-3 shadow-xl backdrop-blur-md">
                <div className="flex-1 flex items-center gap-3 px-3 bg-gray-900/80 rounded-xl border border-gray-800">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by event title, domain, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent py-2.5 text-xs text-white focus:outline-none placeholder-gray-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select 
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-xs text-gray-300 rounded-xl px-4 py-2.5 focus:outline-none"
                  >
                    <option value="All">Type (All)</option>
                    <option value="CONFERENCE">Conference</option>
                    <option value="WORKSHOP">Workshop</option>
                    <option value="HACKATHON">Hackathon</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="w-1.5 h-5 bg-emerald-500 rounded-full inline-block"></span>
                    New & Upcoming Events
                  </h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {upcomingEvents
                    .filter(ev => selectedType === 'All' || ev.category === selectedType)
                    .filter(ev => ev.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((item) => (
                      <div key={item.id} className="bg-gray-900/90 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition shadow-lg group flex flex-col justify-between">
                        <div>
                          <div className="relative h-44 overflow-hidden bg-gray-950">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                            <span className={`absolute top-3 left-3 text-[10px] font-black tracking-widest text-white px-2.5 py-1 rounded-md ${item.tagColor}`}>
                              {item.category}
                            </span>
                          </div>

                          <div className="p-5 space-y-3">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{item.society}</span>
                            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition leading-snug">{item.title}</h3>
                            <p className="text-xs text-gray-400 line-clamp-2">{item.desc}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium pt-2 border-t border-gray-800/80">
                              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                              <span>{item.date}</span>
                            </div>
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-gray-800/40">
                          <span className="text-xs text-gray-400">{item.appliedCount} Registered</span>
                          <button 
                            onClick={() => handleGetPassClick(item)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition"
                          >
                            Get Pass
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-sm font-bold text-white mb-4">Your Pass Status</h3>
                  {isLoggedIn && currentUser ? (
                    <div className="bg-gray-950 border border-emerald-500/30 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs font-bold text-white">{currentUser.eventName || "TEDxIGDTUW 2026 Pass"}</h4>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-emerald-400 font-mono">ID: {currentUser.id}</span>
                        <button onClick={() => setActiveTab('dashboard')} className="bg-emerald-500 text-gray-950 text-[10px] font-bold px-3 py-1 rounded-lg">
                          Show QR Pass
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-950 border border-gray-800/80 rounded-xl p-4 text-center space-y-3">
                      <p className="text-xs text-gray-400">Sign in to check your pass status.</p>
                      <button onClick={() => { setSelectedEventForPass(upcomingEvents[0]); setShowAuthModal(true); }} className="bg-emerald-500 text-gray-950 text-xs font-bold px-4 py-2 rounded-xl w-full">
                        Sign Up / Login
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: DASHBOARD / PASS */}
        {activeTab === 'dashboard' && (
          <div className="max-w-xl mx-auto">
            {!isLoggedIn || !currentUser ? (
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <h2 className="text-xl font-bold text-white">No Active Pass Found</h2>
                <button onClick={() => { setSelectedEventForPass(upcomingEvents[0]); setShowAuthModal(true); }} className="bg-emerald-500 text-gray-950 font-bold px-6 py-2 rounded-xl text-sm">Sign Up / Login</button>
              </div>
            ) : (
              <div className="bg-gradient-to-b from-gray-900 to-black border-2 border-emerald-500/50 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-red-500 font-black text-2xl">TEDx</span>
                    <span className="text-white font-bold text-lg">IGDTUW</span>
                    <p className="text-xs text-gray-400 font-mono">PASS ID: {currentUser.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentUser.attended ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'}`}>
                    {currentUser.attended ? 'ATTENDED / VERIFIED' : 'PASS VALIDATED'}
                  </span>
                </div>

                <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{currentUser.name}</h3>
                    <p className="text-xs text-gray-400">{currentUser.email}</p>
                    <p className="text-xs text-emerald-400 mt-2 font-medium">{currentUser.branch} • {currentUser.year}</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl">
                    <QrCode className="w-16 h-16 text-black" />
                  </div>
                </div>

                {currentUser.attended && (
                  <button 
                    onClick={() => handleDownloadCertificate(currentUser.name, currentUser.eventName)} 
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-black py-3 rounded-xl transition flex items-center justify-center gap-2 mb-4"
                  >
                    <Award className="w-4 h-4" /> Download Certificate of Participation
                  </button>
                )}

                <div className="border-t border-gray-800 pt-4 flex justify-between items-center text-xs text-gray-400">
                  <div>Event: {currentUser.eventName || "TEDxIGDTUW 2026"}</div>
                  <div>Venue: IGDTUW Auditorium</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: SPEAKERS, NEW MEMBERS & INTERNAL PROGRESSION */}
        {activeTab === 'recruitments' && (
          <div className="max-w-3xl mx-auto bg-gray-900 border border-gray-800 p-6 md:p-8 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Mic className="w-8 h-8 text-red-500" />
              <div>
                <h2 className="text-2xl font-extrabold text-white">Speaker Nomination & Team Roles</h2>
                <p className="text-xs text-gray-400">Apply to speak at TEDxIGDTUW, join as a new member, or apply for internal leadership roles.</p>
              </div>
            </div>

            {/* Application Options Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-gray-950 p-2 rounded-2xl border border-gray-800 mb-8">
              <button
                type="button"
                onClick={() => setApplicantType('speaker')}
                className={`flex items-center justify-center gap-2 py-3 px-3 text-xs font-bold rounded-xl transition ${
                  applicantType === 'speaker' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Mic className="w-4 h-4" /> 🎙️ Apply as Speaker
              </button>

              <button
                type="button"
                onClick={() => setApplicantType('new')}
                className={`flex items-center justify-center gap-2 py-3 px-3 text-xs font-bold rounded-xl transition ${
                  applicantType === 'new' ? 'bg-emerald-500 text-gray-950 shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Users className="w-4 h-4" /> 👥 New Team Applicant
              </button>

              <button
                type="button"
                onClick={() => setApplicantType('internal')}
                className={`flex items-center justify-center gap-2 py-3 px-3 text-xs font-bold rounded-xl transition ${
                  applicantType === 'internal' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Rocket className="w-4 h-4" /> 🚀 Internal Progression
              </button>
            </div>

            {/* Dynamic Application Form */}
            <form onSubmit={handleRecruitmentSubmit} className="space-y-5">
              
              {/* Common Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={recruitmentData.name}
                    onChange={e => setRecruitmentData({...recruitmentData, name: e.target.value})}
                    placeholder="Enter your name"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={recruitmentData.email}
                    onChange={e => setRecruitmentData({...recruitmentData, email: e.target.value})}
                    placeholder="student@igdtuw.ac.in"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Speaker Fields */}
              {applicantType === 'speaker' && (
                <div className="space-y-4 border-t border-gray-800/80 pt-4">
                  <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">Speaker Proposal Details</span>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Proposed Talk Title *</label>
                    <input
                      type="text"
                      required
                      value={recruitmentData.speakerTopic}
                      onChange={e => setRecruitmentData({...recruitmentData, speakerTopic: e.target.value})}
                      placeholder="e.g. AI Ethics in Modern Engineering"
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Speaker Pitch & Bio *</label>
                    <textarea
                      required
                      rows={4}
                      value={recruitmentData.speakerBio}
                      onChange={e => setRecruitmentData({...recruitmentData, speakerBio: e.target.value})}
                      placeholder="Briefly describe your proposed talk topic, domain expertise, and key insights..."
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              )}

              {/* New Team Member Fields */}
              {applicantType === 'new' && (
                <div className="space-y-4 border-t border-gray-800/80 pt-4">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">New Candidate Details</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Target Department</label>
                      <select
                        value={recruitmentData.targetDepartment}
                        onChange={e => setRecruitmentData({...recruitmentData, targetDepartment: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Curation">Curation & Content</option>
                        <option value="Technical">Technical & Web</option>
                        <option value="Sponsorship">Sponsorship & Finance</option>
                        <option value="PR & Marketing">PR & Marketing</option>
                        <option value="Design & Media">Design & Media</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Portfolio / Resume Link</label>
                      <input
                        type="url"
                        value={recruitmentData.portfolioUrl}
                        onChange={e => setRecruitmentData({...recruitmentData, portfolioUrl: e.target.value})}
                        placeholder="https://drive.google.com/..."
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Why do you want to join TEDxIGDTUW? *</label>
                    <textarea
                      required
                      rows={3}
                      value={recruitmentData.whyJoin}
                      onChange={e => setRecruitmentData({...recruitmentData, whyJoin: e.target.value})}
                      placeholder="Describe your motivation and relevant skillsets..."
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Internal Progression Fields */}
              {applicantType === 'internal' && (
                <div className="space-y-4 border-t border-gray-800/80 pt-4">
                  <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">Internal Promotion Application</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Current Role *</label>
                      <input
                        type="text"
                        required
                        value={recruitmentData.currentRole}
                        onChange={e => setRecruitmentData({...recruitmentData, currentRole: e.target.value})}
                        placeholder="e.g. Curation Associate"
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Target Leadership Position</label>
                      <select
                        value={recruitmentData.targetRole}
                        onChange={e => setRecruitmentData({...recruitmentData, targetRole: e.target.value})}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Executive Director">Executive Director</option>
                        <option value="Head of Curation">Head of Curation</option>
                        <option value="Tech Lead">Tech Lead</option>
                        <option value="Head of Sponsorship">Head of Sponsorship</option>
                        <option value="Media Director">Media Director</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Past Contributions & Future Vision *</label>
                    <textarea
                      required
                      rows={4}
                      value={recruitmentData.futureVision}
                      onChange={e => setRecruitmentData({...recruitmentData, futureVision: e.target.value})}
                      placeholder="Detail your key contributions to TEDxIGDTUW and your proposed vision for this role..."
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-xs"
              >
                <Send className="w-4 h-4" /> Submit Application
              </button>
            </form>
          </div>
        )}

        {/* VIEW 4: ADMIN PORTAL */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            {!adminAuth ? (
              <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 p-8 rounded-3xl shadow-2xl text-center">
                <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Admin Portal Login</h2>
                <p className="text-xs text-gray-400 mb-6">Enter system security passcode to access management tools.</p>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <input
                    type="password"
                    placeholder="Enter Passcode (tedx2026admin)"
                    value={adminPasscode}
                    onChange={e => setAdminPasscode(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-red-500 text-center"
                  />
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl transition">
                    Authenticate Access
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Total Passes</p>
                      <h3 className="text-2xl font-black text-white">{totalRegistrations}</h3>
                    </div>
                    <Ticket className="w-8 h-8 text-emerald-400" />
                  </div>

                  <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Verified Present</p>
                      <h3 className="text-2xl font-black text-emerald-400">{totalAttended}</h3>
                    </div>
                    <UserCheck className="w-8 h-8 text-emerald-400" />
                  </div>

                  <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Turnout Rate</p>
                      <h3 className="text-2xl font-black text-white">{attendanceRate}%</h3>
                    </div>
                    <TrendingUp className="w-8 h-8 text-indigo-400" />
                  </div>
                </div>

                {/* Quick Scanner & Action Bar */}
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex-1 flex items-center gap-2 w-full">
                    <ScanLine className="w-5 h-5 text-emerald-400" />
                    <input
                      type="text"
                      placeholder="Enter Pass ID (e.g. TEDX-123) for Quick Check-in..."
                      value={scanInputId}
                      onChange={e => setScanInputId(e.target.value)}
                      className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none flex-1"
                    />
                    <button onClick={() => handleQuickScan()} className="bg-emerald-500 text-gray-950 text-xs font-bold px-4 py-2 rounded-xl hover:bg-emerald-600">
                      Check In
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={exportRegistrationsCSV} className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5">
                      <Download className="w-4 h-4" /> Export Attendees
                    </button>
                    <button onClick={exportApplicationsCSV} className="bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5">
                      <Download className="w-4 h-4" /> Export Applications
                    </button>
                  </div>
                </div>

                {/* Attendees Table */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-white">Attendee Registrations</h3>
                    <input
                      type="text"
                      placeholder="Filter by name, pass ID..."
                      value={adminSearchTerm}
                      onChange={e => setAdminSearchTerm(e.target.value)}
                      className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-gray-300">
                      <thead className="bg-gray-950 text-gray-400 uppercase font-semibold text-[10px]">
                        <tr>
                          <th className="p-3">Pass ID</th>
                          <th className="p-3">Name</th>
                          <th className="p-3">Email</th>
                          <th className="p-3">Department</th>
                          <th className="p-3">Status</th>
                          <th className="p-3">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filteredRegistrations.map((reg) => (
                          <tr key={reg.docId} className="hover:bg-gray-800/40">
                            <td className="p-3 font-mono text-emerald-400">{reg.id}</td>
                            <td className="p-3 font-bold text-white">{reg.name}</td>
                            <td className="p-3 text-gray-400">{reg.email}</td>
                            <td className="p-3">{reg.branch} ({reg.year})</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${reg.attended ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                {reg.attended ? 'Present' : 'Absent'}
                              </span>
                            </td>
                            <td className="p-3">
                              <button
                                onClick={() => toggleAttendance(reg.docId, reg.attended)}
                                className="text-[10px] bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded text-white"
                              >
                                Toggle
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: AUTH / SIGNUP */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-3xl p-6 relative shadow-2xl">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-4 border-b border-gray-800 mb-6">
              <button
                onClick={() => setAuthMode('signup')}
                className={`pb-2 text-xs font-bold transition border-b-2 ${authMode === 'signup' ? 'border-emerald-500 text-white' : 'border-transparent text-gray-400'}`}
              >
                New Registration
              </button>
              <button
                onClick={() => setAuthMode('login')}
                className={`pb-2 text-xs font-bold transition border-b-2 ${authMode === 'login' ? 'border-emerald-500 text-white' : 'border-transparent text-gray-400'}`}
              >
                Find Existing Pass
              </button>
            </div>

            {authMode === 'signup' ? (
              <form onSubmit={handleSignUpAndRegister} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authForm.name}
                    onChange={e => setAuthForm({...authForm, name: e.target.value})}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={authForm.email}
                    onChange={e => setAuthForm({...authForm, email: e.target.value})}
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase font-semibold mb-1">Branch</label>
                    <input
                      type="text"
                      placeholder="CSE"
                      value={authForm.branch}
                      onChange={e => setAuthForm({...authForm, branch: e.target.value})}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase font-semibold mb-1">Year</label>
                    <select
                      value={authForm.year}
                      onChange={e => setAuthForm({...authForm, year: e.target.value})}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-500 text-gray-950 font-bold text-xs py-3 rounded-xl hover:bg-emerald-600 transition mt-2">
                  Confirm & Generate Pass
                </button>
              </form>
            ) : (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase font-semibold mb-1">Registered Email</label>
                  <input
                    type="email"
                    required
                    value={searchEmail}
                    onChange={e => setSearchEmail(e.target.value)}
                    placeholder="Enter email used during signup"
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <button type="submit" className="w-full bg-emerald-500 text-gray-950 font-bold text-xs py-3 rounded-xl hover:bg-emerald-600 transition">
                  Retrieve My Pass
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}