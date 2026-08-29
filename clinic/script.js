const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_ohcEeCWrLng7OCllyPK0h8rFA5pzfHoudgi6yeV_3ml3gWWqAwHCslynql4SwMGE6w/exec";

const CLINIC_LABELS = {
  dental: "أسنان",
  gynecology: "نسا وتوليد",
  internal: "باطنة",
  orthopedic: "عظام",
  pediatric: "أطفال",
  ophthalmology: "رمد",
  physiotherapy: "علاج طبيعي",
  neurology: "مخ وأعصاب",
  vascular: "جراحة وأوعية دموية",
  dermatology: "جلدية",
  ent: "أنف وأذن",
  speech_therapy: "تخاطب",
  psychiatry: "نفسية",
  nutrition: "تغذية علاجية"
};

const SERVICE_LABELS = {
  checkup: "كشف",
  consultation: "استشارة",
  sessions: "جلسات",
  followup: "متابعة"
};

// خريطة أرقام هواتف العيادات الدقيقة
const CLINIC_PHONES = {
  // المجموعة 1 (01141891350)
  dental: "01141891350",
  dermatology: "01141891350",
  speech_therapy: "01141891350",
  
  // المجموعة 2 (0106904039)
  internal: "0106904039",
  physiotherapy: "0106904039",
  
  // المجموعة 3 (01155298538)
  ophthalmology: "01155298538",
  orthopedic: "01155298538",
  pediatric: "01155298538",
  vascular: "01155298538",
  neurology: "01155298538",
  
  // المجموعة 4 (01030719551)
  ent: "01030719551",
  psychiatry: "01030719551",
  nutrition: "01030719551",
  gynecology: "01030719551"
};

// عناصر النموذج
const bookingForm = document.getElementById("bookingForm");
const bookingDateInput = document.getElementById("booking_date");
const clinicSelect = document.getElementById("clinic_key");
const doctorGroup = document.getElementById("doctorGroup");
const doctorSelect = document.getElementById("doctor_name");
const doctorStatusNote = document.getElementById("doctorStatusNote");
const autoRoomDisplayGroup = document.getElementById("autoRoomDisplayGroup");
const autoRoomDisplay = document.getElementById("autoRoomDisplay");
const serviceTypeGroup = document.getElementById("serviceTypeGroup");
const serviceTypeSelect = document.getElementById("service_type");
const specialNotesGroup = document.getElementById("specialNotesGroup");
const specialAlertText = document.getElementById("specialAlertText");
const submitBtn = document.getElementById("submitBtn");
const loader = document.getElementById("loader");
const responseMessage = document.getElementById("responseMessage");

// عناصر كارت المودال والتذكرة
const bookingModal = document.getElementById("bookingModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const downloadTicketBtn = document.getElementById("downloadTicketBtn");
const printableTicket = document.getElementById("printableTicket");
const modalFooterSection = document.getElementById("modalFooterSection");
const modalName = document.getElementById("modalName");
const modalDate = document.getElementById("modalDate");
const modalClinic = document.getElementById("modalClinic");
const modalDoctorRow = document.getElementById("modalDoctorRow");
const modalDoctor = document.getElementById("modalDoctor");
const modalService = document.getElementById("modalService");
const modalRoomRow = document.getElementById("modalRoomRow");
const modalRoom = document.getElementById("modalRoom");
const modalAge = document.getElementById("modalAge");
const modalPhone = document.getElementById("modalPhone");
const modalClinicPhone = document.getElementById("modalClinicPhone");
const modalMainMessage = document.getElementById("modalMainMessage");
const modalQueueRow = document.getElementById("modalQueueRow");
const modalQueueNumber = document.getElementById("modalQueueNumber");

// عناصر جدول المواعيد
const openScheduleBtn = document.getElementById("openScheduleBtn");
const scheduleModal = document.getElementById("scheduleModal");
const closeScheduleBtn = document.getElementById("closeScheduleBtn");
const scheduleLoader = document.getElementById("scheduleLoader");
const doctorsList = document.getElementById("doctorsList");

// مصفوفة لتخزين بيانات الأطباء من شيت Doctors
let allDoctorsData = [];

// 1. ضبط الحد الأدنى للتقويم من تاريخ اليوم بالتوقيت المحلي
const nowLocal = new Date();
const localDateString = nowLocal.getFullYear() + '-' + String(nowLocal.getMonth() + 1).padStart(2, '0') + '-' + String(nowLocal.getDate()).padStart(2, '0');
bookingDateInput.min = localDateString;
bookingDateInput.value = localDateString;

// 2. جلب بيانات الأطباء في الخلفية فور فتح الصفحة
async function fetchDoctorsData() {
  try {
    const res = await fetch(`${SCRIPT_URL}?action=getDoctors`);
    const data = await res.json();
    if (data.success && data.doctors) {
      allDoctorsData = data.doctors;
      if (clinicSelect.value) {
        updateAvailableDoctors();
      }
    }
  } catch (err) {
    console.error("فشل جلب بيانات الأطباء", err);
  }
}
fetchDoctorsData();

// دالة تنظيف وتوحيد النصوص العربية والإنجليزية
function normalizeArabic(text) {
  if (!text) return "";
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[،,]/g, " ")
    .replace(/\s+/g, " ");
}

// دالة حساب اليوم العربي بالتوقيت المحلي
function getArabicDayName(dateString) {
  if (!dateString) return "";
  const parts = dateString.split("-");
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  const localDate = new Date(year, month, day, 12, 0, 0);
  const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  return days[localDate.getDay()];
}

// تحديث عرض الغرفة التلقائي للمريض
function updateAutoRoomDisplay() {
  const selectedClinic = clinicSelect.value;
  const selectedDoctor = doctorSelect.value;

  if (selectedClinic === "dental") {
    let roomVal = "غرفة (1)"; // القيمة الافتراضية

    if (selectedDoctor && allDoctorsData.length > 0) {
      const docObj = allDoctorsData.find((d) => d.doctor_name === selectedDoctor);
      if (docObj && docObj.room) {
        roomVal = docObj.room === "room_2" || docObj.room === "غرفة 2" ? "غرفة (2)" : "غرفة (1)";
      }
    }

    autoRoomDisplay.value = roomVal;
    autoRoomDisplayGroup.style.display = "block";
  } else {
    autoRoomDisplayGroup.style.display = "none";
  }
}

doctorSelect.addEventListener("change", updateAutoRoomDisplay);

// 3. فلترة وتحديث قائمة الأطباء المتاحين بذكاء
function updateAvailableDoctors() {
  const selectedDate = bookingDateInput.value;
  const selectedClinic = clinicSelect.value;

  if (!selectedDate || !selectedClinic) {
    doctorGroup.style.display = "none";
    autoRoomDisplayGroup.style.display = "none";
    return;
  }

  if (!allDoctorsData || allDoctorsData.length === 0) {
    doctorGroup.style.display = "block";
    doctorStatusNote.style.color = "#0369a1";
    doctorStatusNote.textContent = "⏳ جاري فحص جدول الأطباء...";
    return;
  }

  const dayName = getArabicDayName(selectedDate);
  const normalizedDay = normalizeArabic(dayName);
  const clinicArabic = normalizeArabic(CLINIC_LABELS[selectedClinic] || "");
  const clinicKey = normalizeArabic(selectedClinic);

  const available = allDoctorsData.filter((doc) => {
    const docClinic = normalizeArabic(doc.clinic_key);
    const docDays = normalizeArabic(doc.working_days);

    const matchClinic = (
      docClinic === clinicKey ||
      docClinic === clinicArabic ||
      docClinic.includes(clinicKey) ||
      clinicArabic.includes(docClinic)
    );

    const matchDay = docDays.includes(normalizedDay);

    return matchClinic && matchDay;
  });

  doctorSelect.innerHTML = "";

  if (available.length > 0) {
    doctorGroup.style.display = "block";
    doctorStatusNote.style.color = "#0369a1";
    doctorStatusNote.textContent = `الأطباء المتواجدون يوم (${dayName}):`;

    available.forEach((doc) => {
      const opt = document.createElement("option");
      opt.value = doc.doctor_name;
      opt.textContent = `${doc.doctor_name} ${doc.schedule_time ? `(${doc.schedule_time})` : ""}`;
      doctorSelect.appendChild(opt);
    });

    updateAutoRoomDisplay();
  } else {
    doctorGroup.style.display = "block";
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = `لا يوجد طبيب متواجد في هذا التخصص يوم (${dayName})`;
    doctorSelect.appendChild(opt);
    doctorStatusNote.style.color = "#dc2626";
    doctorStatusNote.textContent = "يرجى اختيار يوم آخر يتوافق مع جدول مواعيد العيادة.";
    autoRoomDisplayGroup.style.display = "none";
  }
}

// 4. تحديث قائمة الخدمات بناءً على التخصص
clinicSelect.addEventListener("change", (e) => {
  const selectedClinic = e.target.value;
  serviceTypeSelect.innerHTML = "";
  serviceTypeGroup.style.display = "block";

  let services = [];

  if (selectedClinic === "psychiatry") {
    services = [
      { value: "checkup", label: "كشف" },
      { value: "consultation", label: "استشارة" },
      { value: "followup", label: "متابعة" }
    ];
  } else if (selectedClinic === "physiotherapy" || selectedClinic === "speech_therapy") {
    services = [
      { value: "checkup", label: "كشف" },
      { value: "sessions", label: "جلسات" }
    ];
  } else if (selectedClinic === "nutrition") {
    services = [
      { value: "checkup", label: "كشف" },
      { value: "sessions", label: "جلسات" },
      { value: "followup", label: "متابعة" }
    ];
  } else if (selectedClinic === "dental") {
    services = [
      { value: "checkup", label: "كشف" },
      { value: "followup", label: "متابعة" }
    ];
  } else {
    services = [
      { value: "checkup", label: "كشف" },
      { value: "consultation", label: "استشارة" }
    ];
  }

  services.forEach((srv) => {
    const opt = document.createElement("option");
    opt.value = srv.value;
    opt.textContent = srv.label;
    serviceTypeSelect.appendChild(opt);
  });

  checkSpecialPolicies();
  updateAvailableDoctors();
  updateAutoRoomDisplay();
});

bookingDateInput.addEventListener("change", updateAvailableDoctors);
serviceTypeSelect.addEventListener("change", checkSpecialPolicies);

function checkSpecialPolicies() {
  const clinic = clinicSelect.value;
  if (clinic === "psychiatry") {
    specialAlertText.textContent = "⚠️ تنبيه: العيادات النفسية تتطلب الحجز والدفع المسبق لتأكيد الموعد.";
    specialNotesGroup.style.display = "block";
  } else {
    specialNotesGroup.style.display = "none";
  }
}

// 5. إرسال الحجز والتحقق
bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nameInput = document.getElementById("name").value.trim();
  const ageInput = document.getElementById("age").value.trim();
  const phoneInput = document.getElementById("phone").value.trim();
  const dateInput = bookingDateInput.value;
  const clinicKeyInput = clinicSelect.value;
  const doctorNameInput = doctorSelect.value;
  const serviceTypeInput = serviceTypeSelect.value;
  const notesInput = document.getElementById("notes") ? document.getElementById("notes").value.trim() : "";

  if (nameInput.length < 3) {
    showError("يرجى إدخال اسم المريض بالكامل.");
    return;
  }

  const ageNum = Number(ageInput);
  if (isNaN(ageNum) || ageNum < 1 || ageNum > 110) {
    showError("يرجى إدخال سن صحيح.");
    return;
  }

  const phoneRegex = /^01[0125][0-9]{8}$/;
  if (!phoneRegex.test(phoneInput)) {
    showError("يرجى إدخال رقم هاتف مصري صحيح (11 رقماً).");
    return;
  }

  if (!dateInput) {
    showError("يرجى تحديد تاريخ الموعد.");
    return;
  }

  if (!clinicKeyInput || !serviceTypeInput) {
    showError("يرجى اختيار التخصص ونوع الخدمة.");
    return;
  }

  if (!doctorNameInput) {
    showError("لا يوجد طبيب متاح في اليوم والتخصص المحددين، يرجى تغيير التاريخ أو التخصص.");
    return;
  }

  // استخراج غرفة الأسنان تلقائياً
  let autoDentalRoom = "";
  if (clinicKeyInput === "dental") {
    const selectedDocObj = allDoctorsData.find((d) => d.doctor_name === doctorNameInput);
    autoDentalRoom = (selectedDocObj && selectedDocObj.room) ? selectedDocObj.room : "room_1";
  }

  submitBtn.disabled = true;
  loader.style.display = "block";
  responseMessage.style.display = "none";

  const payload = {
    patient_name: nameInput,
    age: ageNum,
    phone: phoneInput,
    booking_date: dateInput,
    clinic_key: clinicKeyInput,
    doctor_name: doctorNameInput,
    service_type: serviceTypeInput,
    dental_room: autoDentalRoom,
    notes: notesInput
  };

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    loader.style.display = "none";

    if (result.success) {
      modalName.textContent = payload.patient_name;
      modalDate.textContent = payload.booking_date;
      modalAge.textContent = `${payload.age} سنة`;
      modalPhone.textContent = payload.phone;
      modalClinic.textContent = CLINIC_LABELS[payload.clinic_key] || payload.clinic_key;
      modalService.textContent = SERVICE_LABELS[payload.service_type] || payload.service_type;
      modalMainMessage.textContent = result.message;

      // رقم هاتف العيادة المخصص للاستفسار
      const assignedPhone = CLINIC_PHONES[payload.clinic_key] || "01155298538";
      if (modalClinicPhone) {
        modalClinicPhone.textContent = assignedPhone;
      }

      if (payload.doctor_name) {
        modalDoctorRow.style.display = "flex";
        modalDoctor.textContent = payload.doctor_name;
      } else {
        modalDoctorRow.style.display = "none";
      }

      if (payload.clinic_key === "dental") {
        modalRoomRow.style.display = "flex";
        modalRoom.textContent = payload.dental_room === "room_1" ? "غرفة (1)" : "غرفة (2)";
      } else {
        modalRoomRow.style.display = "none";
      }

      if (result.queue_number && result.queue_number !== "-") {
        modalQueueRow.style.display = "flex";
        modalQueueNumber.textContent = result.queue_number;
      } else {
        modalQueueRow.style.display = "none";
      }

      bookingModal.style.display = "flex";
      bookingForm.reset();
      bookingDateInput.value = localDateString;
      doctorGroup.style.display = "none";
      autoRoomDisplayGroup.style.display = "none";
      serviceTypeGroup.style.display = "none";
      specialNotesGroup.style.display = "none";
    } else {
      showError(result.message || "تعذر إتمام الحجز، يرجى المحاولة لاحقاً.");
    }
  } catch (error) {
    loader.style.display = "none";
    showError("حدث خطأ في الاتصال بالشبكة، يرجى المحاولة لاحقاً.");
  } finally {
    submitBtn.disabled = false;
  }
});

function showError(msg) {
  responseMessage.style.display = "block";
  responseMessage.className = "response-card error";
  responseMessage.innerHTML = `❌ ${msg}`;
}

// 6. زر حفظ التذكرة كصورة للمريض
if (downloadTicketBtn) {
  downloadTicketBtn.addEventListener("click", () => {
    // إخفاء الأزرار مؤقتاً حتى لا تظهر داخل الصورة المحفوظة
    if (modalFooterSection) modalFooterSection.style.display = "none";

    html2canvas(printableTicket, {
      scale: 2, // دقة وجودة عالية
      backgroundColor: "#ffffff",
      useCORS: true
    }).then((canvas) => {
      if (modalFooterSection) modalFooterSection.style.display = "flex"; // إعادة إظهار الأزرار
      
      const link = document.createElement("a");
      const safePatientName = modalName.textContent.replace(/\s+/g, "_");
      link.download = `تذكرة_حجز_${safePatientName}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }).catch((err) => {
      if (modalFooterSection) modalFooterSection.style.display = "flex";
      alert("تعذر حفظ الصورة تلقائياً، يمكنك أخذ لقطة شاشة (Screenshot).");
    });
  });
}

// التحكم بالنوافذ المنبثقة
closeModalBtn.addEventListener("click", () => { bookingModal.style.display = "none"; });
bookingModal.addEventListener("click", (e) => { if (e.target === bookingModal) bookingModal.style.display = "none"; });

// جدول مواعيد الأطباء
openScheduleBtn.addEventListener("click", async () => {
  scheduleModal.style.display = "flex";
  scheduleLoader.style.display = "block";
  doctorsList.style.display = "none";
  doctorsList.innerHTML = "";

  try {
    const response = await fetch(`${SCRIPT_URL}?action=getDoctors`);
    const data = await response.json();

    scheduleLoader.style.display = "none";
    doctorsList.style.display = "block";

    if (data.success && data.doctors.length > 0) {
      data.doctors.forEach((doc) => {
        const docCard = document.createElement("div");
        docCard.className = "doctor-item";
        docCard.innerHTML = `
          <div class="doctor-header">
            <span class="doctor-name">👨‍⚕️ ${doc.doctor_name}</span>
            <span class="doctor-spec">${CLINIC_LABELS[doc.clinic_key] || doc.clinic_key}</span>
          </div>
          <div class="doctor-time">
            <span>📅 الأيام: ${doc.working_days || "غير محدد"}</span>
            <br>
            <span>⏰ المواعيد: ${doc.schedule_time || "حسب الحجز"}</span>
            ${doc.room ? `<br><span>🚪 الغرفة: ${doc.room === "room_1" ? "غرفة 1" : (doc.room === "room_2" ? "غرفة 2" : doc.room)}</span>` : ""}
          </div>
        `;
        doctorsList.appendChild(docCard);
      });
    } else {
      doctorsList.innerHTML = `<p style="text-align:center; color:#64748b;">لا توجد مواعيد مسجلة حالياً.</p>`;
    }
  } catch (err) {
    scheduleLoader.style.display = "none";
    doctorsList.style.display = "block";
    doctorsList.innerHTML = `<p style="text-align:center; color:#ef4444;">تعذر تحميل المواعيد.</p>`;
  }
});

closeScheduleBtn.addEventListener("click", () => { scheduleModal.style.display = "none"; });
scheduleModal.addEventListener("click", (e) => { if (e.target === scheduleModal) scheduleModal.style.display = "none"; });
