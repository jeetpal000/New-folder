export const students=[
{id:1,name:'Rahul Kumar',className:'10-A',roll:'102',phone:'9876543210',attendance:92,fee:'Paid',admission:'04 Apr 2026',avatar:'RK'},
{id:2,name:'Priya Sharma',className:'10-A',roll:'103',phone:'9876543208',attendance:88,fee:'Paid',admission:'04 Apr 2026',avatar:'PS'},
{id:3,name:'Aman Singh',className:'10-B',roll:'104',phone:'9876543193',attendance:76,fee:'Unpaid',admission:'05 Apr 2026',avatar:'AS'},
{id:4,name:'Neha Gupta',className:'10-B',roll:'105',phone:'9876543212',attendance:90,fee:'Paid',admission:'05 Apr 2026',avatar:'NG'},
{id:5,name:'Rohan Verma',className:'9-A',roll:'106',phone:'9876543678',attendance:94,fee:'Paid',admission:'06 Apr 2026',avatar:'RV'}];
export const teachers=[{id:1,name:'Rahul Sharma',email:'rahul@school.com',classes:'10-A, 10-B',status:'Active',avatar:'RS'},{id:2,name:'Amit Singh',email:'amit@school.com',classes:'9-A, 9-B',status:'Active',avatar:'AS'},{id:3,name:'Priya Mehta',email:'priya@school.com',classes:'11-A',status:'Active',avatar:'PM'}];
export const attendance=students.map((s,i)=>({...s,status:i===2?'Absent':'Present'}));
