// ========================================
// ADMIN OBJECT
// ========================================

const ADMIN_CREDENTIAL = {
  username: "admin",
  password: "qlcl@123", // đổi mật khẩu mặc định
};

const admin = {
  auth: false,
  selected: [],
  editId: null,
  filteredData: [], // Biến lưu trữ dữ liệu đang hiển thị để xuất Excel

  // Toggle between public and admin view
  async toggleView() {
    if (this.auth) {
      // Đang ở Public -> Vào Admin
      app.showAdmin();
      await this.refresh();
    } else {
      // Chưa đăng nhập -> Hiện Modal
      document.getElementById("loginModal").classList.remove("hidden");
    }
  },

  // Handle login
  handleLogin(event) {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();
    const remember = document.getElementById("rememberLogin").checked;

    if (
      username === ADMIN_CREDENTIAL.username &&
      password === ADMIN_CREDENTIAL.password
    ) {
      this.auth = true;

      // Nếu tick ghi nhớ thì lưu vào localStorage
      if (remember) {
        localStorage.setItem("BYT_ADMIN_AUTH", "true");
      } else {
        localStorage.removeItem("BYT_ADMIN_AUTH");
      }

      this.closeLogin();
      this.toggleView();
    } else {
      document.getElementById("loginError").classList.remove("hidden");
    }
  },

  closeLogin() {
    document.getElementById("loginModal").classList.add("hidden");
    document.getElementById("loginError").classList.add("hidden");
  },

  logout() {
    this.auth = false;
    localStorage.removeItem("BYT_ADMIN_AUTH");
    app.showPublic();
  },

  // Config Modal
  openConfig() {
    document.getElementById("scriptUrlInput").value = APPS_SCRIPT_URL;
    document.getElementById("configModal").classList.remove("hidden");
  },

  saveConfig() {
    APPS_SCRIPT_URL = document.getElementById("scriptUrlInput").value.trim();
    localStorage.setItem("BYT_SCRIPT_URL", APPS_SCRIPT_URL);
    document.getElementById("configModal").classList.add("hidden");
    app.showToast("Thành công", "Đã lưu cấu hình Google Sheets");
  },

  // Session Config Modal
  openSessionConfig() {
    if (SESSION_CONFIG) {
      document.getElementById("session-interviewer").value =
        SESSION_CONFIG.interviewer;
      document.getElementById("session-respondent").value =
        SESSION_CONFIG.respondent;
    }
    document.getElementById("sessionModal").classList.remove("hidden");
  },

  saveSessionConfig() {
    const interviewer = document
      .getElementById("session-interviewer")
      .value.trim();
    const respondent = document.getElementById("session-respondent").value;

    if (!interviewer || !respondent) {
      alert("Vui lòng nhập đủ thông tin!");
      return;
    }

    SESSION_CONFIG = { interviewer, respondent };
    localStorage.setItem("BYT_SESSION_CONFIG", JSON.stringify(SESSION_CONFIG));
    document.getElementById("sessionModal").classList.add("hidden");
    app.updateSessionUI();
    app.showToast("Thành công", "Đã lưu cấu hình phiên làm việc");
  },

  // Refresh data
  async refresh() {
    this.selected = [];
    const tbody = document.getElementById("adminTableBody");
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center p-4 text-gray-500">Đang tải dữ liệu từ Sheet...</td></tr>';

    try {
      const data = await db.getAll(true);
      this.renderStats(data);
      this.filterTable(); // Gọi filter để tính toán filteredData và render
      this.updateBulkUI();
    } catch (error) {
      tbody.innerHTML =
        '<tr><td colspan="7" class="text-center p-4 text-red-500">Lỗi: ' +
        error.message +
        "</td></tr>";
    }
  },

  // Render statistics
  renderStats(data) {
    document.getElementById("stat-total").textContent = data.length;

    const form1Count = data.filter((d) => d.type === "form1").length;
    const form2Count = data.filter((d) => d.type === "form2").length;

    document.getElementById("stat-form1").textContent = form1Count;
    document.getElementById("stat-form2").textContent = form2Count;

    let sum = 0;
    let count = 0;

    data.forEach((record) => {
      if (record.python_data) {
        try {
          const pythonData = JSON.parse(record.python_data);
          const g1 = parseInt(pythonData.G1);
          if (!isNaN(g1) && g1 > 0) {
            sum += g1;
            count++;
          }
        } catch (e) {
          // Skip invalid data
        }
      }
    });

    const avg = count > 0 ? (sum / count).toFixed(1) : "0.0";
    document.getElementById("stat-avg").textContent = avg + "%";
  },

  // ===============================================
  // FILTER TABLE (LOGIC MỚI: GỘP TẤT CẢ BỘ LỌC)
  // ===============================================
  filterTable() {
    const searchText = document
      .getElementById("searchInput")
      .value.toLowerCase();
    const formType = document.getElementById("filterFormType").value;
    const dateFrom = document.getElementById("filterDateFrom").value;
    const dateTo = document.getElementById("filterDateTo").value;

    // Lọc dữ liệu từ cache
    this.filteredData = db.cache.filter((record) => {
      // 1. Lọc Loại phiếu
      const matchesType = formType === "all" || record.type === formType;

      // 2. Lọc Tìm kiếm (Mã phiếu, ID...)
      const matchesSearch =
        !searchText ||
        JSON.stringify(record).toLowerCase().includes(searchText);

      // 3. Lọc Thời gian
      let matchesDate = true;
      if (dateFrom || dateTo) {
        const recordDate = new Date(record.timestamp);
        recordDate.setHours(0, 0, 0, 0); // Reset giờ phút giây để so sánh ngày chuẩn

        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          fromDate.setHours(0, 0, 0, 0);
          if (recordDate < fromDate) matchesDate = false;
        }

        if (dateTo && matchesDate) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999); // Tính hết ngày đó
          if (recordDate > toDate) matchesDate = false;
        }
      }

      return matchesType && matchesSearch && matchesDate;
    });

    // Render dữ liệu đã lọc
    this.renderTable(this.filteredData);
  },

  // Render table
  renderTable(data) {
    const tbody = document.getElementById("adminTableBody");
    const emptyState = document.getElementById("empty-state");

    tbody.innerHTML = "";

    if (!data || data.length === 0) {
      emptyState.classList.remove("hidden");
      return;
    }

    emptyState.classList.add("hidden");

    data.forEach((record) => {
      const tr = document.createElement("tr");
      tr.className = "hover:bg-gray-50 border-b";

      const status = record.selenium_status || "READY";
      const statusColor =
        status === "DONE"
          ? "bg-green-100 text-green-700"
          : "bg-yellow-100 text-yellow-700";

      let score = "N/A";
      if (record.python_data) {
        try {
          const pythonData = JSON.parse(record.python_data);
          score = pythonData.G1 ? pythonData.G1 + "%" : "N/A";
        } catch (e) {}
      }

      let dept =
        record["5. Khoa nằm điều trị trước ra viện"] ||
        record["Khoa điều trị ngoại trú"] ||
        record["Khoa phòng của nhân viên"] ||
        "";

      const checked = this.selected.includes(record.id) ? "checked" : "";

      tr.innerHTML = `
                <td class="p-4 text-center">
                    <input type="checkbox" ${checked} onchange="admin.toggle('${record.id}')" 
                        class="w-4 h-4 rounded text-teal-600">
                </td>
                <td class="p-4">
                    <div class="font-bold text-gray-900">${record["Mã số phiếu (BV quy định)"] || record.id}</div>
                    <div class="text-xs text-gray-400">${new Date(record.timestamp).toLocaleString("vi-VN")}</div>
                </td>
                <td class="p-4">
                    <div class="text-sm truncate max-w-[150px]">${dept}</div>
                </td>
                <td class="p-4">
                    <span class="bg-gray-100 text-xs px-2 py-1 rounded font-bold text-gray-600">
                        ${record.type || "N/A"}
                    </span>
                </td>
                <td class="p-4 text-center">
                    <span class="${statusColor} text-xs px-2 py-1 rounded font-bold">${status}</span>
                </td>
                <td class="p-4 text-center font-bold text-teal-600">${score}</td>
                <td class="p-4 text-right">
                    <button onclick="admin.openEditModal('${record.id}')" 
                        class="text-blue-400 hover:text-blue-600 p-2" title="Sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="admin.del('${record.id}')" 
                        class="text-red-400 hover:text-red-600 p-2" title="Xóa">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;

      tbody.appendChild(tr);
    });
  },

  // Toggle selection
  toggle(id) {
    const index = this.selected.indexOf(id);
    if (index > -1) {
      this.selected.splice(index, 1);
    } else {
      this.selected.push(id);
    }
    this.updateBulkUI();
  },

  // Toggle select all
  toggleSelectAll() {
    const checked = document.getElementById("selectAll").checked;
    if (checked) {
      // Chỉ chọn các mục ĐANG HIỂN THỊ (Đã lọc)
      this.selected = this.filteredData.map((record) => record.id);
    } else {
      this.selected = [];
    }
    this.filterTable(); // Re-render để update checkbox UI
    this.updateBulkUI();
  },

  // Update bulk UI
  updateBulkUI() {
    const count = this.selected.length;
    document.getElementById("selected-count").textContent = count;
    document.getElementById("bulk-actions").style.display =
      count > 0 ? "flex" : "none";
  },

  // Delete single record
  async del(id) {
    if (!confirm("Xóa phiếu này?")) return;

    try {
      await db.delete([id]);
      app.showToast("Thành công", "Đã xóa phiếu");
      await this.refresh();
    } catch (error) {
      app.showToast("Lỗi", "Không thể xóa: " + error.message, "error");
    }
  },

  // Delete bulk
  async deleteBulk() {
    if (!confirm(`Xóa ${this.selected.length} phiếu đã chọn?`)) return;

    try {
      await db.delete(this.selected);
      app.showToast("Thành công", `Đã xóa ${this.selected.length} phiếu`);
      await this.refresh();
    } catch (error) {
      app.showToast("Lỗi", "Không thể xóa: " + error.message, "error");
    }
  },

  // Open bulk edit modal
  openBulkEdit() {
    document.getElementById("bulk-edit-count").textContent =
      this.selected.length;
    document.getElementById("bulkEditModal").classList.remove("hidden");
  },

  // Set bulk score
  setBulkScore(score) {
    document.getElementById("bulk-score-val").value = score;
    document.querySelectorAll(".bulk-btn").forEach((btn) => {
      btn.classList.remove("active");
    });
    event.target.classList.add("active");
  },

  // Apply bulk edit
  async applyBulkEdit() {
    const section = document.getElementById("bulk-section").value;
    const score = document.getElementById("bulk-score-val").value;

    if (
      !confirm(
        `Sửa điểm thành ${score} cho ${section === "all" ? "toàn bộ câu hỏi" : "nhóm " + section} của ${this.selected.length} phiếu?`,
      )
    ) {
      return;
    }

    try {
      const recordsToUpdate = db.cache.filter((r) =>
        this.selected.includes(r.id),
      );
      const updates = {};

      recordsToUpdate.forEach((record) => {
        if (!record.python_data) return;
        try {
          const pythonData = JSON.parse(record.python_data);
          const formType = record.type;
          const formStruct =
            formType === "form1"
              ? form1Structure
              : formType === "form2"
                ? form2Structure
                : form3Structure;

          formStruct.sections.forEach((sect) => {
            const sectionLetter = sect.title.split(".")[0].trim();
            if (section === "all" || section === sectionLetter) {
              sect.questions.forEach((q) => {
                if (!q.isCost) {
                  pythonData[q.id] = score;
                }
              });
            }
          });

          if (!updates[record.id]) updates[record.id] = {};
          updates[record.id]["python_data"] = JSON.stringify(pythonData);
        } catch (e) {
          console.error("Error updating record:", e);
        }
      });

      const updatePromises = Object.entries(updates).map(([id, upd]) => {
        return db.update([id], upd);
      });

      await Promise.all(updatePromises);

      document.getElementById("bulkEditModal").classList.add("hidden");
      app.showToast("Thành công", `Đã cập nhật ${this.selected.length} phiếu`);
      await this.refresh();
    } catch (error) {
      app.showToast("Lỗi", "Không thể cập nhật: " + error.message, "error");
    }
  },

  // ============================================
  // EXPORT EXCEL LOGIC (TRỰC TIẾP)
  // ============================================

  exportExcel() {
    // 1. Xác định dữ liệu cần xuất
    // Nếu có chọn checkbox -> Chỉ xuất dòng chọn
    // Nếu KHÔNG chọn gì -> Xuất toàn bộ bảng đang hiển thị (đã lọc)
    let dataToExport = [];

    if (this.selected.length > 0) {
      // Lấy theo ID đã chọn từ bộ nhớ cache
      dataToExport = db.cache.filter((record) =>
        this.selected.includes(record.id),
      );
    } else {
      // Lấy theo dữ liệu đang hiển thị (đã qua bộ lọc ngày, search...)
      dataToExport = this.filteredData;
    }

    if (!dataToExport || dataToExport.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    // 2. Format dữ liệu (Xóa cột hệ thống)
    const cleanData = dataToExport.map((item) => {
      // Destructure để loại bỏ các trường hệ thống không cần thiết
      const { python_data, selenium_status, ...rest } = item;
      return rest;
    });

    try {
      // 3. Tạo Workbook
      const worksheet = XLSX.utils.json_to_sheet(cleanData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "DuLieuKhaoSat");

      // 4. Tạo tên file (thêm ngày tháng)
      const dateStr = new Date().toISOString().slice(0, 10);
      const count = cleanData.length;
      const fileName = `BaoCao_KhaoSat_BVPS_${dateStr}_(${count}_phieu).xlsx`;

      // 5. Tải xuống
      XLSX.writeFile(workbook, fileName);
      app.showToast("Thành công", `Đã xuất ${count} phiếu ra Excel`);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi tạo file Excel: " + e.message);
    }
  },

  // ============================================
  // EDIT MODAL: XỬ LÝ SỬA TOÀN BỘ (FULL EDIT)
  // ============================================

  // Open edit modal for single record
  openEditModal(id) {
    this.editId = String(id); // Force string ID
    const record = db.cache.find((r) => String(r.id) === String(id));

    if (!record || !record.python_data) {
      alert("Không tìm thấy dữ liệu phiếu");
      return;
    }

    try {
      const pythonData = JSON.parse(record.python_data);

      document.getElementById("edit-id-display").textContent =
        record["Mã số phiếu (BV quy định)"] || id;

      this.renderEditForm(pythonData, record.type);
      document.getElementById("editRecordModal").classList.remove("hidden");
    } catch (e) {
      alert("Lỗi khi đọc dữ liệu: " + e.message);
    }
  },

  // Render edit form (Đầy đủ: Hành chính, Câu hỏi, Footer)
  renderEditForm(pythonData, formType) {
    const container = document.getElementById("edit-form-container");
    container.innerHTML = "";

    const formStruct =
      formType === "form1"
        ? form1Structure
        : formType === "form2"
          ? form2Structure
          : form3Structure;

    // --- 1. Render Thông tin Hành chính ---
    const demoDiv = document.createElement("div");
    demoDiv.className =
      "mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200";
    demoDiv.innerHTML = `<h3 class="font-bold text-teal-700 mb-4 border-b pb-2">I. THÔNG TIN HÀNH CHÍNH</h3>`;
    const demoGrid = document.createElement("div");
    demoGrid.className = "grid grid-cols-1 md:grid-cols-2 gap-4";

    formStruct.demographics.forEach((field) => {
      const val = pythonData[field.id] || "";
      const fieldHtml = this.renderInputControl(field, val);
      const wrapper = document.createElement("div");
      wrapper.className =
        field.width === "full" ? "col-span-1 md:col-span-2" : "col-span-1";
      wrapper.innerHTML = fieldHtml;
      demoGrid.appendChild(wrapper);
    });
    demoDiv.appendChild(demoGrid);
    container.appendChild(demoDiv);

    // --- 2. Render Câu hỏi (Sections) ---
    // Mẫu 3 ẩn điểm 0
    const scoreValues =
      formType === "form3" ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 0];

    formStruct.sections.forEach((section) => {
      const sectionDiv = document.createElement("div");
      sectionDiv.className =
        "mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200";
      sectionDiv.innerHTML = `<h3 class="font-bold text-gray-800 mb-3 bg-gray-50 p-2 rounded">${section.title}</h3>`;

      section.questions.forEach((question) => {
        const questionDiv = document.createElement("div");
        questionDiv.className = "mb-4 pb-4 border-b last:border-0";

        const value = pythonData[question.id] || "";

        // Logic tô màu cảnh báo điểm thấp (chỉ dùng để hiển thị container)
        const isLow =
          !question.isCost && parseInt(value) <= 3 && parseInt(value) > 0;
        const bgClass = isLow ? "bg-red-50 border border-red-200" : "";

        let inputHTML = "";

        if (question.isCost) {
          // Câu hỏi chi phí (Giả lập Radio)
          const fakeField = {
            id: question.id,
            label: question.text,
            type: "radio",
            options: [
              "1. Rất đắt so với chất lượng",
              "2. Đắt hơn so với chất lượng",
              "3. Tương xứng so với chất lượng",
              "4. Rẻ hơn so với chất lượng",
              "5. Không tự chi trả nên không biết",
              "6. Ý kiến khác",
            ],
          };
          inputHTML = this.renderInputControl(fakeField, value, true);
        } else {
          // === SỬA CHỮA CHÍNH: Cấu trúc Peer-Checked cho nút điểm số ===
          inputHTML = `
                <div class="flex flex-wrap gap-2 mt-2">
                    ${scoreValues
                      .map((v) => {
                        const isChecked = value == v ? "checked" : "";
                        // Tạo ID duy nhất cho mỗi nút để Label hoạt động
                        const uniqueId = `edit_${question.id}_${v}`;

                        // Màu mặc định
                        let baseColor =
                          "bg-gray-100 text-gray-600 hover:bg-gray-200";

                        // Màu khi được chọn (Active)
                        let activeColor =
                          "peer-checked:bg-teal-600 peer-checked:text-white peer-checked:border-teal-600 peer-checked:ring-2 peer-checked:ring-teal-200";

                        // Nếu là điểm thấp (1-3), đổi màu active sang đỏ
                        if (v <= 3 && v > 0) {
                          activeColor =
                            "peer-checked:bg-red-500 peer-checked:text-white peer-checked:border-red-500 peer-checked:ring-2 peer-checked:ring-red-200";
                        }

                        return `
                            <div class="relative">
                                <input type="radio" name="edit_${question.id}" id="${uniqueId}" value="${v}" ${isChecked} class="peer hidden">
                                <label for="${uniqueId}" 
                                    class="w-10 h-10 rounded-full flex items-center justify-center font-bold cursor-pointer transition-all border border-transparent select-none ${baseColor} ${activeColor}">
                                    ${v}
                                </label>
                            </div>
                        `;
                      })
                      .join("")}
                </div>
            `;
        }

        questionDiv.innerHTML = `
                    <div class="${bgClass} p-2 rounded transition-colors duration-300">
                        <div class="font-medium text-sm text-gray-700 mb-1">
                            <span class="font-bold text-teal-600 mr-1">${question.id}:</span> ${question.text}
                        </div>
                        ${inputHTML}
                    </div>
                `;

        sectionDiv.appendChild(questionDiv);
      });

      container.appendChild(sectionDiv);
    });

    // --- 3. Render Footer ---
    const footerDiv = document.createElement("div");
    footerDiv.className =
      "mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200";
    footerDiv.innerHTML = `<h3 class="font-bold text-teal-700 mb-4 border-b pb-2">THÔNG TIN KHÁC</h3>`;
    const footerStack = document.createElement("div");
    footerStack.className = "space-y-4";

    formStruct.footer.forEach((field) => {
      const val = pythonData[field.id] || "";
      const fieldHtml = this.renderInputControl(field, val);
      const wrapper = document.createElement("div");
      wrapper.innerHTML = fieldHtml;
      footerStack.appendChild(wrapper);
    });
    footerDiv.appendChild(footerStack);
    container.appendChild(footerDiv);
  },

  // Helper: Sinh HTML input control cho Edit Form
  renderInputControl(field, currentValue, hideLabel = false) {
    const name = `edit_${field.id}`;
    let html = "";

    if (!hideLabel) {
      html += `<label class="block text-xs font-bold text-gray-500 mb-1 uppercase">${field.label || field.text}</label>`;
    }

    switch (field.type) {
      case "select":
        html += `<select name="${name}" class="w-full border p-2 rounded text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none">
                <option value="">-- Chọn --</option>
                ${field.options
                  .map(
                    (opt) =>
                      // So sánh lỏng (==) để bắt cả số và chuỗi
                      `<option value="${opt}" ${opt == currentValue ? "selected" : ""}>${opt}</option>`,
                  )
                  .join("")}
            </select>`;
        break;

      case "radio":
        // Dùng native radio style nhưng bọc kỹ để dễ click
        html += `<div class="space-y-2 mt-1">
                ${field.options
                  .map((opt, index) => {
                    const uniqueId = `${name}_opt_${index}`; // ID duy nhất cho label for
                    return `
                        <div class="flex items-center">
                            <input type="radio" id="${uniqueId}" name="${name}" value="${opt}" ${opt == currentValue ? "checked" : ""} 
                                class="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500 cursor-pointer">
                            <label for="${uniqueId}" class="ml-2 block text-sm text-gray-700 cursor-pointer select-none">
                                ${opt}
                            </label>
                        </div>
                      `;
                  })
                  .join("")}
            </div>`;
        break;

      case "textarea":
        html += `<textarea name="${name}" rows="3" class="w-full border p-2 rounded text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none">${currentValue}</textarea>`;
        break;

      default:
        html += `<input type="${field.type || "text"}" name="${name}" value="${currentValue}" class="w-full border p-2 rounded text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-teal-500 outline-none">`;
        break;
    }
    return html;
  },

  // Save single edit (Toàn bộ)
  async saveSingleEdit() {
    if (!this.editId) return;

    const record = db.cache.find((r) => String(r.id) === String(this.editId));
    if (!record) {
      alert("Lỗi: Không tìm thấy bản ghi gốc!");
      return;
    }

    try {
      let pythonData = {};
      try {
        pythonData = JSON.parse(record.python_data);
      } catch (e) {
        pythonData = {};
      }

      const formStruct =
        record.type === "form1"
          ? form1Structure
          : record.type === "form2"
            ? form2Structure
            : form3Structure;

      const modalContainer = document.getElementById("edit-form-container");

      // Helper lấy giá trị từ input
      const getValue = (fieldId, type) => {
        const name = `edit_${fieldId}`;
        if (type === "radio") {
          const el = modalContainer.querySelector(
            `input[name="${name}"]:checked`,
          );
          return el ? el.value : "";
        } else {
          const el = modalContainer.querySelector(`[name="${name}"]`);
          // Fallback nếu là radio
          if (el && el.type === "radio") {
            const checked = modalContainer.querySelector(
              `input[name="${name}"]:checked`,
            );
            return checked ? checked.value : "";
          }
          return el ? el.value : "";
        }
      };

      // === 1. TẠO OBJECT UPDATE ===
      // python_data: chứa JSON để load lại form sau này
      // Các key khác: chứa tên cột hiển thị trên Google Sheet
      const updates = {};

      // --- A. Cập nhật Demographics (Hành chính) ---
      formStruct.demographics.forEach((field) => {
        const val = getValue(field.id, field.type);
        pythonData[field.id] = val; // Lưu vào JSON

        // Lưu vào cột Excel (dựa trên label)
        // Ví dụ: field.label = "A1. Giới tính" -> updates["A1. Giới tính"] = "2. Nữ"
        if (field.label) {
          updates[field.label] = val;
        }
      });

      // --- B. Cập nhật Sections (Câu hỏi) ---
      formStruct.sections.forEach((section) => {
        section.questions.forEach((q) => {
          const val = getValue(q.id, "radio");
          pythonData[q.id] = val; // Lưu vào JSON

          // Lưu vào cột Excel (dựa trên mapToHeaders)
          // Một câu hỏi code S_A1 có thể map ra cột "A1. Các sơ đồ..."
          if (q.mapToHeaders && Array.isArray(q.mapToHeaders)) {
            q.mapToHeaders.forEach((header) => {
              updates[header] = val;
            });
          }
        });
      });

      // --- C. Cập nhật Footer ---
      formStruct.footer.forEach((field) => {
        const val = getValue(field.id, field.type);
        pythonData[field.id] = val; // Lưu vào JSON

        if (field.label) {
          updates[field.label] = val;
        }
      });

      // Đưa JSON đã update vào object gửi đi
      updates["python_data"] = JSON.stringify(pythonData);

      // === 2. GỬI LÊN SERVER ===
      await db.update([this.editId], updates);

      document.getElementById("editRecordModal").classList.add("hidden");
      app.showToast("Thành công", "Đã cập nhật dữ liệu Google Sheet");
      await this.refresh();
    } catch (error) {
      console.error(error);
      app.showToast("Lỗi", "Không thể cập nhật: " + error.message, "error");
    }
  },
};

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const savedAuth = localStorage.getItem("BYT_ADMIN_AUTH");

  if (savedAuth === "true") {
    admin.auth = true;
  }

  app.init();
});
