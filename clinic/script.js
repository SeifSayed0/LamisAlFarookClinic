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
  vascular: "أوعية دموية",
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

// عناصر الفورم
const bookingForm = document.getElementById("bookingForm");
const bookingDateInput = document.getElementById("booking_date");
const clinicSelect = document.getElementById("clinic_key");
const serviceTypeGroup = document.getElementById("serviceTypeGroup");
const serviceTypeSelect = document.getElementById("service_type");
const dentalRoomGroup = document.getElementById("dentalRoomGroup");
const dentalRoomSelect = document.getElementById("dental_room");
const specialNotesGroup = document.getElementById("specialNotesGroup");
const submitBtn = document.getElementById("submitBtn");
const loader = document.getElementById("loader");
const responseMessage = document.getElementById("responseMessage");

// عناصر كارت المودال
const bookingModal = document.getElementById("bookingModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalName = document.getElementById("modalName");
const modalDate = document.getElementById("modalDate");
const modalClinic = document.getElementById("modalClinic");
const modalService = document.getElementById("modalService");
const modalRoomRow = document.getElementById("modalRoomRow");
const modalRoom = document.getElementById("modalRoom");
const modalAge = document.getElementById("modalAge");
const modalPhone = document.getElementById("modalPhone");
const modalMainMessage = document.getElementById("modalMainMessage");
const modalQueueRow = document.getElementById("modalQueueRow");
const modalQueueNumber = document.getElementById("modalQueueNumber");

// عناصر جدول المواعيد
const openScheduleBtn = document.getElementById("openScheduleBtn");
const scheduleModal = document.getElementById("scheduleModal");
const closeScheduleBtn = document.getElementById("closeScheduleBtn");
const scheduleLoader = document.getElementById("scheduleLoader");
const doctorsList = document.getElementById("doctorsList");

// 1. ضبط الحد الأدنى للتاريخ في التقويم ليكون بدءاً من اليوم
const today = new Date().toISOString().split("T")[0];
bookingDateInput.min = today;
bookingDateInput.value = today;

// 2. تحديث قائمة الخدمات وغرف الأسنان بناءً على التخصص
clinicSelect.addEventListener("change", (e) => {
  const selectedClinic = e.target.value;
  serviceTypeSelect.innerHTML = "";
  serviceTypeGroup.style.display = "block";

  // إظهار/إخفاء غرفة الأسنان
  if (selectedClinic === "dental") {
    dentalRoomGroup.style.display = "block";
  } else {
    dentalRoomGroup.style.display = "none";
  }

  // توزيع الخدمات المتاحة حسب التخصص
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
    // باقي التخصصات العامة + النسا
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
});

serviceTypeSelect.addEventListener("change", checkSpecialPolicies);

function checkSpecialPolicies() {
  const clinic = clinicSelect.value;

  // يظهر التنبيه بمجرد اختيار العيادة النفسية
  if (clinic === "psychiatry") {
    specialAlertText.textContent = "⚠️ تنبيه: العيادات النفسية تتطلب الحجز والدفع المسبق لتأكيد الموعد.";
    specialNotesGroup.style.display = "block";
  } else {
    specialNotesGroup.style.display = "none";
  }
}

// 3. إرسال الحجز والتحقق
bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nameInput = document.getElementById("name").value.trim();
  const ageInput = document.getElementById("age").value.trim();
  const phoneInput = document.getElementById("phone").value.trim();
  const dateInput = bookingDateInput.value;
  const clinicKeyInput = clinicSelect.value;
  const serviceTypeInput = serviceTypeSelect.value;
  const dentalRoomInput = (clinicKeyInput === "dental") ? dentalRoomSelect.value : "";
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

  submitBtn.disabled = true;
  loader.style.display = "block";
  responseMessage.style.display = "none";

  const payload = {
    patient_name: nameInput,
    age: ageNum,
    phone: phoneInput,
    booking_date: dateInput,
    clinic_key: clinicKeyInput,
    service_type: serviceTypeInput,
    dental_room: dentalRoomInput,
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
      bookingDateInput.value = today;
      serviceTypeGroup.style.display = "none";
      dentalRoomGroup.style.display = "none";
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

// التحكم بالنوافذ المنبثقة (Modals)
closeModalBtn.addEventListener("click", () => { bookingModal.style.display = "none"; });
bookingModal.addEventListener("click", (e) => { if (e.target === bookingModal) bookingModal.style.display = "none"; });

// جلب جدول مواعيد الأطباء
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
            <span class="doctor-name">👨‍⚕️ ${doc.name}</span>
            <span class="doctor-spec">${doc.specialty}</span>
          </div>
          <div class="doctor-time">
            <span>⏰ ${doc.schedule}</span>
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
