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

  // Biến dùng cho việc cấu hình phiên 3 mẫu
  tempSessionData: null,
  currentSessionTab: "form1",

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

  // ============================================
  // SESSION CONFIG MODAL (Đã chia 3 mẫu)
  // ============================================

  openSessionConfig() {
    // Clone cấu hình hiện tại để chỉnh sửa tạm thời
    if (!SESSION_CONFIG) {
      SESSION_CONFIG = {
        form1: { kieu_khao_sat: "", nguoipv: "", nguoi_tra_loi: "" },
        form2: { kieu_khao_sat: "", nguoipv: "", nguoi_tra_loi: "" },
        form3: { kieu_khao_sat: "" },
      };
    }
    this.tempSessionData = JSON.parse(JSON.stringify(SESSION_CONFIG));

    document.getElementById("sessionModal").classList.remove("hidden");
    this.switchSessionTab("form1"); // Mở tab 1 mặc định
  },

  switchSessionTab(formId) {
    // 1. Lưu data của tab hiện tại trước khi chuyển (nếu đang bật UI)
    this.saveCurrentTabToTemp();

    // 2. Đổi active UI tab
    ["form1", "form2", "form3"].forEach((id) => {
      const btn = document.getElementById(`tab-${id}`);
      if (id === formId) {
        btn.classList.add("bg-white", "shadow", "text-teal-700");
        btn.classList.remove("text-gray-500", "hover:text-gray-700");
      } else {
        btn.classList.remove("bg-white", "shadow", "text-teal-700");
        btn.classList.add("text-gray-500", "hover:text-gray-700");
      }
    });

    this.currentSessionTab = formId;

    // 3. Render các input cho tab được chọn
    const container = document.getElementById("session-fields-container");
    container.innerHTML = "";

    // Lấy options gốc từ formStructure để render Dropdown
    const struct =
      formId === "form1"
        ? form1Structure
        : formId === "form2"
          ? form2Structure
          : form3Structure;
    const data = this.tempSessionData[formId];

    // Kiểu khảo sát (Cả 3 mẫu đều có)
    container.appendChild(
      this.createSessionSelect(
        struct.demographics.find((f) => f.id === "kieu_khao_sat"),
        data.kieu_khao_sat,
      ),
    );

    // Người PV & Người TL (Chỉ Mẫu 1 và Mẫu 2)
    if (formId !== "form3") {
      container.appendChild(
        this.createSessionSelect(
          struct.demographics.find((f) => f.id === "nguoipv"),
          data.nguoipv,
        ),
      );
      container.appendChild(
        this.createSessionSelect(
          struct.demographics.find((f) => f.id === "nguoi_tra_loi"),
          data.nguoi_tra_loi,
        ),
      );
    }
  },

  createSessionSelect(fieldObj, currentValue) {
    const div = document.createElement("div");
    let optionsHtml = `<option value="">-- Bỏ trống (Người dùng tự điền) --</option>`;
    fieldObj.options.forEach((opt) => {
      optionsHtml += `<option value="${opt}" ${opt === currentValue ? "selected" : ""}>${opt}</option>`;
    });

    div.innerHTML = `
      <label class="block text-sm font-medium mb-1">${fieldObj.label}</label>
      <select id="ses_${fieldObj.id}" class="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none bg-white text-sm">
        ${optionsHtml}
      </select>
    `;
    return div;
  },

  saveCurrentTabToTemp() {
    if (!this.tempSessionData) return;
    const tab = this.currentSessionTab;

    const kieuEl = document.getElementById("ses_kieu_khao_sat");
    if (kieuEl) this.tempSessionData[tab].kieu_khao_sat = kieuEl.value;

    if (tab !== "form3") {
      const pvEl = document.getElementById("ses_nguoipv");
      const tlEl = document.getElementById("ses_nguoi_tra_loi");
      if (pvEl) this.tempSessionData[tab].nguoipv = pvEl.value;
      if (tlEl) this.tempSessionData[tab].nguoi_tra_loi = tlEl.value;
    }
  },

  async saveSessionConfig() {
    // 1. Cập nhật input đang hiển thị vào object temp trước
    this.saveCurrentTabToTemp();

    try {
      app.showToast("Đang xử lý", "Đang lưu cấu hình lên máy chủ...");

      // 2. Gửi cục JSON lên Google Sheet
      await db.call("saveConfig", {
        data: this.tempSessionData,
      });

      // 3. Nếu thành công, ghi đè biến toàn cục và cache
      SESSION_CONFIG = JSON.parse(JSON.stringify(this.tempSessionData));
      localStorage.setItem(
        "BYT_SESSION_CONFIG",
        JSON.stringify(SESSION_CONFIG),
      );

      document.getElementById("sessionModal").classList.add("hidden");
      app.updateSessionUI(); // Cập nhật Sidebar Admin
      app.showToast("Thành công", "Đã lưu cấu hình phiên cho các mẫu!");
    } catch (error) {
      console.error(error);
      alert("Lỗi khi lưu lên Google Sheet: " + error.message);
    }
  },

  // ============================================
  // CÁC HÀM QUẢN LÝ DỮ LIỆU & BẢNG
  // ============================================

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
  // EXPORT EXCEL LOGIC (NEW: WITH CHOICE MODAL)
  // ============================================

  exportExcel() {
    // Step 1: Just show the choice modal. The real work happens in handleExportChoice.
    document.getElementById("exportChoiceModal").classList.remove("hidden");
    document.getElementById("exportSheetSelect").value = ""; // Reset dropdown
  },

  handleExportChoice() {
    const selectedSheet = document.getElementById("exportSheetSelect").value;
    if (!selectedSheet) {
      alert("Vui lòng chọn một mẫu để xuất.");
      return;
    }

    // Hide the modal
    document.getElementById("exportChoiceModal").classList.add("hidden");

    // 1. Filter the entire DB cache for the selected form type
    const dataToExport = db.cache.filter(
      (record) => record.type === selectedSheet,
    );

    if (dataToExport.length === 0) {
      alert(`Mẫu "${selectedSheet}" không có dữ liệu để xuất.`);
      return;
    }

    // 2. Clean the data: remove system columns using destructuring
    const cleanData = dataToExport.map((item) => {
      const {
        id,
        timestamp,
        type,
        python_data,
        selenium_status,
        ...rest // 'rest' will contain all other properties
      } = item;
      return rest; // Return only the 'rest' object
    });

    // 3. Create workbook and sheet
    try {
      const worksheet = XLSX.utils.json_to_sheet(cleanData);
      const workbook = XLSX.utils.book_new();

      const sheetNameMap = {
        form1: "Mẫu 1 - Nội Trú",
        form2: "Mẫu 2 - Ngoại Trú",
        form3: "Mẫu 3 - Nhân Viên",
      };
      const sheetName = sheetNameMap[selectedSheet] || "Data";

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // 4. Generate filename and download
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `BaoCao_${sheetName.replace(" - ", "_")}_${dateStr}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      app.showToast(
        "Thành công",
        `Đã xuất ${cleanData.length} phiếu của ${sheetName}.`,
      );
    } catch (e) {
      console.error(e);
      app.showToast("Lỗi", "Không thể tạo file Excel: " + e.message, "error");
    }
  },

  // ============================================
  // EDIT MODAL: XỬ LÝ SỬA TOÀN BỘ (FULL EDIT)
  // ============================================

  openEditModal(id) {
    this.editId = String(id); // Force string ID
    const record = db.cache.find((r) => String(r.id) === String(id));

    if (!record) {
      alert("Không tìm thấy dữ liệu phiếu");
      return;
    }

    try {
      document.getElementById("edit-id-display").textContent =
        record["Mã số phiếu (BV quy định)"] || id;

      this.renderEditForm(record); // Pass the entire record object
      document.getElementById("editRecordModal").classList.remove("hidden");
    } catch (e) {
      alert("Lỗi khi đọc dữ liệu: " + e.message);
    }
  },

  renderEditForm(record) {
    const container = document.getElementById("edit-form-container");
    container.innerHTML = "";

    // Combine python_data with the main record for easy access
    const recordData = { ...record, ...JSON.parse(record.python_data || "{}") };
    const formType = record.type;

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
      const val = recordData[field.id] || "";
      const fieldHtml = this.renderInputControl(field, val);
      const wrapper = document.createElement("div");
      wrapper.className =
        field.width === "full" ? "col-span-1 md:col-span-2" : "col-span-1";
      wrapper.innerHTML = fieldHtml;
      demoGrid.appendChild(wrapper);
    });
    demoDiv.appendChild(demoGrid);
    container.appendChild(demoDiv);

    // --- 2. Render **DETAILED** Questions (Sections) ---
    formStruct.sections.forEach((section) => {
      const sectionDiv = document.createElement("div");
      sectionDiv.className =
        "mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200";
      sectionDiv.innerHTML = `<h3 class="font-bold text-gray-800 mb-3 bg-gray-50 p-2 rounded">${section.title}</h3>`;

      // Loop through summary questions to get to the detailed headers
      section.questions.forEach((summaryQuestion) => {
        // Now, loop through the detailed headers for each summary question
        summaryQuestion.mapToHeaders.forEach((detailedHeader) => {
          const questionDiv = document.createElement("div");
          questionDiv.className =
            "mb-4 pb-4 border-b last:border-b-0 last:pb-0 last:mb-0";

          // Get the value from the main record, which corresponds to the Sheet column
          const value = recordData[detailedHeader] || "";

          const isLow =
            !summaryQuestion.isCost &&
            parseInt(value) <= 3 &&
            parseInt(value) > 0;
          const bgClass = isLow ? "bg-red-50 border border-red-200" : "";

          let inputHTML = "";

          if (summaryQuestion.isCost) {
            const fakeField = {
              id: `detail_${detailedHeader}`, // Unique ID for this control
              label: detailedHeader,
              type: "radio",
              options: [
                "1. Rất đắt so với chất lượng",
                "2. Đắt hơn so với chất lượng",
                "3. Tương xứng so với chất lượng",
                "4. Rẻ hơn so với chất lượng",
                "5. Không tự chi trả / Không biết",
                "6. Ý kiến khác",
              ],
            };
            inputHTML = this.renderInputControl(fakeField, value, true);
          } else {
            const scoreValues =
              formType === "form3" ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5];
            const radioName = `edit_detail_${detailedHeader.replace(/[^a-zA-Z0-9]/g, "_")}`; // Sanitize name
            inputHTML = `<div class="flex flex-wrap gap-2 mt-2">
                  ${scoreValues
                    .map((v) => {
                      const isChecked =
                        String(value) === String(v) ? "checked" : "";
                      const uniqueId = `${radioName}_${v}`;
                      let activeColor =
                        v <= 3 && v > 0
                          ? "peer-checked:bg-red-500 peer-checked:text-white peer-checked:border-red-500 peer-checked:ring-2 peer-checked:ring-red-200"
                          : "peer-checked:bg-teal-600 peer-checked:text-white peer-checked:border-teal-600 peer-checked:ring-2 peer-checked:ring-teal-200";

                      return `
                          <div class="relative">
                              <input type="radio" name="${radioName}" id="${uniqueId}" value="${v}" ${isChecked} class="peer hidden">
                              <label for="${uniqueId}" class="w-10 h-10 rounded-full flex items-center justify-center font-bold cursor-pointer transition-all border border-transparent select-none bg-gray-100 text-gray-600 hover:bg-gray-200 ${activeColor}">
                                  ${v}
                              </label>
                          </div>
                      `;
                    })
                    .join("")}
              </div>`;
          }

          questionDiv.innerHTML = `
              <div class="${bgClass} p-2 rounded transition-colors duration-300">
                  <div class="font-medium text-sm text-gray-700 mb-1">${detailedHeader}</div>
                  ${inputHTML}
              </div>`;

          sectionDiv.appendChild(questionDiv);
        });
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
      const val = recordData[field.id] || "";
      const fieldHtml = this.renderInputControl(field, val);
      const wrapper = document.createElement("div");
      wrapper.innerHTML = fieldHtml;
      footerStack.appendChild(wrapper);
    });
    footerDiv.appendChild(footerStack);
    container.appendChild(footerDiv);
  },

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
                      `<option value="${opt}" ${opt == currentValue ? "selected" : ""}>${opt}</option>`,
                  )
                  .join("")}
            </select>`;
        break;

      case "radio":
        html += `<div class="space-y-2 mt-1">
                ${field.options
                  .map((opt, index) => {
                    const uniqueId = `${name}_opt_${index}`;
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

  async saveSingleEdit() {
    if (!this.editId) return;

    const record = db.cache.find((r) => String(r.id) === String(this.editId));
    if (!record) {
      alert("Lỗi: Không tìm thấy bản ghi gốc!");
      return;
    }

    try {
      let pythonData = JSON.parse(record.python_data || "{}");

      const formStruct =
        record.type === "form1"
          ? form1Structure
          : record.type === "form2"
            ? form2Structure
            : form3Structure;

      const modalContainer = document.getElementById("edit-form-container");
      const updates = {}; // This object will be sent to Google Sheets

      // Helper to get values from the form
      const getControlValue = (name) => {
        const radioChecked = modalContainer.querySelector(
          `input[name="${name}"]:checked`,
        );
        if (radioChecked) return radioChecked.value;
        const element = modalContainer.querySelector(`[name="${name}"]`);
        return element ? element.value : "";
      };

      // --- 1. Save Demographics ---
      formStruct.demographics.forEach((field) => {
        const val = getControlValue(`edit_${field.id}`);
        pythonData[field.id] = val;
        if (field.mapToHeader) {
          updates[field.mapToHeader] = val;
        } else {
          // Fallback for fields like kieu_khao_sat
          if (field.id === "kieu_khao_sat") updates["Kiểu khảo sát"] = val;
          if (field.id === "nguoipv")
            updates["Người phỏng vấn/điền phiếu"] = val;
          if (field.id === "nguoi_tra_loi") updates["Người trả lời"] = val;
        }
      });

      // --- 2. Save **DETAILED** Section Questions ---
      formStruct.sections.forEach((section) => {
        section.questions.forEach((summaryQuestion) => {
          let firstValue = null; // To update the summary score in python_data
          summaryQuestion.mapToHeaders.forEach((detailedHeader, index) => {
            let val;
            if (summaryQuestion.isCost) {
              val = getControlValue(`edit_detail_${detailedHeader}`);
            } else {
              const radioName = `edit_detail_${detailedHeader.replace(/[^a-zA-Z0-9]/g, "_")}`;
              val = getControlValue(radioName);
            }

            // This updates the Google Sheet column
            updates[detailedHeader] = val;

            if (index === 0) {
              firstValue = val;
            }
          });
          // Update the summary score in python_data with the score of the first detailed question
          pythonData[summaryQuestion.id] = firstValue;
        });
      });

      // --- 3. Save Footer ---
      formStruct.footer.forEach((field) => {
        const val = getControlValue(`edit_${field.id}`);
        pythonData[field.id] = val;
        if (field.mapToHeader) {
          updates[field.mapToHeader] = val;
        }
      });

      updates["python_data"] = JSON.stringify(pythonData);

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
