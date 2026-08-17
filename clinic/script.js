const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw_ohcEeCWrLng7OCllyPK0h8rFA5pzfHoudgi6yeV_3ml3gWWqAwHCslynql4SwMGE6w/exec";
// خريطة لترجمة أسماء التخصصات للعربية داخل كارت الحجز
const CLINIC_LABELS = {
  dental: "أسنان",
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

// عناصر واجهة المستخدم الرئيسية
const clinicSelect = document.getElementById("clinic_key");
const specialNotesGroup = document.getElementById("specialNotesGroup");
const bookingForm = document.getElementById("bookingForm");
const submitBtn = document.getElementById("submitBtn");
const loader = document.getElementById("loader");
const responseMessage = document.getElementById("responseMessage");

// عناصر النافذة المنبثقة (Popup Modal)
const bookingModal = document.getElementById("bookingModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalName = document.getElementById("modalName");
const modalAge = document.getElementById("modalAge");
const modalPhone = document.getElementById("modalPhone");
const modalClinic = document.getElementById("modalClinic");
const modalMainMessage = document.getElementById("modalMainMessage");
const modalQueueRow = document.getElementById("modalQueueRow");
const modalQueueNumber = document.getElementById("modalQueueNumber");

// إظهار حقل الملاحظات والمواعيد للتخصصات الخاصة
clinicSelect.addEventListener("change", (e) => {
  const selectedKey = e.target.value;
  if (selectedKey === "psychiatry" || selectedKey === "nutrition") {
    specialNotesGroup.style.display = "block";
  } else {
    specialNotesGroup.style.display = "none";
  }
});

// إغلاق النافذة المنبثقة عند الضغط على زر الإغلاق
closeModalBtn.addEventListener("click", () => {
  bookingModal.style.display = "none";
});

// إغلاق النافذة المنبثقة عند الضغط على الخلفية المعتمة خارج الكارت
bookingModal.addEventListener("click", (e) => {
  if (e.target === bookingModal) {
    bookingModal.style.display = "none";
  }
});

// معالجة نموذج الحجز
bookingForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nameInput = document.getElementById("name").value.trim();
  const ageInput = document.getElementById("age").value.trim();
  const phoneInput = document.getElementById("phone").value.trim();
  const clinicKeyInput = clinicSelect.value;
  const notesInput = document.getElementById("notes") ? document.getElementById("notes").value.trim() : "";

  // 1. التحقق من صحة الاسم
  if (nameInput.length < 3) {
    showError("يرجى إدخال الاسم بالكامل بشكل صحيح.");
    return;
  }

  // 2. التحقق من صحة السن (بين سنة و 110 سنة)
  const ageNum = Number(ageInput);
  if (isNaN(ageNum) || ageNum < 1 || ageNum > 110) {
    showError("يرجى إدخال سن صحيح (بين 1 و 110).");
    return;
  }

  // 3. التحقق من صحة رقم الهاتف (11 رقم مصري يبدأ بـ 01)
  const phoneRegex = /^01[0125][0-9]{8}$/;
  if (!phoneRegex.test(phoneInput)) {
    showError("يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقماً (مثال: 01012345678).");
    return;
  }

  // 4. التحقق من اختيار التخصص
  if (!clinicKeyInput) {
    showError("يرجى اختيار التخصص المطلوب.");
    return;
  }

  // قفل الزر وإظهار التحميل لمنع الضغط المتكرر
  submitBtn.disabled = true;
  loader.style.display = "block";
  responseMessage.style.display = "none";

  const payload = {
    patient_name: nameInput,
    age: ageNum,
    phone: phoneInput,
    clinic_key: clinicKeyInput,
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
      // تعبئة بيانات الكارت المنبثق
      modalName.textContent = payload.patient_name;
      modalAge.textContent = `${payload.age} سنة`;
      modalPhone.textContent = payload.phone;
      modalClinic.textContent = CLINIC_LABELS[payload.clinic_key] || payload.clinic_key;
      modalMainMessage.textContent = result.message;

      // إظهار سطر رقم الدور إذا كان الحجز أسنان
      if (result.queue_number && result.queue_number !== "-") {
        modalQueueRow.style.display = "flex";
        modalQueueNumber.textContent = result.queue_number;
      } else {
        modalQueueRow.style.display = "none";
      }

      // إظهار النافذة المنبثقة
      bookingModal.style.display = "flex";

      // إعادة ضبط النموذج
      bookingForm.reset();
      specialNotesGroup.style.display = "none";
    } else {
      showError(result.message || "تعذر إتمام الحجز، يرجى المحاولة لاحقاً.");
    }
  } catch (error) {
    loader.style.display = "none";
    showError("حدث خطأ في الاتصال بالشبكة، يرجى المحاولة مرة أخرى.");
  } finally {
    submitBtn.disabled = false;
  }
});

// دالة عرض رسائل الخطأ
function showError(msg) {
  responseMessage.style.display = "block";
  responseMessage.className = "response-card error";
  responseMessage.innerHTML = `❌ ${msg}`;
}

// عناصر نافذة جدول الأطباء
const openScheduleBtn = document.getElementById("openScheduleBtn");
const scheduleModal = document.getElementById("scheduleModal");
const closeScheduleBtn = document.getElementById("closeScheduleBtn");
const scheduleLoader = document.getElementById("scheduleLoader");
const doctorsList = document.getElementById("doctorsList");

// فتح النافذة وجلب البيانات من الشيت
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
    doctorsList.innerHTML = `<p style="text-align:center; color:#ef4444;">تعذر تحميل المواعيد، يرجى المحاولة لاحقاً.</p>`;
  }
});

// إغلاق نافذة المواعيد
closeScheduleBtn.addEventListener("click", () => {
  scheduleModal.style.display = "none";
});

scheduleModal.addEventListener("click", (e) => {
  if (e.target === scheduleModal) {
    scheduleModal.style.display = "none";
  }
});