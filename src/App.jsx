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

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// --- Icons ---
const Icons = {
    Dashboard: () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>,
    Profile: () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>,
    Exam: () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>,
    Logout: () => <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>,
    Download: () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>,
    Upload: () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>,
    View: () => <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>,
    Close: () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12"></path></svg>,
    Edit: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>,
    Delete: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
    Search: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>,
    University: ({className}) => <svg className={className || "w-8 h-8 text-white"} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>,
    Spinner: ({size="w-5 h-5", color="text-white"}) => <svg className={`animate-spin ${size} ${color}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
};

const App = () => {
    const [user, setUser] = useState(null); 
    const [userData, setUserData] = useState(null); 
    const [activeTab, setActiveTab] = useState('dashboard'); 
    const [loading, setLoading] = useState(true); 
    const [isAdmin, setIsAdmin] = useState(false); 
    const [allPaidStudents, setAllPaidStudents] = useState([]); 
    const [pendingChallans, setPendingChallans] = useState([]); 
    const [adminSearchCnic, setAdminSearchCnic] = useState('');
    const [searchedStudent, setSearchedStudent] = useState(null); 
    const [authInput, setAuthInput] = useState({ cnic: '', password: '' });
    const [errorMsg, setErrorMsg] = useState('');
    const [isAuthLoading, setIsAuthLoading] = useState(false);
    const [studentForm, setStudentForm] = useState({ profileImage: '', prefix: 'M', fullName: '', surname: '', email: '', dob: '', cnic: '', cnicExpiry: '', fatherName: '', mobileCode: '0092', mobileNo: '', placeOfBirth: '', country: 'PAKISTAN', province: 'SINDH', district: 'THARPARKAR', city: 'MITHI', homeAddress: '', permanentAddress: '', zipCode: '69230', bloodGroup: 'B+', gender: 'FEMALE' });
    const [isEditing, setIsEditing] = useState(false); 
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedChallanId, setSelectedChallanId] = useState(null);
    const [uploadForm, setUploadForm] = useState({ amount: '', mode: 'BANK DEPOSIT', date: '', file: null });
    const [uploading, setUploading] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [receiptUrl, setReceiptUrl] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState({ id: '', studentCnic: '', part: '', batch: '', amount: '', status: '' });

    const isGlobalLoading = loading || isAuthLoading || uploading;

    useEffect(() => { if (isGlobalLoading) { document.title = "Processing... | GECE Mithi"; } else { document.title = user ? "Student Portal | GECE Mithi" : "Login | GECE Mithi"; } }, [isGlobalLoading, user]);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setLoading(true); 
            try {
                if (currentUser) {
                    setUser(currentUser);
                    const username = currentUser.email.split('@')[0];
                    if (username === 'admin') { setIsAdmin(true); await fetchAllStudentsData(); } 
                    else { setIsAdmin(false); await fetchStudentData(username); }
                } else { setUser(null); setUserData(null); setIsAdmin(false); }
            } catch (error) { console.error("Fetch Error:", error); setUser(null); } 
            finally { setLoading(false); } 
        });
        return () => unsubscribe();
    }, []);

    const getEmail = (cnic) => `${cnic}@studentportal.com`;

    const fetchStudentData = async (cnic) => { const docRef = doc(db, "students", cnic); const docSnap = await getDoc(docRef); if (docSnap.exists()) { setUserData(docSnap.data()); setStudentForm({ ...studentForm, ...docSnap.data().personalInfo }); } else { setStudentForm(prev => ({ ...prev, cnic: cnic })); } };

    const fetchAllStudentsData = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "students"));
            let paidList = []; let pendingList = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const studentCnic = doc.id; // FIX: Ensure CNIC is captured from Doc ID
                if (data.challans && data.challans.length > 0) {
                    data.challans.forEach(challan => {
                        const studentInfo = { studentCnic: studentCnic, name: data.personalInfo?.fullName || 'N/A', fname: data.personalInfo?.fatherName || 'N/A', ...challan, date: new Date(challan.generatedDate).toLocaleDateString() };
                        if (challan.status === 'Verified') paidList.push(studentInfo);
                        else if (challan.status === 'Pending Verification') pendingList.push(studentInfo);
                    });
                }
            });
            setAllPaidStudents(paidList); setPendingChallans(pendingList);
        } catch (error) { console.error("Admin Fetch Error:", error); }
    };

    // --- FIXED: SEARCH LOGIC (Ensures CNIC is attached) ---
    const handleAdminSearch = async (e) => {
        e.preventDefault(); setSearchedStudent(null); if(!adminSearchCnic) return;
        setLoading(true); 
        try { 
            const docRef = doc(db, "students", adminSearchCnic.trim()); 
            const docSnap = await getDoc(docRef); 
            if (docSnap.exists()) { 
                // IMPORTANT FIX: Manually adding CNIC to the object so Delete/Edit works
                setSearchedStudent({ ...docSnap.data(), cnic: docSnap.id }); 
            } else { 
                alert("Student not found!"); 
            } 
        } catch (error) { console.error("Search Error:", error); alert("Error searching student."); }
        finally { setLoading(false); }
    };

    const generateAdminPDF = () => { const doc = new jsPDF(); doc.setFontSize(18); doc.text("University of Sindh - Paid Challan Report", 14, 22); const tableColumn = ["CNIC", "Name", "Father Name", "Part", "Batch", "Amount", "Date"]; const tableRows = allPaidStudents.map(st => [st.studentCnic, st.name, st.fname, st.part, st.batch, st.amount, st.date]); autoTable(doc, { head: [tableColumn], body: tableRows, startY: 30 }); doc.save("Paid_Students_List.pdf"); };

    const generateSpecificChallanPDF = (studentName, fatherName, part, batch, challanNo, amount, status) => {
        const doc = new jsPDF('l', 'mm', 'a4'); 
        const copies = ["BANK COPY", "COLLEGE COPY", "STUDENT COPY"]; const startXPositions = [10, 108, 206]; 
        const isHosteller = status === 'Hosteller';
        const tuition = '200'; const admission = '100'; const roomRent = isHosteller ? '200' : '---'; const subTotalA = isHosteller ? '500' : '300';
        const funds1 = isHosteller ? '400' : '300'; const funds2 = isHosteller ? '400' : '300'; const subTotalB = isHosteller ? '800' : '600';
        copies.forEach((copyTitle, index) => {
            const startX = startXPositions[index]; const contentWidth = 85; const centerX = startX + (contentWidth / 2);
            doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.text("GOVT. ELEMENTARY COLLEGE OF", centerX, 10, { align: "center" }); doc.text("EDUCATION (M/W) MITHI", centerX, 14, { align: "center" }); doc.setFontSize(8); doc.text("NBP MITHI ACCOUNT NO... 9223-7", centerX, 20, { align: "center" }); doc.setFillColor(0, 0, 0); doc.setTextColor(255, 255, 255); doc.rect(startX, 23, 25, 5, 'F'); doc.setFontSize(7); doc.text(copyTitle, startX + 12.5, 26.5, { align: "center" }); doc.setTextColor(0, 0, 0); doc.setFontSize(8); doc.text(`Challan No: ${challanNo}`, startX + contentWidth, 26, { align: "right" }); doc.text("Date: ______________", startX + contentWidth, 31, { align: "right" }); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.text(`Name: ${studentName}`, startX, 38); doc.text(`F/Name: ${fatherName}`, startX, 43); doc.setFont("helvetica", "bold"); doc.text(`Class: ADE/B.Ed(Hons) Part-${part}`, startX, 48); doc.text(`Batch: ${batch}`, startX, 53); doc.text(`Status: ${status}`, startX + 45, 53); doc.setFontSize(9); doc.text("DETAILS OF CHARGES", centerX, 59, { align: "center" });
            autoTable(doc, { startY: 61, margin: { left: startX }, tableWidth: contentWidth, head: [['Sr', 'Nature of Dues', 'Amount']], body: [ [{ content: 'A) Fee structure per Semester', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [230, 230, 230], fontSize: 7 } }], ['1', 'Tuition Fee', tuition], ['2', 'Admission Fee', admission], ['3', 'Hostel Room Rent', roomRent], [{ content: 'Sub-Total (A)', colSpan: 2, styles: { fontStyle: 'bold' } }, subTotalA], [{ content: 'B) College-Hostel Dues/Sem', colSpan: 3, styles: { fontStyle: 'bold', fillColor: [230, 230, 230], fontSize: 7 } }], ['1', 'Library/Dev/Utility Funds', funds1], ['2', 'Sports/Welfare/Exam Funds', funds2], [{ content: 'Total (A+B)', colSpan: 2, styles: { fontStyle: 'bold' } }, { content: `${amount}`, styles: { fontStyle: 'bold' } }], ], theme: 'grid', styles: { fontSize: 7, cellPadding: 0.8, overflow: 'linebreak', valign: 'middle' }, headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], lineWidth: 0.1, lineColor: [0, 0, 0], halign: 'center' }, bodyStyles: { lineWidth: 0.1, lineColor: [0, 0, 0] }, columnStyles: { 0: { cellWidth: 6 }, 1: { cellWidth: 55 }, 2: { cellWidth: 24, halign:'center' } }, });
            const finalY = doc.lastAutoTable.finalY + 5; doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.text("Rupees in words: _________________________________", startX, finalY); doc.text("Cashier", startX, finalY + 18); doc.text("Officer", startX + 35, finalY + 18); doc.text("Candidate", startX + 65, finalY + 18);
            if (index < 2) { const lineX = startX + contentWidth + 6; doc.setLineDash([2, 2], 0); doc.line(lineX, 5, lineX, 297 - 5); doc.setLineDash([]); doc.setFontSize(10); doc.text("✂", lineX - 1.5, 10); doc.text("✂", lineX - 1.5, 297 - 10); }
        });
        doc.save(`Challan_${studentName}_${part}.pdf`);
    };

    const handleAuth = async (e) => { e.preventDefault(); setErrorMsg(''); setIsAuthLoading(true); const cnic = authInput.cnic.trim(); let password = authInput.password.trim(); const email = getEmail(cnic); if (cnic !== 'admin') { if (cnic !== password) { setIsAuthLoading(false); return setErrorMsg("Password must be same as CNIC."); } if (cnic.length < 6) { setIsAuthLoading(false); return setErrorMsg("CNIC must be at least 6 characters."); } } try { await signInWithEmailAndPassword(auth, email, password); } catch (loginError) { try { await createUserWithEmailAndPassword(auth, email, password); if (cnic !== 'admin') { const initialData = { cnic, personalInfo: { ...studentForm, cnic }, challans: [] }; await setDoc(doc(db, "students", cnic), initialData); } } catch (registerError) { setIsAuthLoading(false); if (registerError.code === 'auth/weak-password') setErrorMsg("Error: Password too short."); else setErrorMsg("Error: " + registerError.message); } } };
    const handleLogout = async () => { await signOut(auth); setAuthInput({ cnic: '', password: '' }); setIsAdmin(false); setSearchedStudent(null); setIsAuthLoading(false); };
    const handleFormChange = (e) => { const { name, value } = e.target; setStudentForm(prev => ({ ...prev, [name]: value })); };
    
    // --- Image Compressor ---
    const handleImageChange = (e) => { const file = e.target.files[0]; if (file) { if (!file.type.startsWith('image/')) { alert("File must be image."); return; } const reader = new FileReader(); reader.onload = (event) => { const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const maxWidth = 300; const scaleSize = maxWidth / img.width; canvas.width = maxWidth; canvas.height = img.height * scaleSize; ctx.drawImage(img, 0, 0, canvas.width, canvas.height); const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7); setStudentForm(prev => ({ ...prev, profileImage: compressedDataUrl })); }; img.src = event.target.result; }; reader.readAsDataURL(file); } };
    
    const saveProfile = async (e) => { e.preventDefault(); if (!user) return; setLoading(true); const cnic = user.email.split('@')[0]; try { const docRef = doc(db, "students", cnic); await setDoc(docRef, { personalInfo: studentForm }, { merge: true }); alert("Profile Saved!"); setUserData(prev => ({ ...prev, personalInfo: studentForm })); setIsEditing(false); } catch (error) { alert("Failed: " + error.message); } finally { setLoading(false); } };
    const handleCancelEdit = () => { setIsEditing(false); if(userData?.personalInfo) { setStudentForm(userData.personalInfo); } };
    const generateChallan = async (part, batch, status) => { if (!user) return; setLoading(true); const cnic = user.email.split('@')[0]; const existingChallan = userData?.challans?.find(c => c.part === part); if (existingChallan) { setLoading(false); alert(`Challan for Part-${part} already exists.`); return; } let fee = status === 'Hosteller' ? 1300 : 900; const challanNo = `CH-${Math.floor(Math.random() * 100000)}`; const newChallan = { id: Date.now(), challanNo, part, batch, statusType: status, amount: fee, status: 'Not Paid', generatedDate: Date.now(), hasDownloaded: false, paymentDetails: null, receiptImageUrl: null }; try { const docRef = doc(db, "students", cnic); await updateDoc(docRef, { challans: arrayUnion(newChallan) }); setUserData(prev => ({ ...prev, challans: [newChallan, ...(prev.challans || [])] })); alert('Challan Generated!'); setActiveTab('dashboard'); } catch (error) { console.error(error); } finally { setLoading(false); } };
    const handleDownloadPdf = async (challan) => { generateSpecificChallanPDF(studentForm.fullName, studentForm.fatherName, challan.part, challan.batch, challan.challanNo, challan.amount, challan.statusType); if (!challan.hasDownloaded) { const cnic = user.email.split('@')[0]; const updatedChallans = userData.challans.map(ch => { if (ch.id === challan.id) return { ...ch, hasDownloaded: true }; return ch; }); try { await updateDoc(doc(db, "students", cnic), { challans: updatedChallans }); setUserData(prev => ({ ...prev, challans: updatedChallans })); } catch (error) { console.error(error); } } };
    
    const openUploadModal = (id) => { setSelectedChallanId(id); const challan = userData.challans.find(c => c.id === id); setUploadForm({ amount: challan.amount, mode: 'BANK DEPOSIT', date: '', file: null }); setShowUploadModal(true); };
    const handleUploadFileChange = (e) => { if (e.target.files[0]) { const file = e.target.files[0]; if (!file.type.startsWith('image/')) { alert("Only JPG/PNG allowed."); return; } if (file.size > 800 * 1024) { alert("File Max 800KB."); return; } setUploadForm({ ...uploadForm, file: file }); } };
    const handleUploadSubmit = async (e) => { e.preventDefault(); if (!uploadForm.file || !uploadForm.date || !uploadForm.amount) { alert("Please fill all fields."); return; } setUploading(true); const cnic = user.email.split('@')[0]; try { const reader = new FileReader(); reader.readAsDataURL(uploadForm.file); reader.onloadend = async () => { const base64File = reader.result; const updatedChallans = userData.challans.map(ch => { if (ch.id === selectedChallanId) { return { ...ch, status: 'Pending Verification', uploadTime: Date.now(), paymentDetails: { amount: uploadForm.amount, mode: uploadForm.mode, date: uploadForm.date }, receiptImageUrl: base64File }; } return ch; }); await updateDoc(doc(db, "students", cnic), { challans: updatedChallans }); setUserData(prev => ({ ...prev, challans: updatedChallans })); setShowUploadModal(false); alert("Receipt Uploaded!"); setUploading(false); }; } catch (error) { alert("Failed to upload."); setUploading(false); } };
    const handleViewReceipt = (url) => { setReceiptUrl(url); setShowReceiptModal(true); };
    const handleAdminAction = async (studentCnic, challanId, newStatus) => { try { const studentRef = doc(db, "students", studentCnic); const studentSnap = await getDoc(studentRef); const studentData = studentSnap.data(); const updatedChallans = studentData.challans.map(ch => { if (ch.id === challanId) return { ...ch, status: newStatus }; return ch; }); await updateDoc(studentRef, { challans: updatedChallans }); await fetchAllStudentsData(); if(searchedStudent && searchedStudent.cnic === studentCnic) { setSearchedStudent({...searchedStudent, challans: updatedChallans}); } alert(`Challan ${newStatus}`); } catch (error) { alert("Failed."); } };
    
    // --- FIXED: DELETE HANDLER ---
    const handleDeleteChallan = async (studentCnic, challanId) => { 
        if(!studentCnic) { alert("Error: Missing Student CNIC"); return; }
        if (!confirm("Are you sure you want to DELETE this challan?")) return; 
        try { 
            const studentRef = doc(db, "students", studentCnic); 
            const studentSnap = await getDoc(studentRef); 
            if(studentSnap.exists()) { 
                const studentData = studentSnap.data(); 
                const updatedChallans = studentData.challans.filter(ch => ch.id !== challanId); 
                await updateDoc(studentRef, { challans: updatedChallans }); 
                await fetchAllStudentsData(); 
                if(searchedStudent && searchedStudent.cnic === studentCnic) { 
                    setSearchedStudent({...studentData, challans: updatedChallans, cnic: studentCnic}); 
                } 
                alert("Deleted successfully."); 
            } else {
                alert("Student record not found in database.");
            }
        } catch (error) { 
            console.error("Delete Error:", error);
            alert("Error: " + error.message); 
        } 
    };

    const openEditModal = (challan, studentCnic) => { setEditForm({ id: challan.id, studentCnic: studentCnic, part: challan.part, batch: challan.batch, amount: challan.amount, status: challan.status }); setShowEditModal(true); };
    const handleEditSubmit = async (e) => { e.preventDefault(); try { const studentRef = doc(db, "students", editForm.studentCnic); const studentSnap = await getDoc(studentRef); const updatedChallans = studentSnap.data().challans.map(ch => { if (ch.id === editForm.id) { return { ...ch, part: editForm.part, batch: editForm.batch, amount: editForm.amount, status: editForm.status }; } return ch; }); await updateDoc(studentRef, { challans: updatedChallans }); await fetchAllStudentsData(); if(searchedStudent && searchedStudent.cnic === editForm.studentCnic) { setSearchedStudent({...searchedStudent, challans: updatedChallans}); } setShowEditModal(false); alert("Updated."); } catch (error) { alert("Failed."); } };

    const TopLoaderBar = () => ( <div className="fixed top-0 left-0 w-full h-1 bg-blue-200 z-50 overflow-hidden"> <div className="h-full bg-yellow-400 animate-pulse w-full origin-left-right scale-x-50"></div> <style>{` @keyframes loading-bar { 0% { transform: translateX(-100%); } 50% { transform: translateX(50%); } 100% { transform: translateX(200%); } } .origin-left-right { animation: loading-bar 1.5s infinite linear; } `}</style> </div> );

    if (!user) return (
        <> {isGlobalLoading && <TopLoaderBar />} <div className="min-h-screen flex items-center justify-center bg-[#f1f5f9] p-6"> <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md overflow-hidden"> <div className="bg-[#007cb7] p-10 text-center flex flex-col items-center"> <Icons.University className="w-14 h-14 text-white mb-3" /> <h1 className="text-xl font-bold text-white tracking-widest uppercase">Student Portal</h1> <p className="text-blue-100 text-xs mt-1 uppercase tracking-wide">Govt. Elementary College Mithi</p> </div> <div className="p-10"> <form onSubmit={handleAuth} className="space-y-6"> <div> <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wide">CNIC / Admin User</label> <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#007cb7] focus:border-transparent outline-none bg-gray-50" placeholder="e.g. 4430312345678" value={authInput.cnic} onChange={(e) => setAuthInput({...authInput, cnic: e.target.value})} required /> </div> <div> <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wide">Password</label> <input type="password" className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#007cb7] focus:border-transparent outline-none bg-gray-50" placeholder="••••••••" value={authInput.password} onChange={(e) => setAuthInput({...authInput, password: e.target.value})} required /> </div> {errorMsg && <div className="bg-red-50 text-red-600 text-xs font-bold p-3 rounded border border-red-200 text-center">{errorMsg}</div>} <button type="submit" className="w-full bg-[#007cb7] hover:bg-[#006391] text-white font-bold py-3.5 rounded-md shadow-md transition-all uppercase tracking-wide text-sm flex justify-center items-center"> {isAuthLoading ? <Icons.Spinner /> : "Sign In"} </button> </form> </div> </div> </div> </>
    );

    if (isAdmin) return (
        <> {isGlobalLoading && <TopLoaderBar />} <div className="min-h-screen bg-slate-50 font-sans text-gray-700"> <header className="bg-[#007cb7] border-b border-[#006391] h-16 flex items-center justify-between px-8 sticky top-0 z-30 shadow-md"> <div className="flex items-center gap-3"><Icons.University className="text-white h-6 w-6" /><h2 className="text-lg font-bold text-white tracking-wide">ADMINISTRATION</h2></div> <button onClick={handleLogout} className="text-white hover:bg-[#006391] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"><Icons.Logout /> LOGOUT</button> </header> <main className="p-8 max-w-7xl mx-auto space-y-8"> <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"> <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">Student Record Management</h3> <div className="flex gap-2"> <input type="text" className="flex-1 px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#007cb7] outline-none" placeholder="Search by CNIC..." value={adminSearchCnic} onChange={(e) => setAdminSearchCnic(e.target.value)} /> <button onClick={handleAdminSearch} className="bg-[#007cb7] hover:bg-[#006391] text-white px-6 py-2 rounded font-bold text-sm">SEARCH</button> </div> {searchedStudent && ( <div className="mt-6 border-t border-gray-100 pt-6"> <div className="flex justify-between items-start mb-4"> <div><h4 className="text-lg font-bold text-[#007cb7]">{searchedStudent.personalInfo?.fullName}</h4><p className="text-xs text-gray-400 uppercase">{searchedStudent.cnic}</p></div> <button onClick={() => setSearchedStudent(null)} className="text-gray-400 hover:text-red-500"><Icons.Close /></button> </div> <div className="overflow-x-auto"> <table className="min-w-full divide-y divide-gray-200 text-sm"> <thead className="bg-gray-50"><tr><th className="px-4 py-3 text-left font-semibold text-gray-600">Details</th><th className="px-4 py-3 text-left font-semibold text-gray-600">Type</th><th className="px-4 py-3 text-left font-semibold text-gray-600">Amount</th><th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th><th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th></tr></thead> <tbody className="divide-y divide-gray-200 bg-white"> {searchedStudent.challans?.map((ch) => ( <tr key={ch.id} className="hover:bg-gray-50"> <td className="px-4 py-3"><div className="font-bold text-gray-800">Part {ch.part}</div><div className="text-xs text-gray-500">{ch.challanNo} | Batch {ch.batch}</div></td> <td className="px-4 py-3 text-gray-600">{ch.statusType || '-'}</td> <td className="px-4 py-3 font-bold text-gray-800">{ch.amount}</td> <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${ch.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{ch.status}</span></td> <td className="px-4 py-3 flex gap-2"><button onClick={() => openEditModal(ch, searchedStudent.cnic)} className="text-[#007cb7] font-bold text-xs bg-blue-50 px-3 py-1 rounded hover:bg-blue-100">EDIT</button><button onClick={() => handleDeleteChallan(searchedStudent.cnic, ch.id)} className="text-red-600 font-bold text-xs bg-red-50 px-3 py-1 rounded hover:bg-red-100">DELETE</button></td> </tr> ))} </tbody> </table> </div> </div> )} </div> <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"> <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Pending Verifications</h3><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">{pendingChallans.length}</span></div> <div className="overflow-x-auto"> <table className="min-w-full divide-y divide-gray-200 text-sm"> <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left font-semibold text-gray-600">Student</th><th className="px-6 py-3 text-left font-semibold text-gray-600">Challan Info</th><th className="px-6 py-3 text-left font-semibold text-gray-600">Proof</th><th className="px-6 py-3 text-left font-semibold text-gray-600">Decision</th></tr></thead> <tbody className="divide-y divide-gray-200 bg-white"> {pendingChallans.length === 0 ? <tr><td colSpan="4" className="px-6 py-6 text-center text-gray-400 text-xs">All caught up! No pending requests.</td></tr> : pendingChallans.map((st, i) => ( <tr key={i} className="hover:bg-gray-50"> <td className="px-6 py-4"><div className="font-bold text-gray-900">{st.name}</div><div className="text-xs text-gray-500">{st.studentCnic}</div></td> <td className="px-6 py-4"><div className="text-gray-700">Part {st.part}</div><div className="text-xs text-gray-500 font-mono">{st.challanNo}</div></td> <td className="px-6 py-4"><button onClick={() => handleViewReceipt(st.receiptImageUrl)} className="text-[#007cb7] text-xs font-bold underline flex items-center gap-1"><Icons.View /> VIEW</button></td> <td className="px-6 py-4 flex gap-2"><button onClick={() => handleAdminAction(st.studentCnic, st.id, 'Verified')} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700">APPROVE</button><button onClick={() => handleAdminAction(st.studentCnic, st.id, 'Not Verified')} className="border border-red-200 text-red-600 px-3 py-1 rounded text-xs font-bold hover:bg-red-50">REJECT</button></td> </tr> ))} </tbody> </table> </div> </div> <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"> <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center"><h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Verified Payments</h3><button onClick={generateAdminPDF} className="text-[#007cb7] text-xs font-bold flex items-center gap-1 hover:underline"><Icons.Download /> REPORT</button></div> <div className="overflow-x-auto max-h-96"> <table className="min-w-full divide-y divide-gray-200 text-sm"> <thead className="bg-gray-50 sticky top-0"><tr><th className="px-6 py-3 text-left font-semibold text-gray-600">CNIC</th><th className="px-6 py-3 text-left font-semibold text-gray-600">Name</th><th className="px-6 py-3 text-left font-semibold text-gray-600">Detail</th><th className="px-6 py-3 text-left font-semibold text-gray-600">Date</th><th className="px-6 py-3 text-left font-semibold text-gray-600">Receipt</th><th className="px-6 py-3 text-left font-semibold text-gray-600">Action</th></tr></thead> <tbody className="divide-y divide-gray-200 bg-white"> {allPaidStudents.map((st, i) => ( <tr key={i} className="hover:bg-gray-50"> <td className="px-6 py-3 text-gray-500 font-mono text-xs">{st.studentCnic}</td> <td className="px-6 py-3 font-bold text-gray-800">{st.name}</td> <td className="px-6 py-3 text-gray-600">Part {st.part} / {st.batch}</td> <td className="px-6 py-3 text-gray-500 text-xs">{st.date}</td> <td className="px-6 py-3"><button onClick={() => handleViewReceipt(st.receiptImageUrl)} className="text-[#007cb7] hover:text-[#006391]"><Icons.View /></button></td> <td className="px-6 py-3 flex gap-2"><button onClick={() => openEditModal(st, st.studentCnic)} className="text-blue-600 hover:text-blue-800"><Icons.Edit /></button><button onClick={() => handleDeleteChallan(st.studentCnic, st.id)} className="text-red-600 hover:text-red-800"><Icons.Delete /></button></td> </tr> ))} </tbody> </table> </div> </div> </main> {showEditModal && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-sm"><div className="p-5 border-b border-gray-100"><h3 className="font-bold text-gray-800">Edit Record</h3></div><form onSubmit={handleEditSubmit} className="p-5 space-y-4"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Part</label><select value={editForm.part} onChange={(e) => setEditForm({...editForm, part: e.target.value})} className="w-full border p-2 rounded text-sm"><option value="I">Part I</option><option value="II">Part II</option><option value="III">Part III</option><option value="IV">Part IV</option></select></div><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label><select value={editForm.status} onChange={(e) => setEditForm({...editForm, status: e.target.value})} className="w-full border p-2 rounded text-sm"><option value="Verified">Verified</option><option value="Not Verified">Not Verified</option><option value="Pending Verification">Pending Verification</option></select></div><div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-500 text-xs font-bold hover:bg-gray-100 rounded">CANCEL</button><button type="submit" className="px-4 py-2 bg-[#007cb7] text-white text-xs font-bold hover:bg-[#006391] rounded shadow-sm">SAVE</button></div></form></div></div>} {showReceiptModal && <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-xl max-w-2xl w-full h-[80vh] flex flex-col"><div className="p-3 border-b flex justify-between items-center"><h3 className="font-bold text-sm text-gray-600 uppercase">Receipt Proof</h3><button onClick={() => setShowReceiptModal(false)} className="text-gray-400 hover:text-red-500"><Icons.Close /></button></div><div className="flex-1 bg-black/5 p-4 flex justify-center items-center overflow-auto"><img src={receiptUrl} alt="Receipt" className="max-h-full object-contain shadow" /></div></div></div>} </div> </>
    );

    // --- STUDENT DASHBOARD ---
    return (
        <>
            {isGlobalLoading && <TopLoaderBar />}
            <div className="flex h-screen bg-[#f8fafc] font-sans text-gray-800">
                {/* Sidebar */}
                <aside className="w-64 bg-[#007cb7] text-white flex flex-col shadow-2xl hidden md:flex sticky top-0 h-screen">
                    <div className="h-24 flex items-center border-b border-[#006391] bg-[#006391] px-4 gap-3">
                        <Icons.University className="h-10 w-10 text-white" />
                        <div className="flex flex-col items-start justify-center">
                            <h1 className="text-xs font-extrabold text-white leading-tight tracking-wider">GOVT. ELEMENTARY COLLEGE</h1>
                            <h2 className="text-[10px] font-bold text-blue-100 leading-tight tracking-wider">OF EDUCATION (M/W) MITHI</h2>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-8 p-3 bg-[#006391]/50 rounded-lg border border-[#006391]/50">
                            <div className="w-8 h-8 rounded-full bg-white text-[#007cb7] flex items-center justify-center text-xs font-bold overflow-hidden border-2 border-blue-200">
                                {studentForm.profileImage ? <img src={studentForm.profileImage} className="w-full h-full object-cover" /> : studentForm.fullName?.charAt(0) || 'U'}
                            </div>
                            <div className="overflow-hidden"><h4 className="text-xs font-bold truncate text-white uppercase">{studentForm.fullName || 'Student'}</h4><p className="text-[10px] text-blue-100 truncate">{user.email.split('@')[0]}</p></div>
                        </div>
                        <nav className="space-y-1">
                            {[
                                { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
                                { id: 'profile', label: 'My Profile', icon: Icons.Profile },
                                { id: 'generator', label: 'Exam Challan', icon: Icons.Exam },
                            ].map((item) => (
                                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === item.id ? 'bg-white text-[#007cb7] shadow-md font-bold' : 'text-blue-50 hover:bg-[#006391] hover:text-white font-medium'}`}>
                                    <item.icon className="w-4 h-4 mr-3" /> <span className="text-xs tracking-wide uppercase">{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                    <div className="mt-auto p-6 border-t border-[#006391]">
                        <button onClick={handleLogout} className="w-full flex items-center justify-center px-4 py-3 rounded-lg text-blue-100 hover:bg-[#005a85] hover:text-white transition-colors font-bold text-xs uppercase tracking-wide"><Icons.Logout /> LOGOUT</button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden h-screen">
                    <header className="h-16 bg-[#007cb7] border-b border-[#006391] flex items-center justify-between px-8 sticky top-0 z-20 shadow-md">
                        <h2 className="text-lg font-bold text-white uppercase tracking-wide">{activeTab === 'dashboard' ? 'Overview' : activeTab === 'profile' ? 'Profile' : 'Fee Section'}</h2>
                        <div className="text-xs text-blue-100 font-medium uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </header>

                    <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 space-y-8">
                        {activeTab === 'dashboard' && (
                            <div className="animate-fade-in space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between"><div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Total Challans</p><h3 className="text-2xl font-bold text-gray-800">{userData?.challans?.length || 0}</h3></div><div className="p-2 bg-blue-50 text-[#007cb7] rounded"><Icons.Exam /></div></div>
                                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between"><div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Pending</p><h3 className="text-2xl font-bold text-orange-500">{userData?.challans?.filter(c => c.status === 'Pending Verification').length || 0}</h3></div><div className="p-2 bg-orange-50 text-orange-500 rounded"><Icons.Upload /></div></div>
                                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between"><div><p className="text-xs text-gray-400 font-bold uppercase mb-1">Verified</p><h3 className="text-2xl font-bold text-green-600">{userData?.challans?.filter(c => c.status === 'Verified').length || 0}</h3></div><div className="p-2 bg-green-50 text-green-600 rounded"><Icons.View /></div></div>
                                </div>

                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                    <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Recent Activity</h3></div>
                                    <div className="overflow-x-auto">
                                        {(!userData?.challans || userData.challans.length === 0) ? (
                                            <div className="p-8 text-center text-gray-400 text-xs">No records found.</div>
                                        ) : (
                                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase text-xs">Details</th><th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase text-xs">Amount</th><th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase text-xs">Status</th><th className="px-6 py-3 text-left font-semibold text-gray-600 uppercase text-xs">Actions</th></tr></thead>
                                                <tbody className="bg-white divide-y divide-gray-100">
                                                    {userData.challans.map((c) => (
                                                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4"><div className="font-bold text-gray-800 text-xs uppercase">Part {c.part} Exam Fee</div><div className="text-[10px] text-gray-400 mt-0.5 font-mono">{c.challanNo} | {c.statusType}</div></td>
                                                            <td className="px-6 py-4"><span className="font-mono font-bold text-gray-700 text-xs">Rs.{c.amount}</span></td>
                                                            <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${c.status === 'Verified' ? 'bg-green-100 text-green-700' : c.status === 'Pending Verification' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{c.status}</span></td>
                                                            <td className="px-6 py-4 text-xs font-bold flex items-center gap-3">
                                                                <button onClick={() => handleDownloadPdf(c)} className="text-[#007cb7] hover:underline flex items-center gap-1"><Icons.Download /> PDF</button>
                                                                {c.status === 'Verified' ? (
                                                                    <button onClick={() => handleViewReceipt(c.receiptImageUrl)} className="text-green-600 hover:underline flex items-center gap-1"><Icons.View /> RECEIPT</button>
                                                                ) : (c.hasDownloaded && (
                                                                    <button onClick={() => openUploadModal(c.id)} className="bg-[#007cb7] text-white px-3 py-1.5 rounded hover:bg-[#006391] flex items-center gap-1 shadow-sm transition-all"><Icons.Upload /> UPLOAD</button>
                                                                ))}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 animate-fade-in overflow-hidden mb-10">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="font-bold text-sm text-gray-700 uppercase tracking-wide">
                                        {isEditing ? 'Edit Profile' : 'Personal Details'}
                                    </h3>
                                    <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded border">ID: {user.email.split('@')[0]}</span>
                                </div>

                                {isEditing ? (
                                    <form onSubmit={saveProfile} className="p-8">
                                        <div className="flex flex-col items-center mb-8">
                                            <div className="w-24 h-24 rounded-full bg-gray-100 mb-3 overflow-hidden border-4 border-white shadow-md relative group">
                                                {studentForm.profileImage ? <img src={studentForm.profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Icons.Profile /></div>}
                                                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white font-bold text-[10px] uppercase tracking-wide">Change Photo<input type="file" className="hidden" accept="image/*" onChange={handleImageChange} /></label>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {[
                                                { label: 'Prefix', name: 'prefix', type: 'select', options: ['M', 'F'] },
                                                { label: 'Full Name', name: 'fullName', type: 'text', col: 2 },
                                                { label: 'Surname', name: 'surname', type: 'text' },
                                                { label: 'Father Name', name: 'fatherName', type: 'text' },
                                                { label: 'Date of Birth', name: 'dob', type: 'date' },
                                                { label: 'Mobile No', name: 'mobileNo', type: 'text' },
                                                { label: 'City', name: 'city', type: 'select', options: ['MITHI', 'ISLAMKOT', 'CHACHRO'] },
                                                { label: 'District', name: 'district', type: 'select', options: ['THARPARKAR', 'UMERKOT'] },
                                                { label: 'Zip Code', name: 'zipCode', type: 'text' },
                                            ].map((field, idx) => (
                                                <div key={idx} className={field.col ? `md:col-span-${field.col}` : ''}>
                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">{field.label}</label>
                                                    {field.type === 'select' ? (
                                                        <select name={field.name} value={studentForm[field.name]} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#007cb7] outline-none bg-white text-sm">{field.options.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                                    ) : (
                                                        <input type={field.type} name={field.name} value={studentForm[field.name]} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#007cb7] outline-none transition-all uppercase text-sm" />
                                                    )}
                                                </div>
                                            ))}
                                            <div className="md:col-span-3"><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">Postal Address</label><textarea name="homeAddress" rows="2" value={studentForm.homeAddress} onChange={handleFormChange} className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#007cb7] outline-none uppercase text-sm"></textarea></div>
                                        </div>
                                        <div className="mt-8 flex justify-end gap-3">
                                            <button type="button" onClick={handleCancelEdit} className="px-6 py-2 rounded font-bold text-xs uppercase tracking-wide text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
                                            <button type="submit" className="bg-[#007cb7] hover:bg-[#006391] text-white px-6 py-2 rounded font-bold shadow-md transition-all text-xs uppercase tracking-wide">Save Changes</button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="p-8 flex flex-col items-center relative">
                                        <div className="flex flex-col items-center mb-8">
                                            <div className="w-32 h-32 rounded-full bg-gray-100 mb-4 overflow-hidden border-4 border-white shadow-lg">
                                                {studentForm.profileImage ? <img src={studentForm.profileImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-300"><Icons.Profile /></div>}
                                            </div>
                                            <h4 className="font-bold text-xl text-gray-800 uppercase">{studentForm.fullName || 'Student Name'}</h4>
                                            <p className="text-sm text-gray-500 font-mono mt-1">{user.email.split('@')[0]}</p>
                                        </div>
                                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-2xl overflow-hidden mb-8">
                                            <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-gray-100 md:divide-y-0 md:divide-x">
                                                 <div className="p-5 space-y-4">
                                                     <div><h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Full Name</h5><p className="text-sm font-bold text-gray-700 uppercase">{studentForm.fullName}</p></div>
                                                     <div><h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Father Name</h5><p className="text-sm font-bold text-gray-700 uppercase">{studentForm.fatherName}</p></div>
                                                     <div><h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Date of Birth</h5><p className="text-sm font-bold text-gray-700 uppercase">{studentForm.dob}</p></div>
                                                     <div><h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Gender</h5><p className="text-sm font-bold text-gray-700 uppercase">{studentForm.gender}</p></div>
                                                 </div>
                                                 <div className="p-5 space-y-4 bg-gray-50/50">
                                                     <div><h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Mobile No</h5><p className="text-sm font-bold text-gray-700 uppercase">{studentForm.mobileNo}</p></div>
                                                     <div><h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">City / District</h5><p className="text-sm font-bold text-gray-700 uppercase">{studentForm.city} / {studentForm.district}</p></div>
                                                     <div><h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Address</h5><p className="text-sm font-bold text-gray-700 uppercase break-words">{studentForm.homeAddress}</p></div>
                                                 </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsEditing(true)} className="bg-[#007cb7] hover:bg-[#006391] text-white px-8 py-3 rounded-lg font-bold shadow-md transition-all text-xs uppercase tracking-wide flex items-center gap-2">
                                            <Icons.Edit /> Edit Profile
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'generator' && (
                            <div className="max-w-xl mx-auto mt-10">
                                <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-fade-in">
                                    <div className="bg-[#007cb7] px-6 py-5 text-center"><h3 className="text-lg font-bold text-white tracking-wide uppercase">Fee Challan Generator</h3></div>
                                    <div className="p-8 space-y-6">
                                        <form onSubmit={(e) => { e.preventDefault(); generateChallan(e.target.part.value, e.target.batch.value, e.target.status.value); }}>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Part</label>
                                                    <select name="part" className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#007cb7] outline-none bg-gray-50 text-sm"><option value="I">Part I (First Year)</option><option value="II">Part II (Second Year)</option><option value="III">Part III (Third Year)</option><option value="IV">Part IV (Fourth Year)</option></select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Select Batch</label>
                                                    <select name="batch" className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#007cb7] outline-none bg-gray-50 text-sm"><option value="2k22">Batch 2k22</option><option value="2k23">Batch 2k23</option><option value="2k24">Batch 2k24</option><option value="2k25">Batch 2k25</option><option value="2k26">Batch 2k26</option></select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Resident Status</label>
                                                    <select name="status" className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-1 focus:ring-[#007cb7] outline-none bg-gray-50 text-sm"><option value="Hosteller">Hosteller (Boarder) - Rs.1300</option><option value="Non-Hosteller">Non-Hosteller (Day Scholar) - Rs.900</option></select>
                                                </div>
                                            </div>
                                            <button type="submit" className="w-full mt-6 bg-[#007cb7] hover:bg-[#006391] text-white font-bold py-3 rounded shadow-lg transition-all text-xs uppercase tracking-wide flex justify-center items-center gap-2"><Icons.Download /> Generate PDF</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        )}
                    </main>
                    
                    {/* Modals */}
                    {showUploadModal && (<div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-sm overflow-hidden"><div className="bg-gray-50 px-5 py-4 border-b border-gray-100 flex justify-between items-center"><h3 className="font-bold text-sm text-gray-700 uppercase">Upload Receipt</h3><button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-red-500"><Icons.Close /></button></div><form onSubmit={handleUploadSubmit} className="p-5 space-y-4"><div className="bg-blue-50 text-blue-800 text-[10px] p-3 rounded border border-blue-100">Upload stamped bank copy (JPG/PNG). Max 800KB.</div><div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Amount Paid</label><input type="text" value={uploadForm.amount} onChange={(e) => setUploadForm({ ...uploadForm, amount: e.target.value })} className="w-full px-3 py-2 border rounded text-sm" required /></div><div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Date</label><input type="date" value={uploadForm.date} onChange={(e) => setUploadForm({ ...uploadForm, date: e.target.value })} className="w-full px-3 py-2 border rounded text-sm" required /></div><div className="border-2 border-dashed border-gray-300 rounded p-4 text-center hover:bg-gray-50 cursor-pointer relative"><Icons.Upload /><span className="text-xs text-gray-400 block mt-1">Select Image</span><input type="file" accept="image/jpeg, image/png" onChange={handleUploadFileChange} className="absolute inset-0 opacity-0 cursor-pointer" required /></div><button type="submit" disabled={uploading} className="w-full bg-[#007cb7] text-white font-bold py-2 rounded shadow-sm text-xs uppercase flex justify-center items-center">{uploading ? <Icons.Spinner /> : 'SUBMIT'}</button></form></div></div>)}
                    {showReceiptModal && (<div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"><div className="bg-white rounded-lg shadow-xl max-w-2xl w-full h-[80vh] flex flex-col"><div className="p-3 border-b flex justify-between items-center"><h3 className="font-bold text-sm text-gray-600 uppercase">Proof</h3><button onClick={() => setShowReceiptModal(false)} className="text-gray-400 hover:text-red-500"><Icons.Close /></button></div><div className="flex-1 bg-black/5 p-4 flex justify-center items-center overflow-auto"><img src={receiptUrl} alt="Receipt" className="max-h-full object-contain shadow" /></div></div></div>)}
                </div>
            </div>
        </>
    );
};

export default App;