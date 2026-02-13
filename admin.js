// ========================================
// ADMIN OBJECT
// ========================================

const ADMIN_CREDENTIAL = {
  username: "admin",
  password: "admin123", // đổi mật khẩu mặc định
};

const admin = {
  auth: false,
  selected: [],
  editId: null,

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
      this.filterTable();
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

  // Filter table
  filterTable() {
    const searchText = document
      .getElementById("searchInput")
      .value.toLowerCase();
    const formType = document.getElementById("filterFormType").value;

    const data = db.cache.filter((record) => {
      const matchesType = formType === "all" || record.type === formType;
      const matchesSearch =
        !searchText ||
        JSON.stringify(record).toLowerCase().includes(searchText);
      return matchesType && matchesSearch;
    });

    this.renderTable(data);
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
      this.selected = db.cache.map((record) => record.id);
    } else {
      this.selected = [];
    }
    this.filterTable();
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
  // EDIT MODAL: XỬ LÝ SỬA TOÀN BỘ (FULL EDIT)
  // ============================================

  // Open edit modal for single record (Đã sửa lỗi ID String/Number)
  openEditModal(id) {
    this.editId = id;
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
          // Điểm số 1-5
          inputHTML = `
                <div class="flex flex-wrap gap-2 mt-2">
                    ${scoreValues
                      .map((v) => {
                        const checked = value == v ? "checked" : "";
                        let colorClass = "bg-gray-100 hover:bg-gray-200";
                        if (v <= 3 && v > 0)
                          colorClass =
                            "bg-red-100 hover:bg-red-200 text-red-700 border-red-200";
                        if (checked)
                          colorClass =
                            "bg-teal-600 text-white ring-2 ring-teal-300 ring-offset-1";

                        return `
                            <label class="${colorClass} w-10 h-10 rounded-full flex items-center justify-center font-bold cursor-pointer transition-all border border-transparent">
                                <input type="radio" name="edit_${question.id}" value="${v}" ${checked} class="hidden">
                                ${v}
                            </label>
                        `;
                      })
                      .join("")}
                </div>
            `;
        }

        questionDiv.innerHTML = `
                    <div class="${bgClass} p-2 rounded">
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
                ${field.options.map((opt) => `<option value="${opt}" ${opt === currentValue ? "selected" : ""}>${opt}</option>`).join("")}
            </select>`;
        break;

      case "radio":
        html += `<div class="space-y-1 mt-1">
                ${field.options
                  .map(
                    (
                      opt,
                    ) => `<label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input type="radio" name="${name}" value="${opt}" ${opt === currentValue ? "checked" : ""} class="text-teal-600 focus:ring-teal-500 h-4 w-4">
                        <span class="text-sm text-gray-700">${opt}</span>
                    </label>`,
                  )
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

      const getValue = (fieldId, type) => {
        const name = `edit_${fieldId}`;
        if (type === "radio") {
          const el = document.querySelector(`input[name="${name}"]:checked`);
          return el ? el.value : "";
        } else {
          const el = document.querySelector(`[name="${name}"]`);
          return el ? el.value : "";
        }
      };

      // 1. Update Demographics
      formStruct.demographics.forEach((field) => {
        pythonData[field.id] = getValue(field.id, field.type);
      });

      // 2. Update Sections
      formStruct.sections.forEach((section) => {
        section.questions.forEach((q) => {
          pythonData[q.id] = getValue(q.id, "radio");
        });
      });

      // 3. Update Footer
      formStruct.footer.forEach((field) => {
        pythonData[field.id] = getValue(field.id, field.type);
      });

      await db.update([this.editId], {
        python_data: JSON.stringify(pythonData),
      });

      document.getElementById("editRecordModal").classList.add("hidden");
      app.showToast("Thành công", "Đã cập nhật chi tiết phiếu");
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
