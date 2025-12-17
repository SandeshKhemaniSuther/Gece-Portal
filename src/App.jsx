import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase'; 
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from "firebase/auth";
import { 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc, 
    arrayUnion,
    collection, 
    getDocs     
} from "firebase/firestore";

// --- PDF Libraries ---
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Icons ---
const Icons = {
    Dashboard: () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>,
    Profile: () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>,
    Exam: () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>,
    Logout: () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>,
    Download: () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>,
    Upload: () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>,
    View: () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>,
    Close: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>,
    Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>,
    Delete: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
    Search: () => <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
};

const App = () => {
    // --- State Management ---
    const [user, setUser] = useState(null); 
    const [userData, setUserData] = useState(null); 
    const [activeTab, setActiveTab] = useState('dashboard'); 
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false); 
    
    // Admin States
    const [allPaidStudents, setAllPaidStudents] = useState([]); 
    const [pendingChallans, setPendingChallans] = useState([]); 
    const [adminSearchCnic, setAdminSearchCnic] = useState('');
    const [searchedStudent, setSearchedStudent] = useState(null); // For Search Result

    const [authInput, setAuthInput] = useState({ cnic: '', password: '' });
    const [errorMsg, setErrorMsg] = useState('');

    const [studentForm, setStudentForm] = useState({
        profileImage: '', prefix: 'M', fullName: 'STUDENT', surname: 'NAME', email: '', dob: '',
        cnic: '', cnicExpiry: '', fatherName: 'FATHER', mobileCode: '0092', mobileNo: '',
        placeOfBirth: '', country: 'PAKISTAN', province: 'SINDH', district: 'THARPARKAR',
        city: 'MITHI', homeAddress: '', permanentAddress: '', zipCode: '69230', bloodGroup: 'B+', gender: 'FEMALE'
    });

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedChallanId, setSelectedChallanId] = useState(null);
    const [uploadForm, setUploadForm] = useState({ amount: '', mode: 'BANK DEPOSIT', date: '', file: null });
    const [uploading, setUploading] = useState(false);

    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ id: '', studentCnic: '', part: '', batch: '', amount: '', status: '' });

    // --- Effects ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true);
            try {
                if (currentUser) {
                    setUser(currentUser);
                    const username = currentUser.email.split('@')[0];

                    if (username === 'admin') {
                        setIsAdmin(true);
                        await fetchAllStudentsData(); 
                    } else {
                        setIsAdmin(false);
                        await fetchStudentData(username);
                    }
                } else {
                    setUser(null);
                    setUserData(null);
                    setIsAdmin(false);
                }
            } catch (error) {
                console.error("Fetch Error:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    const getEmail = (cnic) => `${cnic}@studentportal.com`;

    const fetchStudentData = async (cnic) => {
        const docRef = doc(db, "students", cnic);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setUserData(docSnap.data());
            setStudentForm({ ...studentForm, ...docSnap.data().personalInfo });
        } else {
            setStudentForm(prev => ({ ...prev, cnic: cnic }));
        }
    };

    const fetchAllStudentsData = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "students"));
            let paidList = [];
            let pendingList = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.challans && data.challans.length > 0) {
                    data.challans.forEach(challan => {
                        const studentInfo = {
                            studentCnic: data.cnic,
                            name: data.personalInfo?.fullName || 'N/A',
                            fname: data.personalInfo?.fatherName || 'N/A',
                            ...challan,
                            date: new Date(challan.generatedDate).toLocaleDateString()
                        };

                        if (challan.status === 'Verified') {
                            paidList.push(studentInfo);
                        } else if (challan.status === 'Pending Verification') {
                            pendingList.push(studentInfo);
                        }
                    });
                }
            });
            setAllPaidStudents(paidList);
            setPendingChallans(pendingList);
        } catch (error) {
            console.error("Admin Fetch Error:", error);
        }
    };

    // --- NEW: Admin Search Function ---
    const handleAdminSearch = async (e) => {
        e.preventDefault();
        setSearchedStudent(null);
        if(!adminSearchCnic) return;

        try {
            const docRef = doc(db, "students", adminSearchCnic.trim());
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                setSearchedStudent(docSnap.data());
            } else {
                alert("Student not found!");
            }
        } catch (error) {
            console.error("Search Error:", error);
            alert("Error searching student.");
        }
    };

    // --- Generate PDF ---
    const generateAdminPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("University of Sindh - Paid Challan Report", 14, 22);
        const tableColumn = ["CNIC", "Name", "Father Name", "Part", "Batch", "Amount", "Date"];
        const tableRows = allPaidStudents.map(st => [st.studentCnic, st.name, st.fname, st.part, st.batch, st.amount, st.date]);
        autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30 });
        doc.save("Paid_Students_List.pdf");
    };

    const generateSpecificChallanPDF = (studentName, fatherName, part, batch, challanNo, amount) => {
        const doc = new jsPDF('l', 'mm', 'a4'); 
        const pageHeight = doc.internal.pageSize.getHeight();
        const copies = ["BANK COPY", "COLLEGE COPY", "STUDENT COPY"];
        const startXPositions = [10, 108, 206]; 

        copies.forEach((copyTitle, index) => {
            const startX = startXPositions[index];
            const contentWidth = 85;

            // Header
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            const centerX = startX + (contentWidth / 2);
            doc.text("GOVT. ELEMENTARY COLLEGE OF", centerX, 10, { align: "center" });
            doc.text("EDUCATION (M/W) MITHI", centerX, 14, { align: "center" });
            doc.setFontSize(8);
            doc.text("NBP MITHI ACCOUNT NO... 9223-7", centerX, 20, { align: "center" });

            // Copy Title
            doc.setFont("helvetica", "bold");
            doc.setFillColor(0, 0, 0); 
            doc.setTextColor(255, 255, 255); 
            doc.rect(startX, 23, 25, 5, 'F');
            doc.setFontSize(7);
            doc.text(copyTitle, startX + 12.5, 26.5, { align: "center" });
            
            doc.setTextColor(0, 0, 0); 
            doc.setFontSize(8);
            doc.text(`Challan No: ${challanNo}`, startX + contentWidth, 26, { align: "right" });
            doc.text("Date: ______________", startX + contentWidth, 31, { align: "right" });

            // Student Info
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text(`Name: ${studentName}`, startX, 38);
            doc.text(`F/Name: ${fatherName}`, startX, 43);
            doc.setFont("helvetica", "bold");
            doc.text(`Class: ADE/B.Ed(Hons) Part-${part}`, startX, 48);
            doc.text(`Batch: ${batch}`, startX, 53);

            doc.setFontSize(9);
            doc.text("DETAILS OF CHARGES", centerX, 59, { align: "center" });

            // Table
            autoTable(doc, {
                startY: 61,
                margin: { left: startX },
                tableWidth: contentWidth,
                head: [['Sr', 'Nature of Dues', 'Boarder', 'Non-Br']],
                body: [
                    [{ content: 'A) Fee structure per Semester', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [230, 230, 230], fontSize: 7 } }],
                    ['1', 'Tuition Fee', '200', '200'],
                    ['2', 'Admission Fee', '100', '100'],
                    ['3', 'Hostel Room Rent', '200', '---'],
                    [{ content: 'Sub-Total (A)', colSpan: 2, styles: { fontStyle: 'bold' } }, '500', '300'],
                    [{ content: 'B) College-Hostel Dues/Sem', colSpan: 4, styles: { fontStyle: 'bold', fillColor: [230, 230, 230], fontSize: 7 } }],
                    ['1', 'Library/Dev Funds', '200', '200'],
                    ['2', 'Hostel Maintance', '200', '---'],
                    ['3', 'Computer/Internet', '200', '200'],
                    ['4', 'Science/Sports', '200', '200'],
                    ['5', 'Student Welfare', '100', '300'], 
                    ['6', 'Magzine/Security', '300', '300'],
                    ['7', 'Hostel Security', '200', '---'],
                    [{ content: 'Total (A+B)', colSpan: 2, styles: { fontStyle: 'bold' } }, { content: '1900', styles: { fontStyle: 'bold' } }, { content: `${amount}`, styles: { fontStyle: 'bold' } }],
                ],
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 0.8, overflow: 'linebreak', valign: 'middle' },
                headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0], halign: 'center' },
                bodyStyles: { lineWidth: 0.1, lineColor: [0, 0, 0] },
                columnStyles: { 0: { cellWidth: 6 }, 1: { cellWidth: 45 }, 2: { cellWidth: 17, halign:'center' }, 3: { cellWidth: 17, halign:'center' } },
            });

            // Footer
            const finalY = doc.lastAutoTable.finalY + 5;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.text("Rupees in words: _________________________________", startX, finalY);
            doc.text("Cashier", startX, finalY + 18);
            doc.text("Officer", startX + 35, finalY + 18);
            doc.text("Candidate", startX + 65, finalY + 18);

            if (index < 2) {
                const lineX = startX + contentWidth + 6;
                doc.setLineDash([2, 2], 0);
                doc.line(lineX, 5, lineX, pageHeight - 5);
                doc.setLineDash([]); 
                doc.setFontSize(10);
                doc.text("✂", lineX - 1.5, 10);
                doc.text("✂", lineX - 1.5, pageHeight - 10);
            }
        });
        doc.save(`Challan_${studentName}_${part}.pdf`);
    };

    // --- Handlers ---
    const handleAuth = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        const cnic = authInput.cnic.trim();
        let password = authInput.password.trim();
        const email = getEmail(cnic);

        if (cnic !== 'admin') {
            if (cnic !== password) return setErrorMsg("Password must be same as CNIC.");
            if (cnic.length < 6) return setErrorMsg("CNIC must be at least 6 characters.");
        } 
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (loginError) {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                if (cnic !== 'admin') {
                    const initialData = { cnic, personalInfo: { ...studentForm, cnic }, challans: [] };
                    await setDoc(doc(db, "students", cnic), initialData);
                }
            } catch (registerError) {
                if (registerError.code === 'auth/weak-password') setErrorMsg("Error: Password too short.");
                else setErrorMsg("Error: " + registerError.message);
            }
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        setAuthInput({ cnic: '', password: '' });
        setIsAdmin(false);
        setSearchedStudent(null);
    };

    const handleFormChange = (e) => { const { name, value } = e.target; setStudentForm(prev => ({ ...prev, [name]: value })); };
    const handleImageChange = (e) => { const file = e.target.files[0]; if (file) { if (file.size > 500 * 1024) { alert("File too large!"); return; } const reader = new FileReader(); reader.onloadend = () => { setStudentForm(prev => ({ ...prev, profileImage: reader.result })); }; reader.readAsDataURL(file); } };
    const saveProfile = async (e) => { e.preventDefault(); if (!user) return; const cnic = user.email.split('@')[0]; try { const docRef = doc(db, "students", cnic); await setDoc(docRef, { personalInfo: studentForm }, { merge: true }); alert("Profile Saved!"); setUserData(prev => ({ ...prev, personalInfo: studentForm })); } catch (error) { alert("Failed: " + error.message); } };
    
    const generateChallan = async (part, batch) => {
        if (!user) return;
        const cnic = user.email.split('@')[0];
        const existingChallan = userData?.challans?.find(c => c.part === part);
        if (existingChallan) { alert(`Challan for Part-${part} already exists.`); return; }
        let fee = 1300; const challanNo = `CH-${Math.floor(Math.random() * 100000)}`;
        const newChallan = { id: Date.now(), challanNo, part, batch, amount: fee, status: 'Not Paid', generatedDate: Date.now(), hasDownloaded: false, paymentDetails: null, receiptImageUrl: null };
        try { const docRef = doc(db, "students", cnic); await updateDoc(docRef, { challans: arrayUnion(newChallan) }); setUserData(prev => ({ ...prev, challans: [newChallan, ...(prev.challans || [])] })); alert('Challan Generated! Go to Dashboard to download.'); setActiveTab('dashboard'); } catch (error) { console.error(error); }
    };

    const handleDownloadPdf = async (challan) => {
        generateSpecificChallanPDF(studentForm.fullName, studentForm.fatherName, challan.part, challan.batch, challan.challanNo, challan.amount);
        if (!challan.hasDownloaded) {
            const cnic = user.email.split('@')[0]; const updatedChallans = userData.challans.map(ch => { if (ch.id === challan.id) return { ...ch, hasDownloaded: true }; return ch; });
            try { await updateDoc(doc(db, "students", cnic), { challans: updatedChallans }); setUserData(prev => ({ ...prev, challans: updatedChallans })); } catch (error) { console.error(error); }
        }
    };

    const openUploadModal = (id) => { setSelectedChallanId(id); const challan = userData.challans.find(c => c.id === id); setUploadForm({ amount: challan.amount, mode: 'BANK DEPOSIT', date: '', file: null }); setShowUploadModal(true); };
    const handleUploadFileChange = (e) => { if (e.target.files[0]) { const file = e.target.files[0]; if (!file.type.startsWith('image/')) { alert("Only JPG/PNG allowed."); return; } if (file.size > 800 * 1024) { alert("File Max 800KB."); return; } setUploadForm({ ...uploadForm, file: file }); } };
    
    const handleUploadSubmit = async (e) => {
        e.preventDefault(); if (!uploadForm.file || !uploadForm.date || !uploadForm.amount) { alert("Please fill all fields."); return; }
        setUploading(true); const cnic = user.email.split('@')[0];
        try { const reader = new FileReader(); reader.readAsDataURL(uploadForm.file); reader.onloadend = async () => { const base64File = reader.result; const updatedChallans = userData.challans.map(ch => { if (ch.id === selectedChallanId) { return { ...ch, status: 'Pending Verification', uploadTime: Date.now(), paymentDetails: { amount: uploadForm.amount, mode: uploadForm.mode, date: uploadForm.date }, receiptImageUrl: base64File }; } return ch; }); await updateDoc(doc(db, "students", cnic), { challans: updatedChallans }); setUserData(prev => ({ ...prev, challans: updatedChallans })); setShowUploadModal(false); alert("Receipt Uploaded!"); setUploading(false); }; } catch (error) { alert("Failed to upload."); setUploading(false); }
    };

    const handleViewReceipt = (url) => { setReceiptUrl(url); setShowReceiptModal(true); };
    const handleAdminAction = async (studentCnic, challanId, newStatus) => { try { const studentRef = doc(db, "students", studentCnic); const studentSnap = await getDoc(studentRef); const studentData = studentSnap.data(); const updatedChallans = studentData.challans.map(ch => { if (ch.id === challanId) return { ...ch, status: newStatus }; return ch; }); await updateDoc(studentRef, { challans: updatedChallans }); await fetchAllStudentsData(); if(searchedStudent && searchedStudent.cnic === studentCnic) { setSearchedStudent({...searchedStudent, challans: updatedChallans}); } alert(`Challan ${newStatus}`); } catch (error) { alert("Failed."); } };
    
    // --- ADMIN DELETE ---
    const handleDeleteChallan = async (studentCnic, challanId) => { 
        if (!confirm("Confirm Delete?")) return; 
        try { 
            const studentRef = doc(db, "students", studentCnic); 
            const studentSnap = await getDoc(studentRef); 
            const updatedChallans = studentSnap.data().challans.filter(ch => ch.id !== challanId); 
            await updateDoc(studentRef, { challans: updatedChallans }); 
            await fetchAllStudentsData(); 
            // Update search view if active
            if(searchedStudent && searchedStudent.cnic === studentCnic) {
                setSearchedStudent({...searchedStudent, challans: updatedChallans});
            }
            alert("Deleted."); 
        } catch (error) { alert("Failed."); } 
    };
    
    // --- ADMIN EDIT ---
    const openEditModal = (challan, studentCnic) => { setEditForm({ id: challan.id, studentCnic: studentCnic, part: challan.part, batch: challan.batch, amount: challan.amount, status: challan.status }); setShowEditModal(true); };
    
    const handleEditSubmit = async (e) => { 
        e.preventDefault(); 
        try { 
            const studentRef = doc(db, "students", editForm.studentCnic); 
            const studentSnap = await getDoc(studentRef); 
            const updatedChallans = studentSnap.data().challans.map(ch => { 
                if (ch.id === editForm.id) { 
                    return { ...ch, part: editForm.part, batch: editForm.batch, amount: editForm.amount, status: editForm.status }; 
                } 
                return ch; 
            }); 
            await updateDoc(studentRef, { challans: updatedChallans }); 
            await fetchAllStudentsData(); 
            // Update search view if active
            if(searchedStudent && searchedStudent.cnic === editForm.studentCnic) {
                setSearchedStudent({...searchedStudent, challans: updatedChallans});
            }
            setShowEditModal(false); 
            alert("Updated."); 
        } catch (error) { alert("Failed."); } 
    };

    if (loading) return <div className="flex h-screen items-center justify-center text-blue-600 font-bold">Loading Portal...</div>;

    // --- LOGIN UI ---
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="bg-white rounded shadow-lg max-w-md w-full overflow-hidden font-sans border-t-4 border-blue-600">
                    <div className="bg-[#4a69bd] p-6 text-center"><h1 className="text-3xl text-white font-bold tracking-wide">LOGIN</h1></div>
                    <div className="p-8"><form onSubmit={handleAuth} className="space-y-6"><div><label className="block text-gray-600 text-sm font-semibold mb-2">CNIC (No dashes)</label><input type="text" className="w-full p-3 border rounded" placeholder="XXXXXXXXXXXXX" value={authInput.cnic} onChange={(e) => setAuthInput({...authInput, cnic: e.target.value})} required /></div><div><label className="block text-gray-600 text-sm font-semibold mb-2">Password</label><input type="password" className="w-full p-3 border rounded" placeholder="Same as CNIC" value={authInput.password} onChange={(e) => setAuthInput({...authInput, password: e.target.value})} required /></div>{errorMsg && <p className="text-red-500 text-sm font-bold bg-red-50 p-2 rounded">{errorMsg}</p>}<button type="submit" className="w-full bg-[#4a69bd] hover:bg-[#3c55a0] text-white font-bold py-3 rounded shadow">LOGIN</button></form></div>
                </div>
            </div>
        );
    }

    // --- ADMIN VIEW ---
    if (isAdmin) {
        return (
            <div className="min-h-screen bg-gray-100 font-sans">
                <header className="h-16 bg-[#2c3e50] text-white flex items-center justify-between px-6 shadow-md"><h2 className="text-xl font-bold">Admin / Accountant Panel</h2><button onClick={handleLogout} className="flex items-center bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm font-bold"><Icons.Logout /> Logout</button></header>
                <main className="p-6 max-w-7xl mx-auto space-y-10">
                    
                    {/* --- 1. SEARCH STUDENT (MANAGE MISTAKES) --- */}
                    <div className="bg-white rounded-lg shadow border p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center"><Icons.Search /> Manage Student Records (Fix Mistakes)</h3>
                        <form onSubmit={handleAdminSearch} className="flex gap-4 mb-6">
                            <input type="text" className="flex-1 p-3 border rounded" placeholder="Enter Student CNIC to Search..." value={adminSearchCnic} onChange={(e) => setAdminSearchCnic(e.target.value)} />
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded font-bold">Search</button>
                        </form>

                        {searchedStudent && (
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-lg font-bold text-blue-800">{searchedStudent.personalInfo?.fullName}</h4>
                                        <p className="text-sm text-gray-600">Father: {searchedStudent.personalInfo?.fatherName} | CNIC: {searchedStudent.cnic}</p>
                                    </div>
                                    <button onClick={() => setSearchedStudent(null)} className="text-gray-500 hover:text-red-500"><Icons.Close /></button>
                                </div>
                                
                                <h5 className="font-bold text-gray-700 mb-2">Challan History (Edit/Delete Enabled)</h5>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Challan No</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Part</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {(!searchedStudent.challans || searchedStudent.challans.length === 0) ? (
                                                <tr><td colSpan="5" className="px-4 py-2 text-center text-gray-500">No challans found.</td></tr>
                                            ) : (
                                                searchedStudent.challans.map((ch) => (
                                                    <tr key={ch.id}>
                                                        <td className="px-4 py-2 text-sm font-mono">{ch.challanNo}</td>
                                                        <td className="px-4 py-2 text-sm">{ch.part}</td>
                                                        <td className="px-4 py-2 text-sm">{ch.batch}</td>
                                                        <td className="px-4 py-2 text-sm font-bold">{ch.status}</td>
                                                        <td className="px-4 py-2 text-sm flex gap-3">
                                                            <button onClick={() => openEditModal(ch, searchedStudent.cnic)} className="text-blue-600 hover:text-blue-800 flex items-center font-bold text-xs bg-blue-50 px-2 py-1 rounded"><Icons.Edit /> Edit</button>
                                                            <button onClick={() => handleDeleteChallan(searchedStudent.cnic, ch.id)} className="text-red-600 hover:text-red-800 flex items-center font-bold text-xs bg-red-50 px-2 py-1 rounded"><Icons.Delete /> Delete</button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* --- 2. Pending Verifications --- */}
                    <div><h3 className="text-2xl font-bold text-gray-800 mb-4">Pending Verifications</h3>
                        <div className="bg-white rounded-lg shadow border overflow-hidden"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-red-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNIC</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Challan No</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{pendingChallans.length === 0 ? (<tr><td colSpan="6" className="px-6 py-4 text-center text-gray-500">No pending verifications.</td></tr>) : (pendingChallans.map((st, index) => (<tr key={index}><td className="px-6 py-4 text-sm text-gray-900">{st.studentCnic}</td><td className="px-6 py-4 text-sm font-bold text-blue-900">{st.name}</td><td className="px-6 py-4 text-sm font-mono">{st.challanNo}</td><td className="px-6 py-4 text-sm font-bold">{st.paymentDetails?.amount}</td><td className="px-6 py-4 text-sm"><button onClick={() => handleViewReceipt(st.receiptImageUrl)} className="text-blue-600 hover:underline flex items-center"><Icons.View /> Check</button></td><td className="px-6 py-4 text-sm flex gap-2"><button onClick={() => handleAdminAction(st.studentCnic, st.id, 'Verified')} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs">Verify</button><button onClick={() => handleAdminAction(st.studentCnic, st.id, 'Not Verified')} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs">Reject</button></td></tr>)))}</tbody></table></div>
                    </div>

                    {/* --- 3. All Paid List --- */}
                    <div>
                        <div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-bold text-gray-800">All Paid Students</h3><button onClick={generateAdminPDF} className="flex items-center bg-[#337ab7] hover:bg-blue-700 text-white px-4 py-2 rounded font-bold shadow"><Icons.Download /> PDF Report</button></div>
                        <div className="bg-white rounded-lg shadow border overflow-hidden"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNIC</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Part/Batch</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{allPaidStudents.length === 0 ? (<tr><td colSpan="5" className="px-6 py-4 text-center text-gray-500">No records found.</td></tr>) : (allPaidStudents.map((st, index) => (<tr key={index}><td className="px-6 py-4 text-sm text-gray-900">{st.studentCnic}</td><td className="px-6 py-4 text-sm font-bold text-blue-900">{st.name}</td><td className="px-6 py-4 text-sm text-gray-500">{st.part} / {st.batch}</td><td className="px-6 py-4 text-sm font-bold text-green-600">{st.amount}</td><td className="px-6 py-4 text-sm"><button onClick={() => handleViewReceipt(st.receiptImageUrl)} className="text-blue-600 hover:underline flex items-center"><Icons.View /> View</button></td></tr>)))}</tbody></table></div>
                    </div>
                </main>
                
                {/* --- Admin Edit Modal --- */}
                {showEditModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <h3 className="text-xl font-bold mb-4">Edit Student Challan</h3>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                <div><label className="block text-sm font-bold">Part</label><select value={editForm.part} onChange={(e) => setEditForm({...editForm, part: e.target.value})} className="w-full border p-2 rounded"><option value="I">Part I</option><option value="II">Part II</option><option value="III">Part III</option><option value="IV">Part IV</option></select></div>
                                <div><label className="block text-sm font-bold">Batch</label><select value={editForm.batch} onChange={(e) => setEditForm({...editForm, batch: e.target.value})} className="w-full border p-2 rounded"><option value="2k22">2k22</option><option value="2k23">2k23</option><option value="2k24">2k24</option><option value="2k25">2k25</option><option value="2k26">2k26</option></select></div>
                                <div><label className="block text-sm font-bold">Amount</label><input type="text" value={editForm.amount} onChange={(e) => setEditForm({...editForm, amount: e.target.value})} className="w-full border p-2 rounded" /></div>
                                <div><label className="block text-sm font-bold">Status</label><select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})} className="w-full border p-2 rounded"><option value="Verified">Verified</option><option value="Not Verified">Not Verified</option><option value="Pending Verification">Pending Verification</option><option value="Not Paid">Not Paid</option></select></div>
                                <div className="flex justify-end gap-2 mt-4"><button type="button" onClick={() => setShowEditModal(false)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Changes</button></div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Receipt Modal */}
                {showReceiptModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-xl max-w-4xl w-full h-[90vh] relative flex flex-col"><button onClick={() => setShowReceiptModal(false)} className="absolute top-2 right-2 text-gray-600 hover:text-red-600 z-50 p-2 bg-white rounded-full shadow"><Icons.Close /></button><div className="p-4 flex-1 bg-gray-100 rounded-b-lg overflow-hidden flex justify-center items-center"><img src={receiptUrl} alt="Receipt" className="max-h-full max-w-full object-contain" /></div></div></div>)}
            </div>
        );
    }

    // --- STUDENT DASHBOARD (Same as before) ---
    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <aside className="w-64 bg-[#2c3e50] text-white flex flex-col shadow-2xl z-20 hidden md:flex">
                <div className="h-16 flex items-center justify-center bg-[#243342] border-b border-gray-600"><span className="text-lg font-bold tracking-wider">ITSC UoS</span></div>
                <nav className="flex-1 px-2 py-6 space-y-2">
                    <button onClick={() => setActiveTab('dashboard')} className={`flex items-center w-full px-4 py-3 rounded transition-colors ${activeTab === 'dashboard' ? 'bg-[#34495e] border-l-4 border-blue-400' : 'hover:bg-[#34495e]'}`}><Icons.Dashboard /> Dashboard</button>
                    <button onClick={() => setActiveTab('profile')} className={`flex items-center w-full px-4 py-3 rounded transition-colors ${activeTab === 'profile' ? 'bg-[#34495e] border-l-4 border-blue-400' : 'hover:bg-[#34495e]'}`}><Icons.Profile /> Student Profile</button>
                    <button onClick={() => setActiveTab('generator')} className={`flex items-center w-full px-4 py-3 rounded transition-colors ${activeTab === 'generator' ? 'bg-[#34495e] border-l-4 border-blue-400' : 'hover:bg-[#34495e]'}`}><Icons.Exam /> Generate Challan</button>
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-3 rounded hover:bg-red-900 transition-colors mt-10 text-red-200"><Icons.Logout /> Logout</button>
                </nav>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-16 bg-[#337ab7] text-white flex items-center justify-between px-6 shadow-md z-10">
                    <div className="flex items-center"><h2 className="text-xl font-semibold">Student Portal</h2></div>
                    <div className="flex items-center gap-3"><span className="text-sm opacity-90">{studentForm.fullName}</span><div className="w-8 h-8 rounded-full bg-white text-[#337ab7] flex items-center justify-center font-bold overflow-hidden border-2 border-white">{studentForm.profileImage ? (<img src={studentForm.profileImage} alt="Profile" className="w-full h-full object-cover" />) : (studentForm.fullName ? studentForm.fullName.charAt(0) : 'U')}</div></div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    {/* DASHBOARD VIEW */}
                    {activeTab === 'dashboard' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-4 xl:col-span-3">
                                <div className="bg-white rounded-lg shadow border border-gray-200 p-6 flex flex-col items-center text-center">
                                    <div className="w-32 h-32 rounded bg-gray-200 mb-4 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm relative">
                                        {studentForm.profileImage ? (<img src={studentForm.profileImage} alt="Profile" className="w-full h-full object-cover" />) : (<svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"></path></svg>)}
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-800">{studentForm.fullName}</h3><h4 className="text-sm font-semibold text-gray-500 mb-2">{studentForm.surname}</h4><p className="text-xs text-gray-400 mb-6">{user.email.split('@')[0]}</p>
                                    <button onClick={() => setActiveTab('profile')} className="mt-6 w-full py-2 bg-[#337ab7] text-white rounded text-sm font-bold hover:bg-blue-700 transition">Edit Profile</button>
                                </div>
                            </div>
                            <div className="lg:col-span-8 xl:col-span-9">
                                <div className="bg-white rounded-lg shadow border border-gray-200">
                                    <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-bold text-gray-800">Forms & Fees History</h3></div>
                                    <div className="overflow-x-auto p-4">
                                        {(!userData?.challans || userData.challans.length === 0) ? (<p className="text-gray-500 text-center py-4">No records found.</p>) : (
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Form</th><th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Amount</th><th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Status</th><th className="px-4 py-3 text-left font-bold text-gray-600 uppercase">Action</th></tr></thead>
                                            <tbody className="bg-white divide-y divide-gray-200">{userData.challans.map((c) => (
                                                <tr key={c.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3"><div className="font-bold text-gray-700">Exam Fee / Part {c.part}</div><div className="text-xs text-gray-400">Challan No: {c.challanNo}</div></td>
                                                    <td className="px-4 py-3 font-mono font-semibold">{c.amount}</td>
                                                    <td className="px-4 py-3"><span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${c.status === 'Verified' ? 'bg-green-100 text-green-800' : c.status === 'Pending Verification' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}`}>{c.status.toUpperCase()}</span></td>
                                                    <td className="px-4 py-3 flex gap-2">
                                                        <button onClick={() => handleDownloadPdf(c)} className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs flex items-center"><Icons.Download /> Download</button>
                                                        {c.status === 'Verified' ? (
                                                            <button onClick={() => handleViewReceipt(c.receiptImageUrl)} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs flex items-center"><Icons.View /> View Receipt</button>
                                                        ) : (
                                                            c.hasDownloaded && (
                                                                <button onClick={() => openUploadModal(c.id)} className="bg-orange-400 hover:bg-orange-500 text-white px-3 py-1 rounded text-xs flex items-center"><Icons.Upload /> Upload</button>
                                                            )
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}</tbody>
                                        </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PROFILE VIEW */}
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-lg shadow border border-gray-200">
                            <div className="bg-[#244b7e] px-6 py-4 rounded-t-lg flex items-center"><svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg><h3 className="text-lg font-bold text-white">Personal Information</h3></div>
                            <form onSubmit={saveProfile} className="p-6 text-sm">
                                <div className="mb-8 flex flex-col items-center justify-center p-6 bg-gray-50 border border-dashed border-gray-300 rounded-lg"><div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden border-2 border-blue-500 relative">{studentForm.profileImage ? (<img src={studentForm.profileImage} alt="Profile" className="w-full h-full object-cover" />) : (<span className="flex items-center justify-center h-full text-gray-400 font-bold">No Img</span>)}</div><label className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"><span>Change Profile Picture</span><input type="file" className="hidden" accept="image/*" onChange={handleImageChange} /></label></div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4"><div className="md:col-span-1"><label className="block font-bold text-gray-700 mb-1">Prefix <span className="text-red-500">*</span></label><select name="prefix" value={studentForm.prefix} onChange={handleFormChange} className="w-full border p-2 rounded bg-white"><option value="M">M</option><option value="F">F</option></select></div><div className="md:col-span-3"><label className="block font-bold text-gray-700 mb-1">Full Name <span className="text-red-500 text-xs">(As per Matric) *</span></label><input type="text" name="fullName" value={studentForm.fullName} onChange={handleFormChange} className="w-full border p-2 rounded bg-gray-100 uppercase" /></div><div className="md:col-span-3"><label className="block font-bold text-gray-700 mb-1">Surname <span className="text-red-500 text-xs">(As per Matric) *</span></label><input type="text" name="surname" value={studentForm.surname} onChange={handleFormChange} className="w-full border p-2 rounded bg-gray-100 uppercase" /></div><div className="md:col-span-3"><label className="block font-bold text-gray-700 mb-1">Email <span className="text-red-500">*</span></label><input type="email" name="email" value={studentForm.email} onChange={handleFormChange} className="w-full border p-2 rounded" /></div><div className="md:col-span-2"><label className="block font-bold text-gray-700 mb-1">Date Of Birth <span className="text-red-500">*</span></label><input type="date" name="dob" value={studentForm.dob} onChange={handleFormChange} className="w-full border p-2 rounded bg-gray-100" /></div></div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4"><div className="md:col-span-2"><label className="block font-bold text-gray-700 mb-1">CNIC / Form-B <span className="text-red-500">*</span></label><input type="text" value={studentForm.cnic} readOnly className="w-full border p-2 rounded bg-gray-200 cursor-not-allowed" /></div><div className="md:col-span-2"><label className="block font-bold text-gray-700 mb-1">CNIC Expiry</label><input type="date" name="cnicExpiry" value={studentForm.cnicExpiry} onChange={handleFormChange} className="w-full border p-2 rounded" /></div><div className="md:col-span-2"><label className="block font-bold text-gray-700 mb-1">Father's Name</label><input type="text" name="fatherName" value={studentForm.fatherName} onChange={handleFormChange} className="w-full border p-2 rounded bg-gray-100 uppercase" /></div><div className="md:col-span-2"><label className="block font-bold text-gray-700 mb-1">Mobile Code <span className="text-red-500">*</span></label><select name="mobileCode" value={studentForm.mobileCode} onChange={handleFormChange} className="w-full border p-2 rounded bg-white"><option value="0092">PAKISTAN 0092</option></select></div><div className="md:col-span-2"><label className="block font-bold text-gray-700 mb-1">Mobile No <span className="text-red-500">*</span></label><input type="text" name="mobileNo" value={studentForm.mobileNo} onChange={handleFormChange} className="w-full border p-2 rounded" /></div><div className="md:col-span-2"><label className="block font-bold text-gray-700 mb-1">Place of Birth</label><input type="text" name="placeOfBirth" value={studentForm.placeOfBirth} onChange={handleFormChange} className="w-full border p-2 rounded" /></div></div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4"><div className="md:col-span-3"><label className="block font-bold text-gray-700 mb-1">Country</label><select name="country" value={studentForm.country} onChange={handleFormChange} className="w-full border p-2 rounded bg-gray-100"><option value="PAKISTAN">PAKISTAN</option></select></div><div className="md:col-span-3"><label className="block font-bold text-gray-700 mb-1">Province / State</label><select name="province" value={studentForm.province} onChange={handleFormChange} className="w-full border p-2 rounded bg-white"><option value="SINDH">SINDH</option></select></div><div className="md:col-span-3"><label className="block font-bold text-gray-700 mb-1">District</label><select name="district" value={studentForm.district} onChange={handleFormChange} className="w-full border p-2 rounded bg-white"><option value="THARPARKAR">THARPARKAR</option><option value="UMERKOT">UMERKOT</option></select></div><div className="md:col-span-3"><label className="block font-bold text-gray-700 mb-1">City</label><select name="city" value={studentForm.city} onChange={handleFormChange} className="w-full border p-2 rounded bg-white"><option value="MITHI">MITHI</option><option value="ISLAMKOT">ISLAMKOT</option></select></div></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div><label className="block font-bold text-gray-700 mb-1">Home Address <span className="text-gray-500 text-xs">Postal Address *</span></label><textarea name="homeAddress" rows="3" value={studentForm.homeAddress} onChange={handleFormChange} className="w-full border p-2 rounded uppercase"></textarea></div><div><label className="block font-bold text-gray-700 mb-1">Permanent Address</label><textarea name="permanentAddress" rows="3" value={studentForm.permanentAddress} onChange={handleFormChange} className="w-full border p-2 rounded uppercase"></textarea></div></div>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4"><div className="md:col-span-3"><label className="block font-bold text-gray-700 mb-1">Zip / Postal Code</label><input type="text" name="zipCode" value={studentForm.zipCode} onChange={handleFormChange} className="w-full border p-2 rounded" /></div><div className="md:col-span-3"><label className="block font-bold text-gray-700 mb-1">Blood Group</label><select name="bloodGroup" value={studentForm.bloodGroup} onChange={handleFormChange} className="w-full border p-2 rounded bg-white"><option value="B+">B+</option><option value="A+">A+</option><option value="O+">O+</option></select></div><div className="md:col-span-3"><label className="block font-bold text-gray-700 mb-1">Gender <span className="text-red-500">*</span></label><select name="gender" value={studentForm.gender} onChange={handleFormChange} className="w-full border p-2 rounded bg-white"><option value="FEMALE">FEMALE</option><option value="MALE">MALE</option></select></div></div>
                                <button type="submit" className="bg-[#337ab7] text-white px-6 py-2 rounded font-bold hover:bg-blue-800 shadow-sm mt-4">Save</button>
                            </form>
                        </div>
                    )}

                    {activeTab === 'generator' && (
                        <div className="bg-white rounded-lg shadow border border-gray-200 max-w-2xl mx-auto mt-10">
                            <div className="bg-[#337ab7] px-6 py-4 rounded-t-lg"><h3 className="text-lg font-bold text-white">Generate Fee Challan</h3></div>
                            <div className="p-8">
                                <form onSubmit={(e) => { e.preventDefault(); generateChallan(e.target.part.value, e.target.batch.value); }} className="space-y-6">
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-2">Select Part</label>
                                        <select name="part" className="w-full p-3 border rounded"><option value="I">Part I</option><option value="II">Part II</option><option value="III">Part III</option><option value="IV">Part IV</option></select>
                                    </div>
                                    <div>
                                        <label className="block font-bold text-gray-700 mb-2">Select Batch</label>
                                        <select name="batch" className="w-full p-3 border rounded"><option value="2k22">2k22</option><option value="2k23">2k23</option><option value="2k24">2k24</option><option value="2k25">2k25</option><option value="2k26">2k26</option></select>
                                    </div>
                                    <button type="submit" className="w-full bg-green-600 text-white py-3 rounded font-bold hover:bg-green-700">Generate Challan</button>
                                </form>
                            </div>
                        </div>
                    )}
                </main>
                
                {showUploadModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-xl max-w-3xl w-full relative font-sans"><button onClick={() => setShowUploadModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"><Icons.Close /></button><div className="p-8"><h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-3">Upload Paid Challan Receipt</h3><form onSubmit={handleUploadSubmit} className="space-y-6"><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block font-bold text-gray-700 mb-2">Challan No. <span className="text-red-500">*</span></label><input type="text" value={userData.challans.find(c => c.id === selectedChallanId)?.challanNo} readOnly className="w-full p-3 border rounded bg-gray-100 cursor-not-allowed" /></div><div><label className="block font-bold text-gray-700 mb-2">Challan Amount <span className="text-red-500">*</span></label><input type="text" value={uploadForm.amount} onChange={(e) => setUploadForm({ ...uploadForm, amount: e.target.value })} className="w-full p-3 border rounded" required /></div><div><label className="block font-bold text-gray-700 mb-2">Mode Of Payment <span className="text-red-500">*</span></label><select value={uploadForm.mode} onChange={(e) => setUploadForm({ ...uploadForm, mode: e.target.value })} className="w-full p-3 border rounded"><option value="BANK DEPOSIT">BANK DEPOSIT</option><option value="ONLINE PAYMENT">ONLINE PAYMENT</option></select></div><div><label className="block font-bold text-gray-700 mb-2">Date of Payment <span className="text-red-500">*</span></label><input type="date" value={uploadForm.date} onChange={(e) => setUploadForm({ ...uploadForm, date: e.target.value })} className="w-full p-3 border rounded" required /></div></div><div><label className="block font-bold text-gray-700 mb-2">Upload Photo of Paid Challan (with Stamp) <span className="text-red-500">*</span> <span className="text-xs font-normal text-red-400 ml-2">(JPG/PNG only, Max 800KB)</span></label><input type="file" accept="image/jpeg, image/png" onChange={handleUploadFileChange} className="w-full p-2 border rounded bg-gray-50" required /></div><button type="submit" disabled={uploading} className="bg-[#337ab7] hover:bg-blue-800 text-white px-6 py-3 rounded font-bold shadow-sm disabled:bg-gray-400">{uploading ? 'Uploading...' : 'UPLOAD RECEIPT'}</button></form></div></div></div>)}
                {showReceiptModal && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-xl max-w-4xl w-full relative"><button onClick={() => setShowReceiptModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"><Icons.Close /></button><div className="p-6"><h3 className="text-xl font-bold text-gray-800 mb-4">Payment Receipt</h3><div className="border rounded-lg overflow-hidden flex justify-center bg-gray-100"><img src={receiptUrl} alt="Receipt" className="max-h-[70vh] object-contain" /></div></div></div></div>)}
                <footer className="bg-[#337ab7] text-white text-center py-3 text-xs">Developer Team @2019, IT Services Center, University Of Sindh, Jamshoro</footer>
            </div>
        </div>
    );
};

export default App;