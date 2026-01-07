
document.addEventListener('DOMContentLoaded', function() {
  // ---------- Firebase ----------
  const firebaseConfig = {
    apiKey: "AIzaSyAENr32Pk-Sq44tuBPj8c_xXk4qzEa3GJw",
    authDomain: "login-9338e.firebaseapp.com",
    databaseURL: "https://login-9338e-default-rtdb.firebaseio.com",
    projectId: "login-9338e",
    storageBucket: "login-9338e.appspot.com",
    messagingSenderId: "649880075591",
    appId: "1:649880075591:web:a5cd336a03d80e9b656062",
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  // ---------- Cloudinary ----------
  const CLOUD_NAME = "dzqdmkis4";
  const UPLOAD_PRESET = "pdf_upload";

  // ---------- Canvas Signature ----------
  const canvas = document.getElementById('sig-canvas');
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let lastPos = {x:0,y:0};
  let signatureDrawn = false;

  function resizeCanvas(){
    const ratio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    ctx.scale(ratio,ratio);
    ctx.lineWidth=2;
    ctx.lineCap='round';
    ctx.strokeStyle='#000';
    ctx.clearRect(0,0,canvas.width,canvas.height);
    signatureDrawn = false;
  }
  function resizeCanvas(){
  const ratio = window.devicePixelRatio || 1;
  const oldImage = ctx.getImageData(0, 0, canvas.width, canvas.height); // 🔥 save previous drawing

  canvas.width = canvas.offsetWidth * ratio;
  canvas.height = canvas.offsetHeight * ratio;
  ctx.scale(ratio, ratio);
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000';

  ctx.putImageData(oldImage, 0, 0); // 🔥 restore drawing
}

  resizeCanvas();

  function getPos(e){
    const rect = canvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {x: t.clientX - rect.left, y: t.clientY - rect.top};
  }

  function draw(e){
    if(!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.x,lastPos.y);
    ctx.lineTo(pos.x,pos.y);
    ctx.stroke();
    lastPos = pos;
    signatureDrawn = true;
  }

  canvas.addEventListener('mousedown', e=>{drawing=true; lastPos=getPos(e);});
  canvas.addEventListener('touchstart', e=>{drawing=true; lastPos=getPos(e);});
  canvas.addEventListener('mouseup', ()=>drawing=false);
  canvas.addEventListener('mouseout', ()=>drawing=false);
  canvas.addEventListener('touchend', ()=>drawing=false);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('touchmove', draw);

  // ---------- Clear Signature ----------
  document.getElementById('clearSig').addEventListener('click', ()=>{
    ctx.clearRect(0,0,canvas.width,canvas.height);
    document.getElementById('sigOutImg').src='';
    signatureDrawn = false;
  });

  // ---------- Auto-set Dates ----------
  const startInput = document.getElementById('startDate');
  const endInput = document.getElementById('endDate');
  const engageInput = document.getElementById('engageDate');

  endInput.disabled = true;
  engageInput.disabled = true;

  startInput.addEventListener('change', ()=>{
    const start = new Date(startInput.value);
    if(!isNaN(start)){
      const end = new Date(start);
      end.setFullYear(end.getFullYear()+1);
      endInput.valueAsDate = end;
      engageInput.valueAsDate = start;
    } else {
      endInput.value = '';
      engageInput.value = '';
    }
  });

  // ---------- Validate function ----------
  function validateFields(){
    const name = document.getElementById('employeeName').value.trim();
    const startDate = startInput.value.trim();
    const empImage = document.getElementById('employeeImage').files[0];

    if(!name){
      alert('Please enter Employee Name');
      return false;
    }
    if(!startDate){
      alert('Please select Start Date');
      return false;
    }
    if(!signatureDrawn){
      alert('Please draw signature');
      return false;
    }
    if(!empImage){
      alert('Please upload Employee Image');
      return false;
    }
    return true;
  }

  // ---------- Show Preview ----------
  document.getElementById('showPreview').addEventListener('click', ()=>{
    if(!validateFields()) return;

    document.getElementById('empNameOut').innerText = document.getElementById('employeeName').value || 'Employee';
    document.getElementById('outStart').innerText = startInput.value || 'DD/MM/YYYY';
    document.getElementById('outEnd').innerText = endInput.value || 'DD/MM/YYYY';
    document.getElementById('outEngage').innerText = engageInput.value || 'DD/MM/YYYY';

    // Capture signature
    const sigData = canvas.toDataURL('image/png');
    document.getElementById('sigOutImg').src = sigData;

    // Show employee image
    const fileInput = document.getElementById('employeeImage');
    if(fileInput && fileInput.files[0]){
      const reader = new FileReader();
      reader.onload = e => document.getElementById('empImageOut').src = e.target.result;
      reader.readAsDataURL(fileInput.files[0]);
    }

    document.getElementById('previewPage').style.display='block';
    document.getElementById('previewPage').scrollIntoView({behavior:'smooth'});
  });

 document.getElementById('downloadPrint').addEventListener('click', async ()=>{

  if(!validateFields()) return;

  const overlay = document.getElementById('overlay');
  overlay.style.display='flex';

  // 🔥 Hide controls BEFORE capturing & printing
  const controls = document.querySelector('.controls');
  if (controls) controls.style.display = 'none';

  try{
    const empName = document.getElementById('employeeName').value.trim() || 'Employee';
    const imageFile = document.getElementById('employeeImage').files[0];

    // Upload employee image to Cloudinary
    let empImageUrl = '';
    if(imageFile){
      const imgForm = new FormData();
      imgForm.append('file', imageFile);
      imgForm.append('upload_preset', UPLOAD_PRESET);
      const imgResp = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method:'POST', body:imgForm }
      );
      const imgData = await imgResp.json();
      empImageUrl = imgData.secure_url || '';
    }

    // Generate long image for Cloudinary (JPEG)
    const element = document.getElementById('previewPage');

    const canvasImg = await html2canvas(element, { scale:2, useCORS:true });
    const dataURL = canvasImg.toDataURL('image/jpeg', 0.95);

    const blob = await (await fetch(dataURL)).blob();
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', UPLOAD_PRESET);

    const cloudResp = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      { method:'POST', body:formData }
    );
    const cloudData = await cloudResp.json();
    if(!cloudData.secure_url) throw new Error('Cloudinary upload failed');

    // Save info to Firebase
    const newRef = db.ref('pdfs').push();
    await newRef.set({
      name: empName,
      employeeImage: empImageUrl,
      pdf: cloudData.secure_url,
      createdAt: Date.now()
    });

    // Hide overlay
    overlay.style.display='none';
    alert('Uploaded successfully!');

    element.style.display = 'block';

    // ---------- PRINT as PDF ----------
    setTimeout(() => {
      window.print();
    }, 300);

  } catch(err){
    console.error(err);
    alert('Error: ' + err.message);
    overlay.style.display='none';
  } finally {

    // 🔥 Show controls again AFTER capture & print
    setTimeout(() => {
      if (controls) controls.style.display = '';
    }, 1000); // give print dialog time

  }

});



});
