import React, { useState, useEffect } from 'react';
import { 
  Ticket, Calendar, MapPin, Search, CheckCircle, UserPlus, 
  Send, QrCode, AlertCircle, Shield, Award, Users, Check, Clock 
} from 'lucide-react';
import { db } from './firebase'; 
import { collection, addDoc, getDocs, doc, updateDoc } from 'firebase/firestore';

export default function App() {
  const [activeTab, setActiveTab] = useState('tickets');
  const [formData, setFormData] = useState({ name: '', email: '', branch: '', year: '1st Year' });
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  
  // Recruitment Form State
  const [applicantType, setApplicantType] = useState('new'); // 'new' or 'existing'
  const [recruitmentData, setRecruitmentData] = useState({ 
    name: '', 
    email: '', 
    branch: '', 
    year: '', 
    domain: 'Technical Lead / Core', 
    whyJoin: '',
    previousRole: '',         // For existing members
    pastContributions: ''    // For existing members
  });

  // Admin Portal State
  const [adminAuth, setAdminAuth] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState('');
  const [registrations, setRegistrations] = useState([]);
  const [applications, setApplications] = useState([]);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  // Registration Form Submission
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

  // Find Existing Ticket
  const handleFindTicket = async (e) => {
    e.preventDefault();
    try {
      const querySnapshot = await getDocs(collection(db, "registrations"));
      let found = false;
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.email.toLowerCase() === searchEmail.toLowerCase()) {
          setCurrentUser({ ...data, docId: docSnap.id });
          setIsLoggedIn(true);
          setActiveTab('dashboard');
          found = true;
        }
      });
      if (!found) alert("No pass found registered with this email!");
    } catch (err) {
      alert("Error finding pass!");
    }
  };

  // Recruitment / Promotion Submission
  const handleRecruitmentSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "recruitment_applications"), { 
        ...recruitmentData, 
        applicantType: applicantType,
        appliedAt: new Date().toISOString() 
      });
      alert(applicantType === 'existing' 
        ? "Promotion Application Submitted Successfully!" 
        : "Recruitment Application Submitted Successfully!"
      );
      setRecruitmentData({ 
        name: '', email: '', branch: '', year: '', domain: 'Technical Lead / Core', 
        whyJoin: '', previousRole: '', pastContributions: '' 
      });
    } catch (err) { 
      alert("Submission failed!"); 
    }
  };

  // Fetch Admin Data
  const fetchAdminData = async () => {
    setLoadingData(true);
    try {
      const regSnap = await getDocs(collection(db, "registrations"));
      const regList = regSnap.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
      setRegistrations(regList);

      const appSnap = await getDocs(collection(db, "recruitment_applications"));
      const appList = appSnap.docs.map(doc => ({ ...doc.data(), docId: doc.id }));
      setApplications(appList);
    } catch (err) {
      console.error(err);
    }
    setLoadingData(false);
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
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-red-600 selection:text-white">
      {/* NAVBAR */}
      <header className="border-b border-gray-800 bg-black/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-red-600 tracking-tighter">TEDx</span>
            <span className="text-xl font-bold tracking-widest text-white">IGDTUW</span>
          </div>

          <nav className="flex items-center gap-1 bg-gray-900 p-1 rounded-full border border-gray-800">
            <button
              onClick={() => setActiveTab('tickets')}
              className={`px-4 py-2 text-xs font-bold rounded-full transition ${activeTab === 'tickets' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Get Event Pass
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-xs font-bold rounded-full transition ${activeTab === 'dashboard' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              My Pass / Status
            </button>
            <button
              onClick={() => setActiveTab('recruitments')}
              className={`px-4 py-2 text-xs font-bold rounded-full transition ${activeTab === 'recruitments' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Join Team / Upgrade
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-4 py-2 text-xs font-bold rounded-full transition ${activeTab === 'admin' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Admin Portal
            </button>
          </nav>
        </div>
      </header>

      {/* HERO BANNER */}
      <div className="relative overflow-hidden border-b border-gray-800 bg-gradient-to-b from-red-950/20 to-black py-12 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block bg-red-600/10 text-red-500 border border-red-600/30 font-semibold text-xs px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
            Annual Flagship Conference 2026
          </span>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white mb-4">
            IDEAS WORTH SPREADING
          </h1>
          <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto mb-6">
            Join us for a transformative experience featuring visionary leaders, innovators, and changemakers at Indira Gandhi Delhi Technical University for Women.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-gray-300 font-medium">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-red-500" /> October 24, 2026</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-red-500" /> Auditorium, IGDTUW Campus</div>
          </div>
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 py-10">
        
        {/* VIEW 1: TICKETS / REGISTRATION */}
        {activeTab === 'tickets' && (
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Registration Form */}
            <div className="bg-gray-900 border border-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <Ticket className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-bold text-white">Register for Event Pass</h2>
              </div>
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Full Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Enter your name" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Email Address</label>
                  <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="name@igdtuw.ac.in" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Branch</label>
                    <input type="text" required value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} placeholder="CSE / IT / ECE" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Year</label>
                    <select value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600">
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition">
                  Claim Event Pass
                </button>
              </form>
            </div>

            {/* Find Pass Form */}
            <div className="bg-gray-900 border border-gray-800 p-6 md:p-8 rounded-2xl shadow-2xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Search className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-bold text-white">Already Registered?</h2>
                </div>
                <p className="text-gray-400 text-sm mb-6">
                  Enter your registered email address to view, download, or check attendance status for your TEDxIGDTUW entry pass.
                </p>
                <form onSubmit={handleFindTicket} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Registered Email</label>
                    <input type="email" required value={searchEmail} onChange={e => setSearchEmail(e.target.value)} placeholder="Enter registered email" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
                  </div>
                  <button type="submit" className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition border border-gray-700">
                    Find My Pass
                  </button>
                </form>
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
                <p className="text-gray-400 text-sm">Please register for an event pass or search with your registered email ID.</p>
                <button onClick={() => setActiveTab('tickets')} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm">Go to Registration</button>
              </div>
            ) : (
              <div className="bg-gradient-to-b from-gray-900 to-black border-2 border-red-600 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className="text-red-500 font-black text-2xl tracking-tighter">TEDx</span>
                    <span className="text-white font-bold text-lg">IGDTUW</span>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">PASS ID: {currentUser.id}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${currentUser.attended ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'}`}>
                    {currentUser.attended ? 'ATTENDED / VERIFIED' : 'PASS VALIDATED'}
                  </span>
                </div>

                <div className="bg-gray-950 border border-gray-800 rounded-2xl p-6 mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{currentUser.name}</h3>
                    <p className="text-xs text-gray-400">{currentUser.email}</p>
                    <p className="text-xs text-red-400 mt-2 font-medium">{currentUser.branch} • {currentUser.year}</p>
                  </div>
                  <div className="bg-white p-2 rounded-xl">
                    <QrCode className="w-16 h-16 text-black" />
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-4 flex justify-between items-center text-xs text-gray-400">
                  <div>Date: Oct 24, 2026</div>
                  <div>Venue: IGDTUW Auditorium</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: RECRUITMENTS / TEAM PROMOTION */}
        {activeTab === 'recruitments' && (
          <div className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <UserPlus className="w-8 h-8 text-red-500" />
              <div>
                <h2 className="text-2xl font-extrabold text-white">Join Society / Team Upgrade</h2>
                <p className="text-xs text-gray-400">Apply for core team roles or coordinator promotions for TEDxIGDTUW 2026</p>
              </div>
            </div>

            {/* APPLICANT TYPE TOGGLE */}
            <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800 mb-6">
              <button
                type="button"
                onClick={() => setApplicantType('new')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${applicantType === 'new' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                New Team Applicant
              </button>
              <button
                type="button"
                onClick={() => setApplicantType('existing')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${applicantType === 'existing' ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                Existing Member (Promotion / Leadership)
              </button>
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
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Branch & Year</label>
                  <input type="text" required value={recruitmentData.branch} onChange={e => setRecruitmentData({...recruitmentData, branch: e.target.value})} placeholder="CSE - 3rd Year" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Target Domain / Leadership Role</label>
                  <select value={recruitmentData.domain} onChange={e => setRecruitmentData({...recruitmentData, domain: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600">
                    <option value="Technical Lead / Core">Technical & Web</option>
                    <option value="Design Lead / Core">Graphic Design & Media</option>
                    <option value="PR & Sponsorship Lead">PR, Marketing & Sponsorship</option>
                    <option value="Event Ops Lead">Logistics & Event Operations</option>
                    <option value="Curator Lead">Speaker Curation</option>
                  </select>
                </div>
              </div>

              {/* DYNAMIC FIELDS FOR EXISTING MEMBERS ONLY */}
              {applicantType === 'existing' && (
                <div className="space-y-4 border-t border-b border-gray-800/80 py-4 my-2">
                  <span className="text-xs uppercase font-bold text-red-500 tracking-wider">Past Experience & Contribution Details</span>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Previous Tenure Role / Position Held</label>
                    <input type="text" required={applicantType === 'existing'} value={recruitmentData.previousRole} onChange={e => setRecruitmentData({...recruitmentData, previousRole: e.target.value})} placeholder="e.g. Executive - PR Team (2025)" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Key Contributions & Achievements in Previous Tenure</label>
                    <textarea required={applicantType === 'existing'} rows={3} value={recruitmentData.pastContributions} onChange={e => setRecruitmentData({...recruitmentData, pastContributions: e.target.value})} placeholder="Mention major tasks done, sponsorships brought, or events managed..." className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">
                  {applicantType === 'existing' ? 'Vision for Target Role / Higher Position' : 'Why do you want to join TEDxIGDTUW?'}
                </label>
                <textarea required rows={3} value={recruitmentData.whyJoin} onChange={e => setRecruitmentData({...recruitmentData, whyJoin: e.target.value})} placeholder="Share your motivation and goals..." className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
              </div>

              <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> {applicantType === 'existing' ? 'Submit Promotion Application' : 'Submit Application'}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 4: ADMIN PORTAL */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            {!adminAuth ? (
              <div className="max-w-md mx-auto bg-gray-900 border border-gray-800 p-8 rounded-2xl">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="w-6 h-6 text-red-500" />
                  <h2 className="text-xl font-bold text-white">Admin Authentication</h2>
                </div>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-gray-400 mb-1">Passcode</label>
                    <input type="password" required value={adminPasscode} onChange={e => setAdminPasscode(e.target.value)} placeholder="Enter admin passcode" className="w-full bg-gray-950 border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-red-600" />
                  </div>
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition">
                    Access Dashboard
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Admin Header & Search */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-900 p-6 rounded-2xl border border-gray-800">
                  <div>
                    <h2 className="text-2xl font-black text-white">TEDx Organiser Admin</h2>
                    <p className="text-xs text-gray-400">Manage attendees, mark attendance & review coordinator applications</p>
                  </div>
                  <input
                    type="text"
                    value={adminSearchTerm}
                    onChange={e => setAdminSearchTerm(e.target.value)}
                    placeholder="Search by name or email..."
                    className="bg-gray-950 border border-gray-800 px-4 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-red-600 w-full md:w-64"
                  />
                </div>

                {/* Event Attendees Table */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="p-4 bg-gray-950 border-b border-gray-800 font-bold text-sm text-white flex justify-between items-center">
                    <span>Registered Attendees ({registrations.length})</span>
                    <button onClick={fetchAdminData} className="text-xs text-red-500 hover:underline">Refresh Data</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-950/50 text-gray-400 uppercase border-b border-gray-800">
                        <tr>
                          <th className="p-4">Pass ID</th>
                          <th className="p-4">Name</th>
                          <th className="p-4">Email</th>
                          <th className="p-4">Branch/Year</th>
                          <th className="p-4">Attendance Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800 text-gray-300">
                        {registrations.filter(r => r.name?.toLowerCase().includes(adminSearchTerm.toLowerCase()) || r.email?.toLowerCase().includes(adminSearchTerm.toLowerCase())).map((item) => (
                          <tr key={item.docId} className="hover:bg-gray-800/30">
                            <td className="p-4 font-mono font-bold text-red-400">{item.id}</td>
                            <td className="p-4 font-medium text-white">{item.name}</td>
                            <td className="p-4">{item.email}</td>
                            <td className="p-4">{item.branch} ({item.year})</td>
                            <td className="p-4">
                              <button
                                onClick={() => toggleAttendance(item.docId, item.attended)}
                                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition ${item.attended ? 'bg-green-600/20 text-green-400 border border-green-600/40' : 'bg-gray-800 text-gray-300 hover:bg-red-600 hover:text-white'}`}
                              >
                                {item.attended ? <Check className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                {item.attended ? 'Present' : 'Mark Present'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recruitment Applications Table */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                  <div className="p-4 bg-gray-950 border-b border-gray-800 font-bold text-sm text-white">
                    Team Recruitment & Promotion Applications ({applications.length})
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-950/50 text-gray-400 uppercase border-b border-gray-800">
                        <tr>
                          <th className="p-4">Applicant Type</th>
                          <th className="p-4">Name & Email</th>
                          <th className="p-4">Target Role</th>
                          <th className="p-4">Previous Experience (If Any)</th>
                          <th className="p-4">Statement / Vision</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800 text-gray-300">
                        {applications.map((app) => (
                          <tr key={app.docId} className="hover:bg-gray-800/30">
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${app.applicantType === 'existing' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'}`}>
                                {app.applicantType === 'existing' ? 'Coordinator Promotion' : 'New Member'}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-white">{app.name}</div>
                              <div className="text-gray-400">{app.email}</div>
                              <div className="text-gray-500 text-[10px]">{app.branch}</div>
                            </td>
                            <td className="p-4 font-semibold text-red-400">{app.domain}</td>
                            <td className="p-4 max-w-xs">
                              {app.applicantType === 'existing' ? (
                                <div>
                                  <div className="font-bold text-gray-200">{app.previousRole}</div>
                                  <div className="text-gray-400 line-clamp-2">{app.pastContributions}</div>
                                </div>
                              ) : <span className="text-gray-600">N/A</span>}
                            </td>
                            <td className="p-4 max-w-xs line-clamp-2 text-gray-300">{app.whyJoin}</td>
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
    </div>
  );
}